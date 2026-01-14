'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import { env } from '@/env/client'

import { arisCharacter } from './character/aris'
import { aruCharacter } from './character/aru'
import { buildCharacterDefinition } from './character/buildCharacterDefinition'
import { neoCharacter } from './character/neo'
import shiyeonJSON from './character/shiyeon.json'
import { yumiCharacter } from './character/yumi'
import { CharacterPanel } from './components/CharacterPanel'
import { ChatHeader } from './components/ChatHeader'
import { ChatThread } from './components/ChatThread'
import { ModelPanel } from './components/ModelPanel'
import { useCharacterChatController } from './hook/useCharacterChatController'
import { useWebLLMRuntime } from './hook/useWebLLMRuntime'
import { useOutboxAutoFlush } from './storage/outbox'

type InstallStateKind = 'error' | 'installed' | 'installing' | 'not-installed' | 'unknown'

const { NEXT_PUBLIC_BACKEND_URL } = env

const CHARACTERS = [
  arisCharacter,
  aruCharacter,
  yumiCharacter,
  buildCharacterDefinition(shiyeonJSON),
  neoCharacter,
] as const

type AIChatProps = {
  runtime: ReturnType<typeof useWebLLMRuntime>
}

export default function AIChat({ runtime }: AIChatProps) {
  const [characterKey, setCharacterKey] = useState(CHARACTERS[0].key)
  const character = CHARACTERS.find((c) => c.key === characterKey)!
  const modelSupportsThinking = runtime.modelPreset.supportsThinking
  const chatModelMode = modelSupportsThinking && runtime.isThinkingEnabled ? 'thinking' : 'chat'
  const chatInputDisabledReason = getChatInputDisabledReason(runtime.installState.kind)
  const chatInputDisabled = chatInputDisabledReason !== null

  const outbox = useOutboxAutoFlush({
    backendUrl: NEXT_PUBLIC_BACKEND_URL,
    onUnauthorized: () => toast.warning('로그인 정보가 만료됐어요'),
  })

  const chat = useCharacterChatController({
    character,
    engineRef: runtime.engineRef,
    ensureEngine: runtime.ensureEngine,
    interruptGenerate: runtime.interruptGenerate,
    modelId: runtime.modelId,
    modelMode: chatModelMode,
    modelSupportsThinking,
    onOutboxFlush: outbox.flush,
    resetChat: runtime.resetChat,
  })

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 max-w-3xl w-full">
      <ChatHeader onNewChat={chat.newChat} />

      <ModelPanel
        customModels={runtime.customModels}
        installState={runtime.installState}
        isAutoModelEnabled={runtime.isAutoModelEnabled}
        isLocked={chat.isLocked}
        isThinkingEnabled={runtime.isThinkingEnabled}
        modelId={runtime.modelId}
        modelPreset={runtime.modelPreset}
        modelPresets={runtime.modelPresets}
        onAddCustomModel={runtime.addCustomModel}
        onChangeAutoModelEnabled={runtime.setIsAutoModelEnabled}
        onChangeModelId={runtime.setModelId}
        onChangeThinkingEnabled={runtime.setIsThinkingEnabled}
        onChangeThinkingTraceVisible={runtime.setShowThinkingTrace}
        onInstall={runtime.install}
        onRefreshInstallState={runtime.refreshInstallState}
        onRemoveCustomModel={runtime.removeCustomModel}
        onRemoveInstalledModel={() => runtime.removeInstalledModel().then(() => toast.success('모델을 삭제했어요'))}
        recommendedModelId={runtime.recommendedModelId}
        showThinkingTrace={runtime.showThinkingTrace}
      />

      <CharacterPanel
        characterKey={characterKey}
        characters={CHARACTERS}
        disabled={chat.isLocked}
        onChangeCharacterKey={setCharacterKey}
      />

      <ChatThread
        canContinue={chat.canContinue}
        characterName={character.name}
        chatInputDisabled={chatInputDisabled}
        chatInputDisabledReason={chatInputDisabledReason}
        currentAssistantId={chat.currentAssistantId}
        input={chat.input}
        isGenerating={chat.isGenerating}
        isPreparingModel={chat.isPreparingModel}
        isThinkingEnabled={runtime.isThinkingEnabled}
        messages={chat.messages}
        modelMode={chatModelMode}
        onContinue={chat.continueReply}
        onInputChange={chat.onInputChange}
        onStop={chat.stop}
        onSubmit={chat.send}
        showThinkingTrace={runtime.showThinkingTrace}
      />
    </div>
  )
}

function getChatInputDisabledReason(kind: InstallStateKind): string | null {
  switch (kind) {
    case 'error':
      return '모델을 준비하지 못했어요. 위에서 다시 확인해 주세요'
    case 'installed':
      return null
    case 'installing':
      return '모델을 설치하고 있어요…'
    case 'not-installed':
      return '모델을 설치하면 대화를 시작할 수 있어요'
    case 'unknown':
    default:
      return '모델 상태를 확인하고 있어요…'
  }
}
