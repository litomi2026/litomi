'use client'

import { Bot, Cpu, Download, LockKeyhole, MessageCircle, Smartphone } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import LoginButton from '@/components/LoginButton'
import { env } from '@/env/client'
import useMeQuery from '@/query/useMeQuery'

import Onboarding from '../(right-search)/[name]/settings/Onboarding'
import { arisCharacter } from './character/aris'
import { aruCharacter } from './character/aru'
import { neoCharacter } from './character/neo'
import { shiyeonCharacter } from './character/shiyeon'
import { yumiCharacter } from './character/yumi'
import { CharacterPanel } from './components/CharacterPanel'
import { ChatHeader } from './components/ChatHeader'
import { ChatThread } from './components/ChatThread'
import { ModelPanel } from './components/ModelPanel'
import { useCharacterChatController } from './hook/useCharacterChatController'
import { useSingleTabLock } from './hook/useSingleTabLock'
import { useWebLLMRuntime } from './hook/useWebLLMRuntime'
import { useOutboxAutoFlush } from './storage/outbox'

const { NEXT_PUBLIC_BACKEND_URL } = env

const MIN_IOS_SAFARI_TEXT = 'iOS 18 / Safari 18 이상'

const CHARACTERS = [arisCharacter, aruCharacter, yumiCharacter, shiyeonCharacter, neoCharacter] as const

type InstallStateKind = 'error' | 'installed' | 'installing' | 'not-installed' | 'unknown'

export default function CharacterChatPageClient() {
  const { data: me, isLoading } = useMeQuery()
  const userId = me?.id
  const [characterKey, setCharacterKey] = useState(CHARACTERS[0].key)
  const character = CHARACTERS.find((c) => c.key === characterKey)!
  const tabLock = useSingleTabLock({ channel: 'litomi:character-chat' })
  const runtime = useWebLLMRuntime({ enabled: Boolean(userId) && tabLock.kind === 'acquired' })
  const modelSupportsThinking = runtime.modelPreset.supportsThinking
  const chatModelMode = modelSupportsThinking && runtime.isThinkingEnabled ? 'thinking' : 'chat'
  const chatInputDisabledReason = getChatInputDisabledReason(runtime.installState.kind)
  const chatInputDisabled = chatInputDisabledReason !== null

  const outbox = useOutboxAutoFlush({
    enabled: Boolean(userId),
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

  if (isLoading) {
    return <div className="p-6 text-sm text-zinc-400">사용자 정보를 불러오고 있어요…</div>
  }

  if (!userId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Onboarding
          benefits={[
            {
              icon: <Cpu className="size-5" />,
              title: '내 기기에서 실행',
              description: '서버 비용 없이 내 GPU로 추론해요',
            },
            {
              icon: <Download className="size-5" />,
              title: '모델 설치',
              description: '처음 한 번만 내려받으면 돼요',
            },
            {
              icon: <MessageCircle className="size-5" />,
              title: '로그 저장',
              description: '대화 기록이 계정에 저장돼요',
            },
          ]}
          description="로그인하고 내 기기에서 캐릭터 AI 채팅을 시작해요"
          icon={<LockKeyhole className="size-12 text-brand" />}
          title="AI 채팅은 로그인이 필요해요"
        >
          <LoginButton>로그인하기</LoginButton>
        </Onboarding>
      </div>
    )
  }

  if (tabLock.kind === 'blocked') {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Onboarding
          benefits={[
            {
              icon: <Smartphone className="size-5" />,
              title: '메모리 절약',
              description: '여러 탭 동시 실행을 막아서 안정적으로 동작해요',
            },
            {
              icon: <Cpu className="size-5" />,
              title: 'GPU 공유',
              description: '모델이 탭마다 중복 로드되는 걸 피할 수 있어요',
            },
          ]}
          description="다른 탭에서 AI 채팅을 사용 중이에요. 그 탭을 닫고 다시 시도해 주세요"
          icon={<Bot className="size-12 text-brand" />}
          title="AI 채팅은 한 탭에서만 실행돼요"
        >
          <button
            className="inline-flex items-center justify-center gap-2 w-full max-w-3xs p-3 rounded-xl border border-zinc-700/60 hover:border-zinc-500 transition"
            onClick={tabLock.retry}
            type="button"
          >
            다시 시도
          </button>
        </Onboarding>
      </div>
    )
  }

  if (runtime.isWebGpuReady === false) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Onboarding
          benefits={[
            {
              icon: <Cpu className="size-5" />,
              title: 'WebGPU 필요',
              description: '현재는 GPU가 있어야 실행할 수 있어요',
            },
            {
              icon: <Smartphone className="size-5" />,
              title: 'iOS Safari',
              description: '설정에서 WebGPU를 켜야 할 수 있어요',
            },
          ]}
          description={`이 기기에서는 WebGPU를 사용할 수 없어요. (지원: ${MIN_IOS_SAFARI_TEXT}) iOS Safari라면 설정 > Safari > 고급 > 실험적 기능에서 WebGPU를 켜고 다시 시도해 주세요`}
          icon={<Cpu className="size-12 text-brand" />}
          title="이 기기에서는 AI 채팅을 지원하지 않아요"
        >
          <button
            className="inline-flex items-center justify-center gap-2 w-full max-w-3xs p-3 rounded-xl border border-zinc-700/60 hover:border-zinc-500 transition"
            onClick={() => window.location.reload()}
            type="button"
          >
            다시 확인
          </button>
        </Onboarding>
      </div>
    )
  }

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
        isLocked={chat.isLocked}
        onChangeCharacterKey={setCharacterKey}
        selectedCharacter={character}
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
