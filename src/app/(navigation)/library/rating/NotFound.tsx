import { Star, TrendingUp, Trophy } from 'lucide-react'
import Link from 'next/link'

import Onboarding from '@/app/(navigation)/(right-search)/[name]/settings/Onboarding'

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <Onboarding
        benefits={[
          {
            icon: <Star className="size-5" />,
            title: '나만의 평가',
            description: '작품을 별점으로 평가하고 기록해요',
          },
          {
            icon: <TrendingUp className="size-5" />,
            title: '취향 분석',
            description: '평가 데이터로 취향을 파악할 수 있어요',
          },
          {
            icon: <Trophy className="size-5" />,
            title: '추천 개선',
            description: '평가할수록 더 정확한 추천을 받아요',
          },
        ]}
        description="작품을 평가하고 나만의 취향을 기록해보세요"
        icon={<Star className="size-12 text-brand" />}
        title="아직 평가한 작품이 없어요"
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
