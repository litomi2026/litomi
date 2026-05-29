import { Shuffle } from 'lucide-react'

import StatusState, { StatusActionLink } from '@/components/status/StatusState'

export default function NotFound() {
  return (
    <StatusState
      description="조건에 맞는 랜덤 작품을 찾지 못했어요"
      headingLevel={1}
      icon={<Shuffle className="size-8" />}
      title="작품을 찾을 수 없어요"
    >
      <StatusActionLink href="/random">다시 뽑기</StatusActionLink>
    </StatusState>
  )
}
