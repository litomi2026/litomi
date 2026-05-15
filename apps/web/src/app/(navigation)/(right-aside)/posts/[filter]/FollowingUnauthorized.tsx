import { MessageCircleHeart, PenSquare, Users } from 'lucide-react'
import Link from 'next/link'

import Onboarding from '@/app/(navigation)/(right-aside)/[name]/settings/Onboarding'
import LoginButton from '@/components/LoginButton'

export default function FollowingUnauthorized() {
  return (
    <div className="flex flex-col grow justify-center">
      <Onboarding
        benefits={[
          {
            icon: <Users className="size-5" />,
            title: '좋아하는 사용자 팔로우',
            description: '관심 있는 사용자의 새 글을 한 곳에서 확인해요',
          },
          {
            icon: <MessageCircleHeart className="size-5" />,
            title: '대화 흐름 이어보기',
            description: '팔로우한 사용자의 답글과 리포스트도 놓치지 않아요',
          },
          {
            icon: <PenSquare className="size-5" />,
            title: '더 쉽게 소통',
            description: '내 글을 쓰고 다른 사용자와 연결될 수 있어요',
          },
        ]}
        description="계정을 만들고 팔로우한 사용자의 글만 모아보세요"
        icon={<Users className="size-12 text-brand" />}
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
      </Onboarding>
    </div>
  )
}
