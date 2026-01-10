import { ShieldCheck, ShieldX, Sparkles, Unlock } from 'lucide-react'
import Link from 'next/link'

import Onboarding from '@/app/(navigation)/(right-search)/[name]/settings/Onboarding'

type Props = {
  username?: string
}

export default function AdultVerificationRequired({ username }: Props) {
  const settingsHref = username ? `/@${username}/settings#adult` : null

  return (
    <div className="flex-1 flex items-center justify-center">
      <Onboarding
        benefits={[
          {
            icon: <Unlock className="size-5" />,
            title: '감상 기록 보기',
            description: '성인으로 확인되면 감상 기록을 볼 수 있어요',
          },
          {
            icon: <Sparkles className="size-5" />,
            title: '이어 읽기',
            description: '마지막으로 읽던 페이지부터 이어서 읽을 수 있어요',
          },
          {
            icon: <ShieldX className="size-5" />,
            title: '안전한 접근',
            description: '성인 콘텐츠는 성인 여부 확인 후 제공해요',
          },
        ]}
        description="감상 기록을 보려면 익명 성인인증이 필요해요"
        icon={<ShieldCheck className="size-12 text-brand" />}
        title="성인인증이 필요해요"
      >
        {settingsHref ? (
          <Link
            className="px-6 py-3 rounded-2xl bg-brand font-semibold text-background hover:opacity-80 transition"
            href={settingsHref}
            prefetch={false}
          >
            성인인증하기
          </Link>
        ) : (
          <p className="text-sm text-zinc-500">설정에서 익명 성인인증을 완료해 주세요</p>
        )}
      </Onboarding>
    </div>
  )
}
