import { LockKeyhole } from 'lucide-react'
import Link from 'next/link'

import LoginButton from '@/components/LoginButton'
import StatusState from '@/components/status/StatusState'

export default function Unauthorized() {
  return (
    <StatusState
      description="로그인하면 후원한 작품과 수신 대상을 모아서 볼 수 있어요"
      headingLevel={1}
      icon={<LockKeyhole className="size-8" />}
      intent="loginRequired"
      title="내 후원은 로그인이 필요해요"
    >
      <div className="flex w-full flex-col items-center gap-3">
        <LoginButton>로그인하기</LoginButton>
        <p className="text-sm text-zinc-500">
          처음이신가요?{' '}
          <Link className="text-zinc-300 underline transition hover:text-zinc-100" href="/auth/signup" prefetch={false}>
            회원가입
          </Link>
        </p>
      </div>
    </StatusState>
  )
}
