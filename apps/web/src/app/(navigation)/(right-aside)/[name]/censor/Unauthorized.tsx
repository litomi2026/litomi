import { LockKeyhole } from 'lucide-react'
import Link from 'next/link'

import LoginButton from '@/components/LoginButton'
import StatusState from '@/components/status/StatusState'
import { SearchParamKey } from '@/storage'

export default function Unauthorized() {
  return (
    <StatusState
      description="로그인하면 보고 싶지 않은 작품을 줄이고 탐색 환경을 정리할 수 있어요"
      icon={<LockKeyhole className="size-8" />}
      intent="auth"
      title="검열 설정은 로그인이 필요해요"
    >
      <div className="flex w-full flex-col items-center gap-3">
        <LoginButton>로그인하고 시작하기</LoginButton>
        <p className="text-sm text-zinc-500">
          처음이신가요?{' '}
          <Link
            className="text-zinc-300 underline transition hover:text-zinc-100"
            href={`/auth/signup?${SearchParamKey.REDIRECT}=${encodeURIComponent('/@/censor')}`}
            prefetch={false}
          >
            회원가입
          </Link>
        </p>
      </div>
    </StatusState>
  )
}
