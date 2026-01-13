export type ChatMessage = {
  id: string
  role: 'assistant' | 'user'
  content: string
  debug?: {
    think?: string
  }
}
