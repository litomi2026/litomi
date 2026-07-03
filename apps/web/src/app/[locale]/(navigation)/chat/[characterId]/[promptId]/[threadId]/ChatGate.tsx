'use client'

import { Bot, Cpu } from 'lucide-react'
import type { ReactNode } from 'react'

import LoginGate from '@/components/LoginGate'
import StatusState from '@/components/status/StatusState'
import { getStatusActionClassName } from '@/components/status/styles'
import useMeQuery from '@/query/useMeQuery'

import { useSingleTabLock } from './hook/useSingleTabLock'
import { useWebGPUReady } from './hook/useWebGPUReady'

const MIN_IOS_SAFARI_TEXT = 'iOS 18 / Safari 18 이상'

type Props = {
  children: ReactNode
}

export function ChatGate({ children }: Props) {
  const { data: me } = useMeQuery()
  const userId = me?.id
  const tabLock = useSingleTabLock({ channel: 'litomi:character-chat' })
  const isWebGpuReady = useWebGPUReady({ enabled: Boolean(userId) && tabLock.kind === 'acquired' })

  if (me === undefined) {
    return null
  }

  if (me === null) {
    return <LoginGate />
  }

  if (tabLock.kind === 'blocked') {
    return (
      <div className="flex-1 flex items-center justify-center">
        <StatusState
          description="다른 탭에서 AI 채팅을 사용 중이에요. 그 탭을 닫고 다시 시도해 주세요"
          icon={<Bot className="size-8" />}
          title="AI 채팅은 한 탭에서만 실행돼요"
        >
          <button className={getStatusActionClassName('secondary')} onClick={tabLock.retry} type="button">
            다시 시도
          </button>
        </StatusState>
      </div>
    )
  }

  if (isWebGpuReady === null) {
    return <div className="p-6 text-sm text-zinc-400">WebGPU 지원 여부를 확인하고 있어요…</div>
  }

  if (isWebGpuReady === false) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <StatusState
          description={`이 기기에서는 WebGPU를 사용할 수 없어요. (지원: ${MIN_IOS_SAFARI_TEXT}) Chrome/Edge라면 설정 > 시스템에서 “가능한 경우 하드웨어 가속 사용”을 켜고 다시 시도해 주세요. iOS Safari라면 설정 > Safari > 고급 > 실험적 기능에서 WebGPU를 켜고 다시 시도해 주세요`}
          icon={<Cpu className="size-8" />}
          title="이 기기에서는 AI 채팅을 지원하지 않아요"
        >
          <button
            className={getStatusActionClassName('secondary')}
            onClick={() => window.location.reload()}
            type="button"
          >
            다시 확인
          </button>
        </StatusState>
      </div>
    )
  }

  return children
}
