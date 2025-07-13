import { createClient } from '@/lib/supabase/server'
import { cache } from 'react'

export interface Tenant {
  id: string
  auth_user_id: string
  name: string
  email: string
  company_name?: string
  created_at: string
  updated_at: string
}

export async function createTenant(authUserId: string, name: string, email: string, companyName?: string): Promise<Tenant> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('tenants')
    .insert({
      auth_user_id: authUserId,
      name,
      email,
      company_name: companyName
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create tenant: ${error.message}`)
  }

  return data
}

export const getTenantByAuthUserId = cache(async (authUserId: string): Promise<Tenant | null> => {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('auth_user_id', authUserId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null
    }
    throw new Error(`Failed to get tenant: ${error.message}`)
  }

  return data
})

export async function updateTenant(tenantId: string, updates: Partial<Pick<Tenant, 'name' | 'company_name'>>): Promise<Tenant> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('tenants')
    .update(updates)
    .eq('id', tenantId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update tenant: ${error.message}`)
  }

  return data
}