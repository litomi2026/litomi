import { LibraryBig } from 'lucide-react'

import StatusState, { StatusActionLink } from '@/components/status/StatusState'

import { LIBRARY_HEADER_SPACER_CLASS_NAME } from '../libraryHeaderLayout'

export default function NotFound() {
  return (
    <>
      <div aria-hidden className={LIBRARY_HEADER_SPACER_CLASS_NAME} />
      <StatusState
        description="삭제되었거나 접근할 수 없는 서재일 수 있어요"
        headingLevel={1}
        icon={<LibraryBig className="size-8" />}
        title="서재를 찾을 수 없어요"
      >
        <StatusActionLink href="/library">서재로 돌아가기</StatusActionLink>
      </StatusState>
    </>
  )
}
