import { Calendar, Clock, TrendingUp, Trophy } from 'lucide-react'
import Link from 'next/link'

import Onboarding from '@/app/(navigation)/(right-search)/[name]/settings/Onboarding'

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <Onboarding
        benefits={[
          {
            icon: <Calendar className="size-5" />,
            title: '자동 기록',
            description: '읽은 작품이 날짜별로 자동 정리돼요',
          },
          {
            icon: <TrendingUp className="size-5" />,
            title: '진행 상황',
            description: '읽은 페이지와 진행률을 한눈에 확인해요',
          },
          {
            icon: <Trophy className="size-5" />,
            title: '독서 통계',
            description: '얼마나 많이 읽었는지 기록이 쌓여요',
          },
        ]}
        description="작품을 읽으면 자동으로 기록이 남아요"
        icon={<Clock className="size-12 text-brand" />}
        title="아직 읽은 작품이 없어요"
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
