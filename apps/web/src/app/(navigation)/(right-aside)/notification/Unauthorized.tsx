import { LockKeyhole } from 'lucide-react'
import Link from 'next/link'

import LoginButton from '@/components/LoginButton'
import StatusState from '@/components/status/StatusState'

export default function Unauthorized() {
  return (
    <StatusState
      description="로그인하면 키워드 알림과 새 소식을 한 곳에서 확인할 수 있어요"
      icon={<LockKeyhole className="size-8" />}
      intent="loginRequired"
      title="알림은 로그인이 필요해요"
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
