"use server";

import { createClient } from '@/lib/supabase/server';
import { getTenantByAuthUserId } from '@/lib/dal/tenants';
import { getPropertiesByTenantId } from '@/lib/dal/properties';
import { createBatchGeneration, getActiveBatchGenerations } from '@/lib/dal/batch-generations';
import { OpenAIBatchClient, PropertyData } from '@/lib/ai/openai-batch';
import { ActionResult, createSuccessResult, createErrorResult } from '@/lib/types/actions';
import { handleServerActionError, requireAuth, requireTenant, ConflictError } from '@/lib/utils/error-handler';

export interface AIGenerationResult {
  batchId: string;
  totalProperties: number;
  estimatedCost: number;
  estimatedTokens: number;
  batchGenerationId: string;
}

export interface AIGenerationStatusResult {
  activeBatches: number;
  pendingProperties: number;
  batches: any[];
}

export async function generateDescriptionsAction(
  propertyIds?: string[]
): Promise<ActionResult<AIGenerationResult>> {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return createErrorResult('認証が必要です');
    }

    // Get tenant
    const tenant = await getTenantByAuthUserId(user.id);
    if (!tenant) {
      return createErrorResult('テナントが見つかりません');
    }

    // Check for active batch jobs
    const activeBatches = await getActiveBatchGenerations(tenant.id);
    if (activeBatches.length > 0) {
      throw new ConflictError('現在処理中のバッチジョブがあります。完了後に再試行してください。');
    }

    let properties: PropertyData[];

    if (propertyIds && propertyIds.length > 0) {
      // Get specific properties by IDs
      const { data, error } = await supabase
        .from('properties')
        .select('id, name, address, property_type, price, size, rooms, description')
        .eq('tenant_id', tenant.id)
        .in('id', propertyIds)
        .is('ai_description', null);

      if (error) {
        throw new Error(`物件の取得に失敗しました: ${error.message}`);
      }

      properties = data || [];
    } else {
      // Get all properties without AI descriptions
      const allProperties = await getPropertiesByTenantId(tenant.id, 1000, 0);
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
        }));
    }

    if (properties.length === 0) {
      return createErrorResult('AI生成が必要な物件が見つかりません。');
    }

    // Validate OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return createErrorResult('OpenAI API keyが設定されていません');
    }

    // Initialize OpenAI Batch Client
    const batchClient = new OpenAIBatchClient();

    // Estimate cost
    const costEstimate = batchClient.estimateCost(properties.length);

    // Create batch requests
    const batchRequests = batchClient.createBatchRequests(properties);

    // Submit batch job to OpenAI
    const { batchId, inputFileId } = await batchClient.submitBatchJob(batchRequests);

    // Save batch generation record
    const batchGeneration = await createBatchGeneration({
      tenant_id: tenant.id,
      batch_id: batchId,
      input_file_id: inputFileId,
      status: 'validating',
      total_requests: properties.length,
      estimated_cost: costEstimate.estimatedCost
    });

    // Update properties with batch job ID
    await supabase
      .from('properties')
      .update({ batch_job_id: batchId })
      .in('id', properties.map(p => p.id));

    const result: AIGenerationResult = {
      batchId,
      totalProperties: properties.length,
      estimatedCost: costEstimate.estimatedCost,
      estimatedTokens: costEstimate.estimatedTokens,
      batchGenerationId: batchGeneration.id
    };

    return createSuccessResult(result, `${properties.length}件の物件のAI生成を開始しました。`);

  } catch (error) {
    console.error('AI generation error:', error);
    return handleServerActionError(error);
  }
}

export async function getGenerationStatusAction(): Promise<ActionResult<AIGenerationStatusResult>> {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return createErrorResult('認証が必要です');
    }

    // Get tenant
    const tenant = await getTenantByAuthUserId(user.id);
    if (!tenant) {
      return createErrorResult('テナントが見つかりません');
    }

    // Get active batch generations
    const activeBatches = await getActiveBatchGenerations(tenant.id);

    // Count properties without AI descriptions
    const { count, error } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenant.id)
      .is('ai_description', null);

    if (error) {
      throw new Error(`物件数の取得に失敗しました: ${error.message}`);
    }

    const result: AIGenerationStatusResult = {
      activeBatches: activeBatches.length,
      pendingProperties: count || 0,
      batches: activeBatches
    };

    return createSuccessResult(result);

  } catch (error) {
    console.error('Get generation status error:', error);
    return handleServerActionError(error);
  }
}