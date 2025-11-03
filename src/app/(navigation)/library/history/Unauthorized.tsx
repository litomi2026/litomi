import { BookOpen, Cloud, LockKeyhole, RotateCw } from 'lucide-react'
import Link from 'next/link'

import Onboarding from '@/app/(navigation)/(right-search)/[name]/settings/Onboarding'
import LoginButton from '@/components/LoginButton'

export default function Unauthorized() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <Onboarding
        benefits={[
          {
            icon: <RotateCw className="size-5" />,
            title: '읽은 작품 자동 기록',
            description: '감상한 작품이 자동으로 기록되고 정리돼요',
          },
          {
            icon: <BookOpen className="size-5" />,
            title: '마지막 읽은 페이지',
            description: '중단한 곳부터 바로 이어서 읽을 수 있어요',
          },
          {
            icon: <Cloud className="size-5" />,
            title: '모든 기기에서 동기화',
            description: '언제 어디서나 이어서 읽기가 가능해요',
          },
        ]}
        description="계정을 만들고 읽은 작품을 자동으로 기록하세요"
        icon={<LockKeyhole className="size-12 text-brand" />}
        title="감상 기록은 로그인이 필요해요"
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
