import { Clock } from 'lucide-react'
import Link from 'next/link'

import StatusState from '@/components/status/StatusState'
import { getStatusActionClassName } from '@/components/status/styles'

import { LIBRARY_HEADER_SPACER_CLASS_NAME } from '../libraryHeaderLayout'

export default function NotFound() {
  return (
    <>
      <div aria-hidden className={LIBRARY_HEADER_SPACER_CLASS_NAME} />
      <div className="flex-1 flex items-center justify-center">
        <StatusState
          description="작품을 읽으면 자동으로 기록이 남아요"
          icon={<Clock className="size-8" />}
          title="아직 읽은 작품이 없어요"
        >
          <Link className={getStatusActionClassName('primary')} href="/library" prefetch={false}>
            작품 둘러보기
          </Link>
        </StatusState>
      </div>
    </>
  )
}
