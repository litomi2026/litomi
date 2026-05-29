import { ShieldAlert } from 'lucide-react'
import Link from 'next/link'

import StatusState, { StatusActionLink } from '@/components/status/StatusState'

export default function Forbidden() {
  return (
    <StatusState
      className="min-h-dvh"
      description={
        <>
          이 작품은 커뮤니티 가이드라인 또는 법적 규정에 따라
          <br className="hidden sm:block" />
          현재 열람이 제한되어 있습니다
        </>
      }
      headingLevel={1}
      icon={<ShieldAlert className="size-8" />}
      intent="restricted"
      title="접근 제한된 콘텐츠"
    >
      <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
        <StatusActionLink className="max-w-none" href="/new/1" variant="secondary">
          신작 페이지
        </StatusActionLink>
        <StatusActionLink className="max-w-none" href="/">
          홈으로 가기
        </StatusActionLink>
      </div>
      <p className="max-w-sm text-xs leading-5 text-zinc-600">
        제한 사유에 대한 문의는{' '}
        <Link className="text-zinc-500 underline underline-offset-2 transition hover:text-zinc-400" href="/doc/terms">
          이용약관
        </Link>
        을 참고해 주세요
      </p>
    </StatusState>
  )
}
