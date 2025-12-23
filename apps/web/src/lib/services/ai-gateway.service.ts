/**
 * AI Gateway Service
 * 
 * Service for interacting with AI Gateway API
 * Handles chat completions and other AI operations
 */

import { config } from '@employee-management/config'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatCompletionRequest {
  model: string
  messages: ChatMessage[]
  stream?: boolean
  temperature?: number
  max_tokens?: number
}

export interface ChatCompletionResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: ChatMessage
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface AIGatewayServiceResult<T = unknown> {
  data: T | null
  error: string | null
  success: boolean
}

class AIGatewayService {
  private readonly baseUrl: string
  private readonly apiKey: string | null

  constructor() {
    // Get configuration from central config
    this.baseUrl = config.aiGateway.baseUrl || 'https://ai-gateway.vercel.sh/v1'
    this.apiKey = config.aiGateway.apiKey || null
  }

  /**
   * Check if service is properly configured
   */
  private isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.trim() !== ''
  }

  /**
   * Get authorization header
   */
  private getAuthHeader(): string {
    if (!this.isConfigured()) {
      throw new Error('AI_GATEWAY_API_KEY is not configured')
    }
    return `Bearer ${this.apiKey}`
  }

  /**
   * Send chat completion request
   */
  async chatCompletion(
    request: ChatCompletionRequest
  ): Promise<AIGatewayServiceResult<ChatCompletionResponse>> {
    try {
      if (!this.isConfigured()) {
        return {
          data: null,
          error: 'AI Gateway API key is not configured. Please set AI_GATEWAY_API_KEY environment variable.',
          success: false
        }
      }

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: request.model,
          messages: request.messages,
          stream: request.stream ?? false,
          ...(request.temperature !== undefined && { temperature: request.temperature }),
          ...(request.max_tokens !== undefined && { max_tokens: request.max_tokens }),
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('AI Gateway API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        })

        return {
          data: null,
          error: `AI Gateway API error: ${response.status} ${response.statusText}`,
          success: false
        }
      }

      const data: ChatCompletionResponse = await response.json()

      return {
        data,
        error: null,
        success: true
      }
    } catch (error) {
      console.error('Error calling AI Gateway:', error)
      
      return {
        data: null,
        error: error instanceof Error 
          ? `Failed to call AI Gateway: ${error.message}`
          : 'Failed to call AI Gateway: Unknown error',
        success: false
      }
    }
  }

  /**
   * Quick chat helper - sends a user message and returns assistant response
   */
  async chat(
    message: string,
    model: string = 'zai/glm-4.6',
    systemPrompt?: string
  ): Promise<AIGatewayServiceResult<string>> {
    const messages: ChatMessage[] = []
    
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt
      })
    }
    
    messages.push({
      role: 'user',
      content: message
    })

    const result = await this.chatCompletion({
      model,
      messages,
      stream: false
    })

    if (!result.success || !result.data) {
      return result as AIGatewayServiceResult<string>
    }

    const assistantMessage = result.data.choices[0]?.message?.content

    if (!assistantMessage) {
      return {
        data: null,
        error: 'No response from AI Gateway',
        success: false
      }
    }

    return {
      data: assistantMessage,
      error: null,
      success: true
    }
  }
}

// Export singleton instance
export const aiGatewayService = new AIGatewayService()

// Export class for testing
export { AIGatewayService }

