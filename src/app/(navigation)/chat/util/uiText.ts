export type AssistantPlaceholderTextOptions = {
  isPreparingModel: boolean
  isThinkingEnabled: boolean
  modelMode: 'chat' | 'thinking'
}

export type ChatIntroTextOptions = {
  chatInputDisabled: boolean
  chatInputDisabledReason: string | null
}

export type ModelInstallStateKind = 'error' | 'installed' | 'installing' | 'not-installed' | 'unknown'

export function getAssistantPlaceholderText({
  isPreparingModel,
  isThinkingEnabled,
  modelMode,
}: AssistantPlaceholderTextOptions): string {
  if (isPreparingModel) {
    return '모델을 준비하고 있어요…'
  }
  if (modelMode === 'thinking' && isThinkingEnabled) {
    return '생각 중이에요…'
  }
  return '답변을 만들고 있어요…'
}

export function getChatIntroText({ chatInputDisabled, chatInputDisabledReason }: ChatIntroTextOptions): string {
  if (chatInputDisabled) {
    return chatInputDisabledReason ?? '모델을 준비하고 있어요…'
  }
  return '메시지를 보내면 대화를 시작할 수 있어요'
}
