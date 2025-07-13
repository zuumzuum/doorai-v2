import { createErrorResult, ActionErrorResult } from '@/lib/types/actions';

export class AppError extends Error {
  constructor(
    message: string,
    public code: string = 'UNKNOWN_ERROR',
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class AuthError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 'CONFLICT', 409);
    this.name = 'ConflictError';
  }
}

// Server Actions用エラーハンドラー
export function handleServerActionError(error: unknown): ActionErrorResult {
  console.error('Server Action Error:', error);

  if (error instanceof AppError) {
    return createErrorResult(error.message);
  }

  if (error instanceof Error) {
    // 開発環境でのみ詳細なエラー情報を表示
    const message = process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'Internal server error';
    
    return createErrorResult(message);
  }

  return createErrorResult('An unexpected error occurred');
}

// 認証チェック用ヘルパー
export async function requireAuth(): Promise<any> {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new AuthError('Authentication required');
  }
  
  return user;
}

// テナント検証用ヘルパー
export async function requireTenant(authUserId: string): Promise<any> {
  const { getTenantByAuthUserId } = await import('@/lib/dal/tenants');
  const tenant = await getTenantByAuthUserId(authUserId);
  
  if (!tenant) {
    throw new NotFoundError('Tenant not found');
  }
  
  return tenant;
}

// API Routes用エラーハンドラー（既存のAPI Routesとの互換性のため）
export function handleApiError(error: unknown): Response {
  console.error('API Error:', error);

  if (error instanceof AppError) {
    return Response.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }

  if (error instanceof Error) {
    const message = process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'Internal server error';
    
    return Response.json(
      { error: message },
      { status: 500 }
    );
  }

  return Response.json(
    { error: 'An unexpected error occurred' },
    { status: 500 }
  );
}