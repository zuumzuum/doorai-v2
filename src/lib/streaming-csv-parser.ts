import Papa from 'papaparse'

export interface CSVPropertyData {
  name: string
  address: string
  property_type: string
  price?: number
  size?: number
  rooms?: number
  description?: string
}

export interface CSVValidationError {
  row: number
  field: string
  message: string
}

export interface CSVParseResult {
  data: CSVPropertyData[]
  errors: CSVValidationError[]
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

const EXPECTED_HEADERS = ['name', 'address', 'property_type', 'price', 'size', 'rooms', 'description']

export interface StreamingCSVParserOptions {
  onProgress?: (processed: number, total?: number) => void
  onError?: (error: CSVValidationError) => void
  onValidRow?: (row: CSVPropertyData) => void
  chunkSize?: number
}

export class StreamingCSVParser {
  private options: StreamingCSVParserOptions
  private data: CSVPropertyData[] = []
  private errors: CSVValidationError[] = []
  private totalRows = 0
  private validRows = 0
  private currentRowIndex = 0
  private headers: string[] = []
  private headerValidated = false

  constructor(options: StreamingCSVParserOptions = {}) {
    this.options = {
      chunkSize: 500,
      ...options
    }
  }

  async parseFile(file: File): Promise<CSVParseResult> {
    return new Promise((resolve, reject) => {
      this.reset()

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        step: (result: Papa.ParseStepResult<any>) => {
          this.processRow(result)
        },
        complete: () => {
          resolve({
            data: this.data,
            errors: this.errors,
            totalRows: this.totalRows,
            validRows: this.validRows
          })
        },
        error: (error) => {
          reject(new Error(`CSV parsing error: ${error.message}`))
        }
      })
    })
  }

  async parseStream(stream: ReadableStream): Promise<CSVParseResult> {
    return new Promise((resolve, reject) => {
      this.reset()

      const reader = stream.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      const processChunk = async () => {
        try {
          const { done, value } = await reader.read()
          
          if (done) {
            // Process any remaining buffer
            if (buffer.trim()) {
              this.processBuffer(buffer, true)
            }
            
            resolve({
              data: this.data,
              errors: this.errors,
              totalRows: this.totalRows,
              validRows: this.validRows
            })
            return
          }

          buffer += decoder.decode(value, { stream: true })
          buffer = this.processBuffer(buffer, false)
          
          // Continue processing next chunk
          processChunk()
        } catch (error) {
          reject(error)
        }
      }

      processChunk()
    })
  }

  private reset() {
    this.data = []
    this.errors = []
    this.totalRows = 0
    this.validRows = 0
    this.currentRowIndex = 0
    this.headers = []
    this.headerValidated = false
  }

  private processBuffer(buffer: string, isComplete: boolean): string {
    const lines = buffer.split('\n')
    
    // Keep the last line in buffer if not complete (might be partial)
    const linesToProcess = isComplete ? lines : lines.slice(0, -1)
    const remainingBuffer = isComplete ? '' : lines[lines.length - 1]

    linesToProcess.forEach(line => {
      if (line.trim()) {
        this.processLine(line)
      }
    })

    return remainingBuffer
  }

  private processLine(line: string) {
    if (!this.headerValidated) {
      this.processHeader(line)
      return
    }

    this.processDataRow(line)
  }

  private processHeader(line: string) {
    const parsed = Papa.parse(line, { header: false })
    
    if (parsed.data && parsed.data.length > 0) {
      this.headers = (parsed.data[0] as string[]).map(h => h.trim())
      
      // Validate headers
      const missingHeaders = EXPECTED_HEADERS.filter(h => !this.headers.includes(h))
      if (missingHeaders.length > 0) {
        this.errors.push({
          row: 0,
          field: 'headers',
          message: `必須列が不足しています: ${missingHeaders.join(', ')}`
        })
      }
      
      this.headerValidated = true
    }
  }

  private processDataRow(line: string) {
    this.currentRowIndex++
    this.totalRows++

    const parsed = Papa.parse(line, { header: false })
    
    if (!parsed.data || parsed.data.length === 0) {
      return
    }

    const values = parsed.data[0] as string[]
    
    if (values.length !== this.headers.length) {
      this.errors.push({
        row: this.currentRowIndex,
        field: 'general',
        message: `列数が一致しません。期待値: ${this.headers.length}, 実際: ${values.length}`
      })
      return
    }

    const rowData: any = {}
    let hasErrors = false

    this.headers.forEach((header, index) => {
      const value = values[index]?.trim() || ''
      const rule = VALIDATION_RULES.find(r => r.field === header)
      
      if (rule) {
        const validation = this.validateField(value, rule)
        if (validation.isValid) {
          rowData[header] = validation.value
        } else {
          this.errors.push({
            row: this.currentRowIndex,
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
      const propertyData = rowData as CSVPropertyData
      this.data.push(propertyData)
      this.validRows++
      
      if (this.options.onValidRow) {
        this.options.onValidRow(propertyData)
      }
    }

    if (this.options.onProgress) {
      this.options.onProgress(this.currentRowIndex)
    }
  }

  private processRow(result: Papa.ParseStepResult<any>) {
    if (result.errors.length > 0) {
      result.errors.forEach(error => {
        this.errors.push({
          row: this.currentRowIndex,
          field: 'general',
          message: error.message
        })
      })
    }

    if (result.data && typeof result.data === 'object') {
      this.currentRowIndex++
      this.totalRows++

      const rowData: any = {}
      let hasErrors = false

      EXPECTED_HEADERS.forEach(header => {
        const value = (result.data as any)[header]?.toString().trim() || ''
        const rule = VALIDATION_RULES.find(r => r.field === header)
        
        if (rule) {
          const validation = this.validateField(value, rule)
          if (validation.isValid) {
            rowData[header] = validation.value
          } else {
            this.errors.push({
              row: this.currentRowIndex,
              field: header,
              message: validation.error || '不正な値です'
            })
            hasErrors = true
          }
        }
      })

      if (!hasErrors) {
        const propertyData = rowData as CSVPropertyData
        this.data.push(propertyData)
        this.validRows++
        
        if (this.options.onValidRow) {
          this.options.onValidRow(propertyData)
        }
      }

      if (this.options.onProgress) {
        this.options.onProgress(this.currentRowIndex)
      }
    }
  }

  private validateField(value: string, rule: CSVValidationRule): { isValid: boolean; value?: any; error?: string } {
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

  // Utility method for chunked processing
  static chunk<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize))
    }
    return chunks
  }
}