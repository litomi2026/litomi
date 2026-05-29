import { MessageSquareOff } from 'lucide-react'

import StatusState, { StatusActionLink } from '@/components/status/StatusState'

export default function NotFound() {
  return (
    <StatusState
      description="아직 공개된 답글이 없거나 볼 수 없는 사용자예요"
      icon={<MessageSquareOff className="size-8" />}
      title="답글을 찾을 수 없어요"
    >
      <StatusActionLink href="/posts/recommend">이야기 목록으로 가기</StatusActionLink>
    </StatusState>
  )
}
