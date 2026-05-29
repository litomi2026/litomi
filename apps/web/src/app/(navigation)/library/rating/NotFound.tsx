import { Star } from 'lucide-react'
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
          description="작품을 평가하고 나만의 취향을 기록해보세요"
          icon={<Star className="size-8" />}
          title="아직 평가한 작품이 없어요"
        >
          <Link className={getStatusActionClassName('primary')} href="/library" prefetch={false}>
            작품 둘러보기
          </Link>
        </StatusState>
      </div>
    </>
  )
}
