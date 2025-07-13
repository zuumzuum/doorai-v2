"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { createClient } from '@/lib/supabase'
import type { Tenant } from '@/lib/dal/tenants'

interface TenantContextType {
  tenant: Tenant | null
  loading: boolean
  refetch: () => Promise<void>
}

const TenantContext = createContext<TenantContextType>({
  tenant: null,
  loading: true,
  refetch: async () => {},
})

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchTenant = async () => {
    if (!user) {
      setTenant(null)
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('auth_user_id', user.id)
        .single()

      if (error) {
        if (error.code !== 'PGRST116') {
          console.error('Error fetching tenant:', error)
        }
        setTenant(null)
      } else {
        setTenant(data)
      }
    } catch (error) {
      console.error('Error fetching tenant:', error)
      setTenant(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTenant()
  }, [user])

  const refetch = async () => {
    setLoading(true)
    await fetchTenant()
  }

  return (
    <TenantContext.Provider value={{ tenant, loading, refetch }}>
      {children}
    </TenantContext.Provider>
  )
}

export const useTenant = () => {
  const context = useContext(TenantContext)
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider')
  }
  return context
}