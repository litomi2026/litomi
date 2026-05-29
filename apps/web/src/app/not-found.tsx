import { SearchX } from 'lucide-react'

import StatusState, { StatusActionLink } from '@/components/status/StatusState'

export default function NotFound() {
  return (
    <StatusState
      className="min-h-dvh"
      description="주소가 잘못되었거나 더 이상 제공하지 않는 페이지예요"
      icon={<SearchX className="size-8" />}
      title="페이지를 찾을 수 없어요"
    >
      <StatusActionLink href="/new/1">홈으로 가기</StatusActionLink>
    </StatusState>
  )
}
