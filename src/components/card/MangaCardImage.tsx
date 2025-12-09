import Link from 'next/link'

import { Manga } from '@/types/manga'
import { getViewerLink } from '@/utils/manga'

import LinkPending from '../LinkPending'
import MangaImage from '../MangaImage'
import MangaCardCensorship from './MangaCardCensorship'
import MangaCardPreviewImages from './MangaCardPreviewImages'

type Props = {
  manga: Manga
  mangaIndex: number
  className?: string
}

export default function MangaCardImage({ manga, mangaIndex, className = '' }: Readonly<Props>) {
  const { count, images = [] } = manga
  const href = getViewerLink(manga.id)

  return (
    <div className={`overflow-hidden relative ${className}`}>
      {/* NOTE(gwak, 2025-04-01): 썸네일 이미지만 있는 경우 대응하기 위해 이미지 배열 길이 검사 */}
      {images.length > 1 ? (
        <MangaCardPreviewImages
          className="flex overflow-x-auto h-fit snap-x snap-mandatory select-none scrollbar-hidden relative"
          href={href}
          manga={manga}
          mangaIndex={mangaIndex}
        />
      ) : images.length > 0 ? (
        <Link
          className="flex overflow-x-auto h-fit snap-x snap-mandatory select-none scrollbar-hidden relative"
          href={href}
          prefetch={false}
        >
          <LinkPending
            className="size-6"
            wrapperClassName="flex items-center justify-center absolute inset-0 bg-background/80 animate-fade-in-fast"
          />
          <MangaImage
            fetchPriority={mangaIndex < 4 ? 'high' : undefined}
            mangaId={manga.id}
            src={images[0]?.thumbnail?.url ?? images[0]?.original?.url}
          />
        </Link>
      ) : null}
      <MangaCardCensorship manga={manga} />
      <div className="absolute bottom-1 right-1 px-1 font-medium text-sm bg-background rounded">
        {count ?? images.length}p
      </div>
    </div>
  )
}
