// Server Actions 共通型定義

export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ActionErrorResult {
  success: false;
  error: string;
  validationErrors?: ValidationError[];
}

export interface ActionSuccessResult<T = any> {
  success: true;
  data?: T;
  message?: string;
}

// Helper functions for consistent response creation
export function createSuccessResult<T>(data?: T, message?: string): ActionSuccessResult<T> {
  return {
    success: true,
    data,
    message
  };
}

export function createErrorResult(error: string, validationErrors?: ValidationError[]): ActionErrorResult {
  return {
    success: false,
    error,
    validationErrors
  };
}

// Zod validation helper (commented out until zod is installed)
// export function validateWithZod<T>(
//   schema: import('zod').ZodSchema<T>,
//   data: unknown
// ): { success: true; data: T } | { success: false; errors: ValidationError[] } {
//   const result = schema.safeParse(data);
//   
//   if (result.success) {
//     return { success: true, data: result.data };
//   } else {
//     const errors: ValidationError[] = result.error.errors.map((err: any) => ({
//       field: err.path.join('.'),
//       message: err.message
//     }));
//     return { success: false, errors };
//   }
// }