"use server";

import { createClient } from '@/lib/supabase/server';
import { getTenantByAuthUserId } from '@/lib/dal/tenants';
import { createPropertiesInChunks } from '@/lib/dal/properties';
import { StreamingCSVParser } from '@/lib/streaming-csv-parser';
import { ActionResult, createSuccessResult, createErrorResult } from '@/lib/types/actions';
import { handleServerActionError, requireAuth, requireTenant } from '@/lib/utils/error-handler';

export interface CSVImportResult {
  success: boolean;
  message: string;
  errors?: Array<{
    row: number;
    field: string;
    message: string;
  }>;
  totalRows: number;
  validRows: number;
  importedRows: number;
  properties?: any[];
}

export async function importCSVAction(formData: FormData): Promise<ActionResult<CSVImportResult>> {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return createErrorResult('認証が必要です');
    }

    // Get tenant
    const tenant = await getTenantByAuthUserId(user.id);
    if (!tenant) {
      return createErrorResult('テナントが見つかりません');
    }

    // Parse form data
    const file = formData.get('file') as File;
    
    if (!file) {
      return createErrorResult('ファイルが選択されていません');
    }

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      return createErrorResult('CSVファイルを選択してください');
    }

    // Validate file size (max 50MB for streaming)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return createErrorResult('ファイルサイズが大きすぎます（最大50MB）');
    }

    // Initialize streaming parser
    const parser = new StreamingCSVParser({
      chunkSize: 500,
      onProgress: (processed) => {
        // Progress callback could be used for real-time updates
        console.log(`Processed ${processed} rows`);
      }
    });

    // Parse CSV using streaming approach
    const parseResult = await parser.parseFile(file);
    
    if (parseResult.errors.length > 0 && parseResult.validRows === 0) {
      return createErrorResult('CSVファイルの解析に失敗しました', parseResult.errors);
    }

    // Prepare properties for insertion
    const propertiesToInsert = parseResult.data.map(property => ({
      ...property,
      tenant_id: tenant.id,
      status: 'draft' as const
    }));

    let importedProperties: any[] = [];
    let chunkErrors: Array<{ chunk: number, error: string }> = [];
    
    if (propertiesToInsert.length > 0) {
      // Use chunked insertion for better performance and reliability
      const insertResult = await createPropertiesInChunks(propertiesToInsert, 500);
      importedProperties = insertResult.success;
      chunkErrors = insertResult.errors;
    }

    // Combine parsing errors and chunk errors
    const allErrors = [
      ...parseResult.errors,
      ...chunkErrors.map(chunkError => ({
        row: 0,
        field: 'database',
        message: chunkError.error
      }))
    ];

    const result: CSVImportResult = {
      success: true,
      message: `${importedProperties.length}件の物件をインポートしました${chunkErrors.length > 0 ? `（${chunkErrors.length}個のチャンクでエラーが発生）` : ''}`,
      errors: allErrors,
      totalRows: parseResult.totalRows,
      validRows: parseResult.validRows,
      importedRows: importedProperties.length,
      properties: importedProperties.slice(0, 10) // Return first 10 for preview
    };

    return createSuccessResult(result);

  } catch (error) {
    console.error('CSV import error:', error);
    return handleServerActionError(error);
  }
}