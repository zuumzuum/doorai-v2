-- Create RPC function for atomic token usage increment with limit checking
CREATE OR REPLACE FUNCTION increment_token_usage(
  p_tenant_id UUID,
  p_tokens_to_add INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_used INTEGER;
  v_current_limit INTEGER;
  v_additional_tokens INTEGER;
  v_new_used INTEGER;
  v_remaining INTEGER;
BEGIN
  -- Lock the row for update to ensure exclusive access
  SELECT tokens_used, tokens_limit, additional_tokens
  INTO v_current_used, v_current_limit, v_additional_tokens
  FROM usage_tokens
  WHERE tenant_id = p_tenant_id
  FOR UPDATE;

  -- Check if record exists
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Token usage record not found'
    );
  END IF;

  -- Calculate new usage
  v_new_used := v_current_used + p_tokens_to_add;
  
  -- Check if within limits
  IF v_new_used > (v_current_limit + v_additional_tokens) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Token limit exceeded',
      'current_used', v_current_used,
      'limit', v_current_limit + v_additional_tokens,
      'requested', p_tokens_to_add
    );
  END IF;

  -- Update the usage
  UPDATE usage_tokens
  SET 
    tokens_used = v_new_used,
    updated_at = NOW()
  WHERE tenant_id = p_tenant_id;

  -- Calculate remaining tokens
  v_remaining := (v_current_limit + v_additional_tokens) - v_new_used;

  RETURN json_build_object(
    'success', true,
    'tokens_used', v_new_used,
    'tokens_limit', v_current_limit + v_additional_tokens,
    'remaining', v_remaining
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_token_usage TO authenticated;

-- Add comment
COMMENT ON FUNCTION increment_token_usage IS 'Atomically increment token usage with limit checking for a tenant';