import { FileQuestion } from 'lucide-react'

import StatusState, { StatusActionLink } from '@/components/status/StatusState'

export default function NotFound() {
  return (
    <StatusState
      description="삭제되었거나 더 이상 공개되지 않는 이야기일 수 있어요"
      icon={<FileQuestion className="size-8" />}
      title="이야기를 찾을 수 없어요"
    >
      <StatusActionLink href="/posts/recommend">이야기 목록으로 가기</StatusActionLink>
    </StatusState>
  )
}
