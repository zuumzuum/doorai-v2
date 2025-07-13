import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface PropertyData {
  id: string
  name: string
  address: string
  property_type: string
  price?: number
  size?: number
  rooms?: number
  description?: string
}

export interface BatchJobRequest {
  custom_id: string
  method: "POST"
  url: "/v1/chat/completions"
  body: {
    model: string
    messages: Array<{
      role: "system" | "user" | "assistant"
      content: string
    }>
    max_tokens: number
    temperature: number
  }
}

export interface BatchJobResponse {
  id: string
  custom_id: string
  response: {
    status_code: number
    body: {
      choices: Array<{
        message: {
          content: string
        }
      }>
    }
  }
  error?: {
    message: string
    type: string
  }
}

export class OpenAIBatchClient {
  private openai: OpenAI

  constructor() {
    this.openai = openai
  }

  // Generate system prompt for property description
  private generateSystemPrompt(): string {
    return `あなたは不動産の専門家として、物件情報から魅力的な物件紹介文を作成してください。

以下の要件に従って紹介文を作成してください：
1. 物件の魅力を最大限に伝える
2. 具体的で読みやすい文章にする
3. 200文字以内で簡潔にまとめる
4. 顧客が興味を持つような表現を使う
5. 物件の特徴や立地の良さを強調する

紹介文のみを返してください。余計な説明は不要です。`
  }

  // Generate user prompt for specific property
  private generateUserPrompt(property: PropertyData): string {
    const parts = [
      `物件名: ${property.name}`,
      `住所: ${property.address}`,
      `物件種別: ${property.property_type}`,
    ]

    if (property.price) {
      parts.push(`価格: ${property.price.toLocaleString()}円`)
    }

    if (property.size) {
      parts.push(`面積: ${property.size}㎡`)
    }

    if (property.rooms) {
      parts.push(`間取り: ${property.rooms}部屋`)
    }

    if (property.description) {
      parts.push(`既存の説明: ${property.description}`)
    }

    return parts.join('\n')
  }

  // Create batch job requests for multiple properties
  createBatchRequests(properties: PropertyData[]): BatchJobRequest[] {
    const systemPrompt = this.generateSystemPrompt()

    return properties.map(property => ({
      custom_id: `property-${property.id}`,
      method: "POST" as const,
      url: "/v1/chat/completions",
      body: {
        model: "gpt-4o",
        messages: [
          {
            role: "system" as const,
            content: systemPrompt
          },
          {
            role: "user" as const,
            content: this.generateUserPrompt(property)
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      }
    }))
  }

  // Submit batch job to OpenAI
  async submitBatchJob(requests: BatchJobRequest[]): Promise<{ batchId: string; inputFileId: string }> {
    // Create JSONL content
    const jsonlContent = requests.map(req => JSON.stringify(req)).join('\n')

    // Upload file to OpenAI
    const file = await this.openai.files.create({
      file: new Blob([jsonlContent], { type: 'application/jsonl' }),
      purpose: 'batch'
    })

    // Create batch job
    const batch = await this.openai.batches.create({
      input_file_id: file.id,
      endpoint: '/v1/chat/completions',
      completion_window: '24h',
      metadata: {
        description: 'Property description generation'
      }
    })

    return {
      batchId: batch.id,
      inputFileId: file.id
    }
  }

  // Get batch job status
  async getBatchStatus(batchId: string): Promise<{
    status: 'validating' | 'failed' | 'in_progress' | 'finalizing' | 'completed' | 'expired' | 'cancelling' | 'cancelled'
    outputFileId?: string
    errorFileId?: string
    requestCounts?: {
      total: number
      completed: number
      failed: number
    }
  }> {
    const batch = await this.openai.batches.retrieve(batchId)
    
    return {
      status: batch.status,
      outputFileId: batch.output_file_id || undefined,
      errorFileId: batch.error_file_id || undefined,
      requestCounts: batch.request_counts || undefined
    }
  }

  // Download and parse batch results
  async getBatchResults(outputFileId: string): Promise<BatchJobResponse[]> {
    const fileContent = await this.openai.files.content(outputFileId)
    const text = await fileContent.text()
    
    return text
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line) as BatchJobResponse)
  }

  // Cancel batch job
  async cancelBatchJob(batchId: string): Promise<void> {
    await this.openai.batches.cancel(batchId)
  }

  // Clean up files
  async deleteFile(fileId: string): Promise<void> {
    await this.openai.files.delete(fileId)
  }

  // Get estimated cost for batch job
  estimateCost(requestCount: number): {
    estimatedTokens: number
    estimatedCost: number
  } {
    // Rough estimation based on average prompt size
    const avgPromptTokens = 150
    const avgCompletionTokens = 100
    const totalTokens = (avgPromptTokens + avgCompletionTokens) * requestCount

    // GPT-4o Batch API pricing from environment variables (USD per 1M tokens)
    const INPUT = +(process.env.GPT4O_BATCH_INPUT_USD || '2.5')
    const OUTPUT = +(process.env.GPT4O_BATCH_OUTPUT_USD || '10')
    
    const inputCost = (avgPromptTokens * requestCount / 1_000_000) * INPUT
    const outputCost = (avgCompletionTokens * requestCount / 1_000_000) * OUTPUT
    
    return {
      estimatedTokens: totalTokens,
      estimatedCost: inputCost + outputCost
    }
  }
}