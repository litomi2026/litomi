'use client'

import { Bot, Cpu, Download, LockKeyhole, MessageCircle, Smartphone } from 'lucide-react'

import LoginButton from '@/components/LoginButton'
import useMeQuery from '@/query/useMeQuery'

import Onboarding from '../(right-search)/[name]/settings/Onboarding'
import AIChat from './AIChat'
import { useSingleTabLock } from './hook/useSingleTabLock'
import { useWebLLMRuntime } from './hook/useWebLLMRuntime'

const MIN_IOS_SAFARI_TEXT = 'iOS 18 / Safari 18 이상'

export default function CharacterChatPageClient() {
  const { data: me, isLoading } = useMeQuery()
  const userId = me?.id
  const tabLock = useSingleTabLock({ channel: 'litomi:character-chat' })
  const runtime = useWebLLMRuntime({ enabled: Boolean(userId) && tabLock.kind === 'acquired' })

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

  return <AIChat runtime={runtime} />
}
