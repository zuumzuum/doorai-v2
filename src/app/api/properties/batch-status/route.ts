import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTenantByAuthUserId } from '@/lib/dal/tenants'
import { 
  getBatchGenerationByBatchId, 
  updateBatchGeneration, 
  getActiveBatchGenerations 
} from '@/lib/dal/batch-generations'
import { OpenAIBatchClient, BatchJobResponse } from '@/lib/ai/openai-batch'

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

    const { searchParams } = new URL(request.url)
    const batchId = searchParams.get('batchId')

    if (!batchId) {
      return NextResponse.json(
        { error: 'Batch ID is required' },
        { status: 400 }
      )
    }

    // Get batch generation record
    const batchGeneration = await getBatchGenerationByBatchId(batchId)
    if (!batchGeneration) {
      return NextResponse.json(
        { error: 'Batch generation not found' },
        { status: 404 }
      )
    }

    // Verify tenant ownership
    if (batchGeneration.tenant_id !== tenant.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Check OpenAI batch status
    const batchClient = new OpenAIBatchClient()
    const batchStatus = await batchClient.getBatchStatus(batchId)

    // Update local record if status changed
    if (batchStatus.status !== batchGeneration.status) {
      const updates: any = {
        status: batchStatus.status,
        updated_at: new Date().toISOString()
      }

      if (batchStatus.outputFileId) {
        updates.output_file_id = batchStatus.outputFileId
      }

      if (batchStatus.errorFileId) {
        updates.error_file_id = batchStatus.errorFileId
      }

      if (batchStatus.requestCounts) {
        updates.completed_requests = batchStatus.requestCounts.completed
        updates.failed_requests = batchStatus.requestCounts.failed
      }

      if (batchStatus.status === 'completed') {
        updates.completed_at = new Date().toISOString()
      }

      await updateBatchGeneration(batchGeneration.id, updates)
    }

    return NextResponse.json({
      batchId,
      status: batchStatus.status,
      outputFileId: batchStatus.outputFileId,
      errorFileId: batchStatus.errorFileId,
      requestCounts: batchStatus.requestCounts,
      localRecord: {
        ...batchGeneration,
        status: batchStatus.status
      }
    })

  } catch (error) {
    console.error('Batch status check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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

    const body = await request.json()
    const { batchId, action } = body

    if (!batchId) {
      return NextResponse.json(
        { error: 'Batch ID is required' },
        { status: 400 }
      )
    }

    // Get batch generation record
    const batchGeneration = await getBatchGenerationByBatchId(batchId)
    if (!batchGeneration) {
      return NextResponse.json(
        { error: 'Batch generation not found' },
        { status: 404 }
      )
    }

    // Verify tenant ownership
    if (batchGeneration.tenant_id !== tenant.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const batchClient = new OpenAIBatchClient()

    if (action === 'process_results' && batchGeneration.output_file_id) {
      // Process completed batch results
      const results: BatchJobResponse[] = await batchClient.getBatchResults(batchGeneration.output_file_id)
      
      let successCount = 0
      let errorCount = 0

      // Process each result
      for (const result of results) {
        if (result.error) {
          console.error(`Property ${result.custom_id} generation failed:`, result.error)
          errorCount++
          continue
        }

        if (result.response?.body?.choices?.[0]?.message?.content) {
          const propertyId = result.custom_id.replace('property-', '')
          const aiDescription = result.response.body.choices[0].message.content

          // Update property with AI description
          await supabase
            .from('properties')
            .update({ 
              ai_description: aiDescription,
              batch_job_id: null
            })
            .eq('id', propertyId)
            .eq('tenant_id', tenant.id)

          successCount++
        } else {
          errorCount++
        }
      }

      // Update batch generation record
      await updateBatchGeneration(batchGeneration.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        actual_cost: batchGeneration.estimated_cost // TODO: Calculate actual cost
      })

      return NextResponse.json({
        success: true,
        message: `処理完了: ${successCount}件成功, ${errorCount}件失敗`,
        successCount,
        errorCount,
        totalResults: results.length
      })
    }

    if (action === 'cancel') {
      // Cancel batch job
      await batchClient.cancelBatchJob(batchId)
      
      await updateBatchGeneration(batchGeneration.id, {
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })

      return NextResponse.json({
        success: true,
        message: 'バッチジョブをキャンセルしました'
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Batch action error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}