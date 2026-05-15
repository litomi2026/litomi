export type ChatMessage = {
  id: string
  role: 'assistant' | 'user'
  content: string
  tokenCount?: number
  debug?: {
    think?: string
  }
}
