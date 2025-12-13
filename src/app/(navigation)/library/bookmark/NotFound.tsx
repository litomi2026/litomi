import { Bookmark, Clock, Download, Search } from 'lucide-react'
import Link from 'next/link'

import Onboarding from '@/app/(navigation)/(right-search)/[name]/settings/Onboarding'

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <Onboarding
        benefits={[
          {
            icon: <Clock className="size-5" />,
            title: '나중에 읽기',
            description: '흥미로운 작품을 저장하고 언제든 돌아와요',
          },
          {
            icon: <Search className="size-5" />,
            title: '빠른 접근',
            description: '좋아하는 작품을 쉽게 찾아볼 수 있어요',
          },
          {
            icon: <Download className="size-5" />,
            title: '백업 지원',
            description: '북마크를 다운로드하고 안전하게 보관해요',
          },
        ]}
        description="좋아하는 작품을 북마크하고 언제든 다시 찾아보세요"
        icon={<Bookmark className="size-12 text-brand" />}
        title="북마크가 비어 있어요"
      >
        <Link
          className="px-6 py-3 rounded-2xl bg-brand font-semibold text-background hover:opacity-80 transition"
          href="/new/1"
          prefetch={false}
        >
          작품 둘러보기
        </Link>
      </Onboarding>
    </div>
  )
}
