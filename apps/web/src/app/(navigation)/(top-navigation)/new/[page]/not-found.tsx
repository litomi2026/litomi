import { LibraryBig } from 'lucide-react'

import StatusState, { StatusActionLink } from '@/components/status/StatusState'

export default function NotFound() {
  return (
    <StatusState
      description="요청한 페이지에 표시할 작품이 없어요"
      headingLevel={1}
      icon={<LibraryBig className="size-8" />}
      title="작품을 찾을 수 없어요"
    >
      <StatusActionLink href="/new/1">첫 페이지로 가기</StatusActionLink>
    </StatusState>
  )
}
