import { createClient } from '@/lib/supabase/server'

export interface UsageToken {
  id: string
  tenant_id: string
  tokens_used: number
  tokens_limit: number
  additional_tokens: number
  reset_date: string
  created_at: string
  updated_at: string
  remaining: number
}

export async function createInitialUsageTokens(tenantId: string): Promise<UsageToken> {
  const supabase = await createClient()
  
  // Create usage tokens record with trial limits (700k tokens)
  const resetDate = new Date()
  resetDate.setMonth(resetDate.getMonth() + 1) // 1ヶ月後にリセット
  
  const { data, error } = await supabase
    .from('usage_tokens')
    .insert({
      tenant_id: tenantId,
      tokens_used: 0,
      tokens_limit: 700000, // 700k tokens for trial
      additional_tokens: 0,
      reset_date: resetDate.toISOString()
    })
    .select('*, remaining')
    .single()

  if (error) {
    throw new Error(`Failed to create initial usage tokens: ${error.message}`)
  }

  return data
}

export async function getUsageTokensByTenantId(tenantId: string): Promise<UsageToken | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('usage_tokens')
    .select('*, remaining')
    .eq('tenant_id', tenantId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw new Error(`Failed to get usage tokens: ${error.message}`)
  }

  return data
}