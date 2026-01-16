'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { env } from '@/env/client'

import type { CharacterDefinition, CharacterPromptDefinition } from '../../../types/characterDefinition'

import { useOutboxAutoFlush } from '../../../storage/outbox'
import { ChatHeader } from './components/ChatHeader'
import { ChatThread } from './components/ChatThread'
import { ModelPanel } from './components/ModelPanel'
import { useCharacterChatController } from './hook/useCharacterChatController'
import { useWebLLMRuntime } from './hook/useWebLLMRuntime'

type InstallStateKind = 'error' | 'installed' | 'installing' | 'not-installed' | 'unknown'

const { NEXT_PUBLIC_BACKEND_URL } = env

type Props = {
  character: CharacterDefinition
  prompt: CharacterPromptDefinition
  threadId?: string
}

export default function AIChat({ character, prompt, threadId }: Props) {
  const router = useRouter()
  const runtime = useWebLLMRuntime()
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
    prompt,
    clientSessionId: threadId,
    engineRef: runtime.engineRef,
    ensureEngine: runtime.ensureEngine,
    interruptGenerate: runtime.interruptGenerate,
    modelId: runtime.modelId,
    modelContextWindowSize: runtime.modelContextWindowSize,
    modelMode: chatModelMode,
    modelSupportsThinking,
    onOutboxFlush: outbox.flush,
    resetChat: runtime.resetChat,
  })

  function handleNewChat() {
    chat.newChat()
    router.push(`/chat/${character.id}/${prompt.id}/${crypto.randomUUID()}`)
  }

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 max-w-3xl w-full mx-auto">
      <ChatHeader onNewChat={handleNewChat} />

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
        showThinkingTrace={runtime.showThinkingTrace}
      />

      <section className="rounded-2xl border border-white/7 bg-white/3 p-4 flex flex-col gap-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <p className="text-xs text-zinc-500">캐릭터</p>
            <p className="text-sm font-medium text-zinc-100">{character.name}</p>
            <p className="text-xs text-zinc-500">{character.description}</p>
          </div>
          <Link
            className="text-xs text-zinc-400 underline hover:text-zinc-200 transition whitespace-nowrap"
            href="/chat"
            prefetch={false}
          >
            캐릭터 바꾸기
          </Link>
        </div>
        <div className="border-t border-white/7 pt-3 flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <p className="text-xs text-zinc-500">프롬프트</p>
            <p className="text-sm font-medium text-zinc-100">{prompt.title}</p>
            {prompt.description ? <p className="text-xs text-zinc-500">{prompt.description}</p> : null}
          </div>
          <Link
            className="text-xs text-zinc-400 underline hover:text-zinc-200 transition whitespace-nowrap"
            href={`/chat/${character.id}`}
            prefetch={false}
          >
            프롬프트 바꾸기
          </Link>
        </div>
      </section>

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
