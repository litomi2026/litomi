import Link from 'next/link'

import { Manga } from '@/types/manga'

import LinkLoading from '../LinkLoading'
import MangaImage from '../MangaImage'
import MangaCardCensorship from './MangaCardCensorship'
import MangaCardPreviewImages from './MangaCardPreviewImages'

type Props = {
  href: string
  manga: Manga
  mangaIndex: number
  className?: string
}

export default function MangaCardImage({ manga, href, mangaIndex, className = '' }: Readonly<Props>) {
  const { count, images } = manga

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
      ) : (
        <Link
          className="flex overflow-x-auto h-fit snap-x snap-mandatory select-none scrollbar-hidden relative"
          href={href}
          prefetch={false}
        >
          <LinkLoading />
          <MangaImage fetchPriority={mangaIndex < 4 ? 'high' : undefined} manga={manga} />
        </Link>
      )}
      <MangaCardCensorship manga={manga} />
      <div className="absolute bottom-1 right-1 px-1 font-medium text-sm bg-background rounded">
        {count ?? images.length}p
      </div>
    </div>
  )
}
