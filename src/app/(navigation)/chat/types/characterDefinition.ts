export type CharacterDefinition = {
  id: string
  name: string
  description: string
  prompts: CharacterPromptDefinition[]
  defaultPromptId?: string
  llmParams?: {
    chat?: LlmParams
    thinking?: LlmParams
  }
}

export type CharacterPromptDefinition = {
  id: string
  title: string
  description?: string
  systemPrompt: string
  llmParams?: {
    chat?: LlmParams
    thinking?: LlmParams
  }
}

export type LlmParams = {
  temperature?: number
  top_p?: number
  max_tokens?: number
  repetition_penalty?: number
  frequency_penalty?: number
  presence_penalty?: number
}
