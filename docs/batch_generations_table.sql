-- Create batch_generations table for tracking OpenAI batch jobs
CREATE TABLE IF NOT EXISTS batch_generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  batch_id TEXT NOT NULL UNIQUE,
  input_file_id TEXT NOT NULL,
  output_file_id TEXT,
  error_file_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('validating', 'failed', 'in_progress', 'finalizing', 'completed', 'expired', 'cancelling', 'cancelled')),
  total_requests INTEGER NOT NULL,
  completed_requests INTEGER,
  failed_requests INTEGER,
  estimated_cost DECIMAL(10,4) NOT NULL,
  actual_cost DECIMAL(10,4),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_batch_generations_tenant_id ON batch_generations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_batch_generations_batch_id ON batch_generations(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_generations_status ON batch_generations(status);
CREATE INDEX IF NOT EXISTS idx_batch_generations_created_at ON batch_generations(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE batch_generations ENABLE ROW LEVEL SECURITY;

-- Create RLS policy to ensure tenants can only access their own batch generations
CREATE POLICY "Tenants can only access their own batch generations" ON batch_generations
  FOR ALL USING (tenant_id = (
    SELECT tenant_id FROM tenants 
    WHERE auth_user_id = auth.uid()
  ));

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_batch_generations_updated_at 
  BEFORE UPDATE ON batch_generations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add batch_job_id field to properties table to track which batch generated the AI description
ALTER TABLE properties ADD COLUMN IF NOT EXISTS batch_job_id TEXT;
CREATE INDEX IF NOT EXISTS idx_properties_batch_job_id ON properties(batch_job_id);