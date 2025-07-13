import { createClient } from "@/lib/supabase/server";
import { Database } from "@/lib/types/database";

type LineChannel = Database['public']['Tables']['line_channels']['Row'];
type InsertLineChannel = Database['public']['Tables']['line_channels']['Insert'];
type UpdateLineChannel = Database['public']['Tables']['line_channels']['Update'];

// Get LINE channel by tenant ID (no cache for now)
export async function getLineChannelByTenantId(tenantId: string): Promise<LineChannel | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('line_channels')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();
  
  if (error) {
    console.error('Error fetching LINE channel:', error);
    return null;
  }
  
  return data;
}

// Create or update LINE channel
export async function upsertLineChannel(
  tenantId: string,
  channelData: {
    channel_id: string;
    channel_secret: string;
    access_token: string;
  }
): Promise<LineChannel | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('line_channels')
    .upsert({
      tenant_id: tenantId,
      ...channelData,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error('Error upserting LINE channel:', error);
    return null;
  }

  // No cache invalidation needed
  return data;
}

// Update LINE channel status
export async function updateLineChannelStatus(
  tenantId: string,
  isActive: boolean
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('line_channels')
    .update({
      is_active: isActive,
    })
    .eq('tenant_id', tenantId);

  if (error) {
    console.error('Error updating LINE channel status:', error);
    return false;
  }

  // No cache invalidation needed
  return true;
}

// Delete LINE channel
export async function deleteLineChannel(tenantId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('line_channels')
    .delete()
    .eq('tenant_id', tenantId);

  if (error) {
    console.error('Error deleting LINE channel:', error);
    return false;
  }

  // No cache invalidation needed
  return true;
}