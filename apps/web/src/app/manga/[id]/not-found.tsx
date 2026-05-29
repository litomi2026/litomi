import { SearchX } from 'lucide-react'

import StatusState, { StatusActionLink } from '@/components/status/StatusState'

export default function NotFound() {
  return (
    <StatusState
      className="min-h-dvh"
      description="주소가 바뀌었거나 더 이상 제공되지 않는 작품일 수 있어요"
      icon={<SearchX className="size-8" />}
      title="작품을 찾을 수 없어요"
    >
      <StatusActionLink href="/new/1">다른 작품 보러가기</StatusActionLink>
    </StatusState>
  )
}
