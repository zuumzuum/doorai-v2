import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTenantByAuthUserId } from '@/lib/dal/tenants'
import { getPropertiesByTenantId } from '@/lib/dal/properties'
import { createBatchGeneration, getActiveBatchGenerations } from '@/lib/dal/batch-generations'
import { OpenAIBatchClient, PropertyData } from '@/lib/ai/openai-batch'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get tenant
    const tenant = await getTenantByAuthUserId(user.id)
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Check for active batch jobs
    const activeBatches = await getActiveBatchGenerations(tenant.id)
    if (activeBatches.length > 0) {
      return NextResponse.json(
        { 
          error: '現在処理中のバッチジョブがあります。完了後に再試行してください。',
          activeBatches: activeBatches.length
        },
        { status: 409 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { propertyIds } = body

    let properties: PropertyData[]

    if (propertyIds && Array.isArray(propertyIds) && propertyIds.length > 0) {
      // Get specific properties by IDs
      const { data, error } = await supabase
        .from('properties')
        .select('id, name, address, property_type, price, size, rooms, description')
        .eq('tenant_id', tenant.id)
        .in('id', propertyIds)
        .is('ai_description', null)

      if (error) {
        throw new Error(`Failed to get properties: ${error.message}`)
      }

      properties = data || []
    } else {
      // Get all properties without AI descriptions
      const allProperties = await getPropertiesByTenantId(tenant.id, 1000, 0)
      properties = allProperties
        .filter(p => !p.ai_description)
        .map(p => ({
          id: p.id,
          name: p.name,
          address: p.address,
          property_type: p.property_type,
          price: p.price,
          size: p.size,
          rooms: p.rooms,
          description: p.description
        }))
    }

    if (properties.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'AI生成が必要な物件が見つかりません。',
        totalProperties: 0
      })
    }

    // Validate OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Initialize OpenAI Batch Client
    const batchClient = new OpenAIBatchClient()

    // Estimate cost
    const costEstimate = batchClient.estimateCost(properties.length)

    // Create batch requests
    const batchRequests = batchClient.createBatchRequests(properties)

    // Submit batch job to OpenAI
    const { batchId, inputFileId } = await batchClient.submitBatchJob(batchRequests)

    // Save batch generation record
    const batchGeneration = await createBatchGeneration({
      tenant_id: tenant.id,
      batch_id: batchId,
      input_file_id: inputFileId,
      status: 'validating',
      total_requests: properties.length,
      estimated_cost: costEstimate.estimatedCost
    })

    // Update properties with batch job ID
    await supabase
      .from('properties')
      .update({ batch_job_id: batchId })
      .in('id', properties.map(p => p.id))

    return NextResponse.json({
      success: true,
      message: `${properties.length}件の物件のAI生成を開始しました。`,
      batchId,
      totalProperties: properties.length,
      estimatedCost: costEstimate.estimatedCost,
      estimatedTokens: costEstimate.estimatedTokens,
      batchGenerationId: batchGeneration.id
    })

  } catch (error) {
    console.error('AI generation error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false 
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get tenant
    const tenant = await getTenantByAuthUserId(user.id)
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Get active batch generations
    const activeBatches = await getActiveBatchGenerations(tenant.id)

    // Count properties without AI descriptions
    const { count, error } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenant.id)
      .is('ai_description', null)

    if (error) {
      throw new Error(`Failed to count properties: ${error.message}`)
    }

    return NextResponse.json({
      activeBatches: activeBatches.length,
      pendingProperties: count || 0,
      batches: activeBatches
    })

  } catch (error) {
    console.error('Get batch status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}