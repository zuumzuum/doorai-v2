"use server";

import { createClient } from '@/lib/supabase/server';
import { getTenantByAuthUserId } from '@/lib/dal/tenants';
import { getBatchGenerationByBatchId, updateBatchGeneration } from '@/lib/dal/batch-generations';
import { OpenAIBatchClient, BatchJobResponse } from '@/lib/ai/openai-batch';
import { ActionResult, createSuccessResult, createErrorResult } from '@/lib/types/actions';
import { handleServerActionError, requireAuth, requireTenant, NotFoundError } from '@/lib/utils/error-handler';

export interface BatchStatusResult {
  batchId: string;
  status: string;
  outputFileId?: string;
  errorFileId?: string;
  requestCounts?: {
    total: number;
    completed: number;
    failed: number;
  };
  localRecord: any;
}

export interface ProcessResultsResult {
  successCount: number;
  errorCount: number;
  totalResults: number;
}

export async function getBatchStatusAction(batchId: string): Promise<ActionResult<BatchStatusResult>> {
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

    if (!batchId) {
      return createErrorResult('バッチIDが必要です');
    }

    // Get batch generation record
    const batchGeneration = await getBatchGenerationByBatchId(batchId);
    if (!batchGeneration) {
      throw new NotFoundError('バッチジョブが見つかりません');
    }

    // Verify tenant ownership
    if (batchGeneration.tenant_id !== tenant.id) {
      return createErrorResult('このバッチジョブにアクセスする権限がありません');
    }

    // Check OpenAI batch status
    const batchClient = new OpenAIBatchClient();
    const batchStatus = await batchClient.getBatchStatus(batchId);

    // Update local record if status changed
    if (batchStatus.status !== batchGeneration.status) {
      const updates: any = {
        status: batchStatus.status,
        updated_at: new Date().toISOString()
      };

      if (batchStatus.outputFileId) {
        updates.output_file_id = batchStatus.outputFileId;
      }

      if (batchStatus.errorFileId) {
        updates.error_file_id = batchStatus.errorFileId;
      }

      if (batchStatus.requestCounts) {
        updates.completed_requests = batchStatus.requestCounts.completed;
        updates.failed_requests = batchStatus.requestCounts.failed;
      }

      if (batchStatus.status === 'completed') {
        updates.completed_at = new Date().toISOString();
      }

      await updateBatchGeneration(batchGeneration.id, updates);
    }

    const result: BatchStatusResult = {
      batchId,
      status: batchStatus.status,
      outputFileId: batchStatus.outputFileId,
      errorFileId: batchStatus.errorFileId,
      requestCounts: batchStatus.requestCounts,
      localRecord: {
        ...batchGeneration,
        status: batchStatus.status
      }
    };

    return createSuccessResult(result);

  } catch (error) {
    console.error('Batch status check error:', error);
    return handleServerActionError(error);
  }
}

export async function processBatchResultsAction(batchId: string): Promise<ActionResult<ProcessResultsResult>> {
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

    if (!batchId) {
      return createErrorResult('バッチIDが必要です');
    }

    // Get batch generation record
    const batchGeneration = await getBatchGenerationByBatchId(batchId);
    if (!batchGeneration) {
      throw new NotFoundError('バッチジョブが見つかりません');
    }

    // Verify tenant ownership
    if (batchGeneration.tenant_id !== tenant.id) {
      return createErrorResult('このバッチジョブにアクセスする権限がありません');
    }

    if (!batchGeneration.output_file_id) {
      return createErrorResult('出力ファイルが見つかりません');
    }

    const batchClient = new OpenAIBatchClient();
    
    // Process completed batch results
    const results: BatchJobResponse[] = await batchClient.getBatchResults(batchGeneration.output_file_id);
    
    let successCount = 0;
    let errorCount = 0;

    // Process each result
    for (const result of results) {
      if (result.error) {
        console.error(`Property ${result.custom_id} generation failed:`, result.error);
        errorCount++;
        continue;
      }

      if (result.response?.body?.choices?.[0]?.message?.content) {
        const propertyId = result.custom_id.replace('property-', '');
        const aiDescription = result.response.body.choices[0].message.content;

        // Update property with AI description
        await supabase
          .from('properties')
          .update({ 
            ai_description: aiDescription,
            batch_job_id: null
          })
          .eq('id', propertyId)
          .eq('tenant_id', tenant.id);

        successCount++;
      } else {
        errorCount++;
      }
    }

    // Update batch generation record
    await updateBatchGeneration(batchGeneration.id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      actual_cost: batchGeneration.estimated_cost // TODO: Calculate actual cost
    });

    const processResult: ProcessResultsResult = {
      successCount,
      errorCount,
      totalResults: results.length
    };

    return createSuccessResult(
      processResult,
      `処理完了: ${successCount}件成功, ${errorCount}件失敗`
    );

  } catch (error) {
    console.error('Process batch results error:', error);
    return handleServerActionError(error);
  }
}

export async function cancelBatchAction(batchId: string): Promise<ActionResult<void>> {
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

    if (!batchId) {
      return createErrorResult('バッチIDが必要です');
    }

    // Get batch generation record
    const batchGeneration = await getBatchGenerationByBatchId(batchId);
    if (!batchGeneration) {
      throw new NotFoundError('バッチジョブが見つかりません');
    }

    // Verify tenant ownership
    if (batchGeneration.tenant_id !== tenant.id) {
      return createErrorResult('このバッチジョブにアクセスする権限がありません');
    }

    const batchClient = new OpenAIBatchClient();
    
    // Cancel batch job
    await batchClient.cancelBatchJob(batchId);
    
    await updateBatchGeneration(batchGeneration.id, {
      status: 'cancelled',
      updated_at: new Date().toISOString()
    });

    return createSuccessResult(undefined, 'バッチジョブをキャンセルしました');

  } catch (error) {
    console.error('Cancel batch error:', error);
    return handleServerActionError(error);
  }
}