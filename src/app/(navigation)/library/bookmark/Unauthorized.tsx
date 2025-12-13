import { Cloud, Download, Heart, LockKeyhole } from 'lucide-react'
import Link from 'next/link'

import Onboarding from '@/app/(navigation)/(right-search)/[name]/settings/Onboarding'
import LoginButton from '@/components/LoginButton'

export default function Unauthorized() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <Onboarding
        benefits={[
          {
            icon: <Heart className="size-5" />,
            title: '좋아하는 작품 저장',
            description: '마음에 드는 작품을 언제든 다시 찾아보세요',
          },
          {
            icon: <Download className="size-5" />,
            title: '백업 및 내보내기',
            description: '북마크를 안전하게 다운로드하고 보관해요',
          },
          {
            icon: <Cloud className="size-5" />,
            title: '모든 기기 동기화',
            description: '어떤 기기에서도 북마크를 확인할 수 있어요',
          },
        ]}
        description="계정을 만들고 마음에 드는 작품을 저장하세요"
        icon={<LockKeyhole className="size-12 text-brand" />}
        title="북마크 기능은 로그인이 필요해요"
      >
        <div className="flex flex-col w-full items-center gap-3">
          <LoginButton>로그인하기</LoginButton>
          <p className="text-sm text-zinc-500">
            처음이신가요?{' '}
            <Link
              className="text-zinc-300 underline hover:text-zinc-100 transition-colors"
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
