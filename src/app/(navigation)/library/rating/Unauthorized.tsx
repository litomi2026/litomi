import { Cloud, LockKeyhole, Star, TrendingUp } from 'lucide-react'
import Link from 'next/link'

import Onboarding from '@/app/(navigation)/(right-search)/[name]/settings/Onboarding'
import LoginButton from '@/components/LoginButton'

export default function Unauthorized() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <Onboarding
        benefits={[
          {
            icon: <Star className="size-5" />,
            title: '평가 기록 저장',
            description: '별점과 리뷰가 안전하게 저장돼요',
          },
          {
            icon: <TrendingUp className="size-5" />,
            title: '취향 분석 제공',
            description: '평가 기록으로 취향을 분석해드려요',
          },
          {
            icon: <Cloud className="size-5" />,
            title: '모든 기기에서 동기화',
            description: '언제 어디서나 평가를 확인하고 수정해요',
          },
        ]}
        description="계정을 만들고 작품을 평가해보세요"
        icon={<LockKeyhole className="size-12 text-brand" />}
        title="평가 기능은 로그인이 필요해요"
      >
        <div className="flex flex-col w-full items-center gap-3">
          <LoginButton>로그인하기</LoginButton>
          <p className="text-sm text-zinc-500">
            처음이신가요?{' '}
            <Link className="text-zinc-300 underline hover:text-zinc-100 transition-colors" href="/auth/signup">
              회원가입
            </Link>
          </p>
        </div>
      </Onboarding>
    </div>
  )
}
