export interface CSVPropertyData {
  name: string
  address: string
  property_type: string
  price?: number
  size?: number
  rooms?: number
  description?: string
}

export interface CSVParseResult {
  data: CSVPropertyData[]
  errors: Array<{
    row: number
    field: string
    message: string
  }>
  totalRows: number
  validRows: number
}

export interface CSVValidationRule {
  field: string
  required: boolean
  type: 'string' | 'number'
  maxLength?: number
  minValue?: number
  maxValue?: number
}

const VALIDATION_RULES: CSVValidationRule[] = [
  { field: 'name', required: true, type: 'string', maxLength: 100 },
  { field: 'address', required: true, type: 'string', maxLength: 200 },
  { field: 'property_type', required: true, type: 'string', maxLength: 50 },
  { field: 'price', required: false, type: 'number', minValue: 0, maxValue: 999999999 },
  { field: 'size', required: false, type: 'number', minValue: 0, maxValue: 10000 },
  { field: 'rooms', required: false, type: 'number', minValue: 0, maxValue: 100 },
  { field: 'description', required: false, type: 'string', maxLength: 1000 },
]

export function parseCSV(csvContent: string): CSVParseResult {
  const lines = csvContent.trim().split('\n')
  
  if (lines.length < 2) {
    return {
      data: [],
      errors: [{ row: 0, field: 'general', message: 'CSVファイルにデータが含まれていません' }],
      totalRows: 0,
      validRows: 0
    }
  }

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  const expectedHeaders = ['name', 'address', 'property_type', 'price', 'size', 'rooms', 'description']
  
  // Header validation
  const missingHeaders = expectedHeaders.filter(h => !headers.includes(h))
  if (missingHeaders.length > 0) {
    return {
      data: [],
      errors: [{ 
        row: 0, 
        field: 'headers', 
        message: `必須列が不足しています: ${missingHeaders.join(', ')}` 
      }],
      totalRows: 0,
      validRows: 0
    }
  }

  const data: CSVPropertyData[] = []
  const errors: Array<{ row: number; field: string; message: string }> = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    
    if (values.length !== headers.length) {
      errors.push({
        row: i + 1,
        field: 'general',
        message: `列数が一致しません。期待値: ${headers.length}, 実際: ${values.length}`
      })
      continue
    }

    const rowData: any = {}
    let hasErrors = false

    headers.forEach((header, index) => {
      const value = values[index]?.trim()
      const rule = VALIDATION_RULES.find(r => r.field === header)
      
      if (rule) {
        const validation = validateField(value, rule)
        if (validation.isValid) {
          rowData[header] = validation.value
        } else {
          errors.push({
            row: i + 1,
            field: header,
            message: validation.error || '不正な値です'
          })
          hasErrors = true
        }
      } else {
        rowData[header] = value
      }
    })

    if (!hasErrors) {
      data.push(rowData as CSVPropertyData)
    }
  }

  return {
    data,
    errors,
    totalRows: lines.length - 1,
    validRows: data.length
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++ // Skip next quote
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current)
  return result
}

function validateField(value: string, rule: CSVValidationRule): { isValid: boolean; value?: any; error?: string } {
  // Required field validation
  if (rule.required && (!value || value.trim() === '')) {
    return { isValid: false, error: '必須項目です' }
  }

  // Empty optional field
  if (!rule.required && (!value || value.trim() === '')) {
    return { isValid: true, value: undefined }
  }

  // Type validation
  if (rule.type === 'number') {
    const numValue = parseFloat(value)
    if (isNaN(numValue)) {
      return { isValid: false, error: '数値である必要があります' }
    }
    
    if (rule.minValue !== undefined && numValue < rule.minValue) {
      return { isValid: false, error: `${rule.minValue}以上である必要があります` }
    }
    
    if (rule.maxValue !== undefined && numValue > rule.maxValue) {
      return { isValid: false, error: `${rule.maxValue}以下である必要があります` }
    }
    
    return { isValid: true, value: numValue }
  }

  // String validation
  if (rule.type === 'string') {
    if (rule.maxLength && value.length > rule.maxLength) {
      return { isValid: false, error: `${rule.maxLength}文字以内で入力してください` }
    }
    
    return { isValid: true, value: value.trim() }
  }

  return { isValid: true, value }
}

export function generateCSVTemplate(): string {
  const headers = ['name', 'address', 'property_type', 'price', 'size', 'rooms', 'description']
  const sampleData = [
    'サンプル物件1,東京都渋谷区1-1-1,マンション,150000,25.5,1,駅徒歩5分の好立地物件',
    'サンプル物件2,東京都新宿区2-2-2,アパート,80000,18.0,1,学生向け物件',
    'サンプル物件3,東京都品川区3-3-3,戸建て,300000,85.0,3,ファミリー向け一戸建て'
  ]
  
  return [headers.join(','), ...sampleData].join('\n')
}