import { Users } from 'lucide-react'

import LoginButton from '@/components/LoginButton'
import StatusState from '@/components/status/StatusState'
import { Link } from '@/i18n/navigation'

export default function FollowingUnauthorized() {
  return (
    <div className="flex flex-col grow justify-center">
      <StatusState
        description="계정을 만들고 팔로우한 사용자의 글만 모아보세요"
        icon={<Users className="size-8" />}
        intent="auth"
        title="팔로잉 탭은 로그인이 필요해요"
      >
        <div className="flex flex-col w-full items-center gap-3">
          <LoginButton>로그인하기</LoginButton>
          <p className="text-sm text-zinc-500">
            처음이신가요?{' '}
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
    </div>
  )
}
