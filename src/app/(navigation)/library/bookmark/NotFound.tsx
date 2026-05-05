import { Bookmark, Clock, Download, Search } from 'lucide-react'
import Link from 'next/link'

import Onboarding from '@/app/(navigation)/(right-aside)/[name]/settings/Onboarding'

import { LIBRARY_HEADER_SPACER_CLASS_NAME } from '../libraryHeaderLayout'
import BookmarkImportButton from './BookmarkImportButton'
import BookmarkUploadButton from './BookmarkUploadButton'

export default function NotFound() {
  return (
    <>
      <div aria-hidden className={LIBRARY_HEADER_SPACER_CLASS_NAME} />
      <div className="flex-1 flex items-center justify-center">
        <Onboarding
          benefits={[
            {
              icon: <Clock className="size-5" />,
              title: '나중에 읽기',
              description: '흥미로운 작품을 저장하고 언제든 돌아와요',
            },
            {
              icon: <Search className="size-5" />,
              title: '빠른 접근',
              description: '좋아하는 작품을 쉽게 찾아볼 수 있어요',
            },
            {
              icon: <Download className="size-5" />,
              title: '백업 지원',
              description: '북마크를 다운로드하고 안전하게 보관해요',
            },
          ]}
          description="좋아하는 작품을 북마크하고 언제든 다시 찾아보세요"
          icon={<Bookmark className="size-12 text-brand" />}
          title="북마크가 비어 있어요"
        >
          <div className="flex w-full max-w-sm flex-col gap-3">
            <BookmarkImportButton variant="cta" />
            <BookmarkUploadButton variant="cta" />
            <Link
              className="w-full rounded-2xl border-2 border-zinc-800 bg-zinc-900 px-6 py-3 text-center font-semibold text-zinc-100 transition hover:border-zinc-700 hover:bg-zinc-800"
              href="/library"
              prefetch={false}
            >
              작품 둘러보기
            </Link>
          </div>
        </Onboarding>
      </div>
    </>
  )
}
