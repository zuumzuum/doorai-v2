import { createClient } from '@/lib/supabase/server'
import { cache } from 'react'

export interface BatchGeneration {
  id: string
  tenant_id: string
  batch_id: string
  input_file_id: string
  output_file_id?: string
  error_file_id?: string
  status: 'validating' | 'failed' | 'in_progress' | 'finalizing' | 'completed' | 'expired' | 'cancelling' | 'cancelled'
  total_requests: number
  completed_requests?: number
  failed_requests?: number
  estimated_cost: number
  actual_cost?: number
  created_at: string
  updated_at: string
  completed_at?: string
}

export interface CreateBatchGenerationData {
  tenant_id: string
  batch_id: string
  input_file_id: string
  status: 'validating' | 'in_progress'
  total_requests: number
  estimated_cost: number
}

export async function createBatchGeneration(data: CreateBatchGenerationData): Promise<BatchGeneration> {
  const supabase = await createClient()
  
  const { data: batchGeneration, error } = await supabase
    .from('batch_generations')
    .insert(data)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create batch generation: ${error.message}`)
  }

  return batchGeneration
}

export async function updateBatchGeneration(
  id: string, 
  updates: Partial<Omit<BatchGeneration, 'id' | 'tenant_id' | 'created_at'>>
): Promise<BatchGeneration> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('batch_generations')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update batch generation: ${error.message}`)
  }

  return data
}

export async function getBatchGenerationByBatchId(batchId: string): Promise<BatchGeneration | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('batch_generations')
    .select('*')
    .eq('batch_id', batchId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw new Error(`Failed to get batch generation: ${error.message}`)
  }

  return data
}

export const getBatchGenerationsByTenantId = cache(async (
  tenantId: string, 
  limit = 20, 
  offset = 0
): Promise<BatchGeneration[]> => {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('batch_generations')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    throw new Error(`Failed to get batch generations: ${error.message}`)
  }

  return data || []
})

export const getActiveBatchGenerations = cache(async (tenantId: string): Promise<BatchGeneration[]> => {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('batch_generations')
    .select('*')
    .eq('tenant_id', tenantId)
    .in('status', ['validating', 'in_progress', 'finalizing'])
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to get active batch generations: ${error.message}`)
  }

  return data || []
})

export async function deleteBatchGeneration(id: string): Promise<void> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('batch_generations')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete batch generation: ${error.message}`)
  }
}