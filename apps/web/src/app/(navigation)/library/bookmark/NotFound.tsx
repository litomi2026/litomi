import { Bookmark } from 'lucide-react'
import Link from 'next/link'

import StatusState from '@/components/status/StatusState'
import { getStatusActionClassName } from '@/components/status/styles'

import { LIBRARY_HEADER_SPACER_CLASS_NAME } from '../libraryHeaderLayout'
import BookmarkImportButton from './BookmarkImportButton'
import BookmarkUploadButton from './BookmarkUploadButton'

export default function NotFound() {
  return (
    <>
      <div aria-hidden className={LIBRARY_HEADER_SPACER_CLASS_NAME} />
      <div className="flex-1 flex items-center justify-center">
        <StatusState
          description="좋아하는 작품을 저장하면 여기에서 다시 볼 수 있어요"
          icon={<Bookmark className="size-8" />}
          title="북마크가 비어 있어요"
        >
          <div className="flex w-full max-w-sm flex-col gap-3">
            <Link className={getStatusActionClassName('primary', 'max-w-none')} href="/library" prefetch={false}>
              작품 둘러보기
            </Link>
            <BookmarkUploadButton variant="cta" />
            <BookmarkImportButton variant="cta" />
          </div>
        </StatusState>
      </div>
    </>
  )
}
