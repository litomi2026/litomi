'use client'

import { LockKeyhole } from 'lucide-react'
import type { ReactNode } from 'react'
import LoginButton from '@/components/LoginButton'
import StatusState from '@/components/status/StatusState'
import { Link } from '@/i18n/navigation'
import useMeQuery from '@/query/useMeQuery'

// Coarse login gate for the whole chat section. Auth lives entirely in the client (`useMeQuery`
// reads the auth-hint cookie, then hits the API) — the Next server never sees credentials, so it
// stays free of auth logic. Per-room ownership/subscription checks compose below this.
export default function SobokAuthGate({ children }: { children: ReactNode }) {
  const { data: me } = useMeQuery()

  if (me === undefined) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background animate-fade-in">
        <div className="animate-pulse w-8 h-8 rounded-full bg-indigo-500/50" />
      </div>
    )
  }

  if (me === null) {
    return (
      <StatusState
        description="아티스트와 팬이 직접 소통하는 공간이에요."
        icon={<LockKeyhole className="size-8" />}
        intent="auth"
        title="로그인하고 채팅을 시작하세요"
      >
        <div className="flex flex-col w-full items-center gap-3">
          <LoginButton>로그인하고 시작하기</LoginButton>
          <p className="text-sm text-zinc-500">
            아직 계정이 없으신가요?{' '}
            <Link
              className="text-zinc-300 underline hover:text-zinc-100 transition"
              href="/auth/signup"
              prefetch={false}
            >
              회원가입
            </Link>
          </p>
        </div>
      </StatusState>
    )
  }

  return <>{children}</>
}
