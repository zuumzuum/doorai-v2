import { createClient } from '@/lib/supabase/server'
import { cache } from 'react'

export interface Property {
  id: string
  tenant_id: string
  name: string
  address: string
  property_type: string
  price?: number
  size?: number
  rooms?: number
  description?: string
  ai_description?: string
  batch_job_id?: string
  status: 'draft' | 'published' | 'archived'
  created_at: string
  updated_at: string
}

export interface CreatePropertyData {
  tenant_id: string
  name: string
  address: string
  property_type: string
  price?: number
  size?: number
  rooms?: number
  description?: string
  status?: 'draft' | 'published'
}

export async function createProperty(data: CreatePropertyData): Promise<Property> {
  const supabase = await createClient()
  
  const { data: property, error } = await supabase
    .from('properties')
    .insert(data)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create property: ${error.message}`)
  }

  return property
}

export async function createProperties(properties: CreatePropertyData[]): Promise<Property[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('properties')
    .insert(properties)
    .select()

  if (error) {
    throw new Error(`Failed to create properties: ${error.message}`)
  }

  return data
}

export async function createPropertiesInChunks(
  properties: CreatePropertyData[], 
  chunkSize: number = 500
): Promise<{ success: Property[], errors: Array<{ chunk: number, error: string }> }> {
  const supabase = await createClient()
  const success: Property[] = []
  const errors: Array<{ chunk: number, error: string }> = []

  // Split properties into chunks
  const chunks: CreatePropertyData[][] = []
  for (let i = 0; i < properties.length; i += chunkSize) {
    chunks.push(properties.slice(i, i + chunkSize))
  }

  // Process each chunk
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    try {
      const { data, error } = await supabase
        .from('properties')
        .insert(chunk)
        .select()

      if (error) {
        errors.push({
          chunk: i + 1,
          error: `Chunk ${i + 1} failed: ${error.message}`
        })
      } else {
        success.push(...data)
      }
    } catch (dbError) {
      errors.push({
        chunk: i + 1,
        error: `Chunk ${i + 1} failed: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`
      })
    }
  }

  return { success, errors }
}

export const getPropertiesByTenantId = cache(async (tenantId: string, limit = 50, offset = 0): Promise<Property[]> => {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    throw new Error(`Failed to get properties: ${error.message}`)
  }

  return data || []
})

export async function updateProperty(id: string, updates: Partial<Omit<Property, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>>): Promise<Property> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('properties')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update property: ${error.message}`)
  }

  return data
}

export async function deleteProperty(id: string): Promise<void> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('properties')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete property: ${error.message}`)
  }
}