import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTenantByAuthUserId } from '@/lib/dal/tenants'
import { createPropertiesInChunks } from '@/lib/dal/properties'
import { StreamingCSVParser } from '@/lib/streaming-csv-parser'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get tenant
    const tenant = await getTenantByAuthUserId(user.id)
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a CSV file.' },
        { status: 400 }
      )
    }

    // Validate file size (max 50MB for streaming)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 50MB.' },
        { status: 400 }
      )
    }

    // Initialize streaming parser
    const parser = new StreamingCSVParser({
      chunkSize: 500,
      onProgress: (processed) => {
        // Progress callback could be used for real-time updates
        console.log(`Processed ${processed} rows`)
      }
    })

    // Parse CSV using streaming approach
    const parseResult = await parser.parseFile(file)
    
    if (parseResult.errors.length > 0 && parseResult.validRows === 0) {
      return NextResponse.json({
        success: false,
        errors: parseResult.errors,
        totalRows: parseResult.totalRows,
        validRows: parseResult.validRows,
        importedRows: 0
      })
    }

    // Prepare properties for insertion
    const propertiesToInsert = parseResult.data.map(property => ({
      ...property,
      tenant_id: tenant.id,
      status: 'draft' as const
    }))

    let importedProperties: any[] = []
    let chunkErrors: Array<{ chunk: number, error: string }> = []
    
    if (propertiesToInsert.length > 0) {
      try {
        // Use chunked insertion for better performance and reliability
        const insertResult = await createPropertiesInChunks(propertiesToInsert, 500)
        importedProperties = insertResult.success
        chunkErrors = insertResult.errors
        
        if (chunkErrors.length > 0) {
          console.error('Chunk insertion errors:', chunkErrors)
        }
      } catch (dbError) {
        console.error('Database error:', dbError)
        return NextResponse.json({
          success: false,
          error: 'Failed to save properties to database',
          errors: parseResult.errors,
          totalRows: parseResult.totalRows,
          validRows: parseResult.validRows,
          importedRows: 0
        })
      }
    }

    // Combine parsing errors and chunk errors
    const allErrors = [
      ...parseResult.errors,
      ...chunkErrors.map(chunkError => ({
        row: 0,
        field: 'database',
        message: chunkError.error
      }))
    ]

    return NextResponse.json({
      success: true,
      message: `${importedProperties.length}件の物件をインポートしました${chunkErrors.length > 0 ? `（${chunkErrors.length}個のチャンクでエラーが発生）` : ''}`,
      errors: allErrors,
      totalRows: parseResult.totalRows,
      validRows: parseResult.validRows,
      importedRows: importedProperties.length,
      properties: importedProperties.slice(0, 10) // Return first 10 for preview
    })

  } catch (error) {
    console.error('CSV import error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}