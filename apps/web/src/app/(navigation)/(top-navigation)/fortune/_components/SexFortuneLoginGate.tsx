'use client'

import { LockKeyhole } from 'lucide-react'

import LoginButton from '@/components/LoginButton'
import StatusState from '@/components/status/StatusState'

import { LIBO_PAGE_LAYOUT } from './sexFortuneStyles'

export function SexFortuneLoginGate() {
  return (
    <div className={LIBO_PAGE_LAYOUT.container}>
      <StatusState
        description="성인인증이 완료된 계정으로 로그인하면 오늘의 운세를 확인할 수 있어요"
        icon={<LockKeyhole className="size-8" />}
        intent="loginRequired"
        title="운세는 로그인이 필요해요"
      >
        <LoginButton>로그인하고 보기</LoginButton>
      </StatusState>
    </div>
  )
}
