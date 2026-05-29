import { UserRoundX } from 'lucide-react'

import StatusState, { StatusActionLink } from '@/components/status/StatusState'

export default function NotFound() {
  return (
    <StatusState
      description="주소가 바뀌었거나 공개된 프로필을 찾을 수 없어요"
      headingLevel={1}
      icon={<UserRoundX className="size-8" />}
      title="사용자를 찾을 수 없어요"
    >
      <StatusActionLink href="/posts/recommend">이야기 목록으로 가기</StatusActionLink>
    </StatusState>
  )
}
