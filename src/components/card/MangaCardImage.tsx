import Link from 'next/link'
import { useMemo } from 'react'

import { Manga } from '@/types/manga'

import MangaImage from '../MangaImage'
import MangaCardPreviewImages from './MangaCardPreviewImages'

const BLIND_TAG_VALUE_TO_LABEL: Record<string, string> = {
  bestiality: '수간',
  guro: '고어',
  snuff: '스너프',
  yaoi: '게이',
  males_only: '게이',
  scat: '스캇',
}

const BLIND_TAG_VALUES = Object.keys(BLIND_TAG_VALUE_TO_LABEL)

const PREFETCH_INDEX = 10

type Props = {
  href: string
  manga: Manga
  index: number
  className?: string
}

export default function MangaCardImage({ manga, href, index, className = '' }: Readonly<Props>) {
  const { count, tags, images } = manga

  const censoredTags = useMemo(
    () =>
      tags?.filter(({ value }) => BLIND_TAG_VALUES.includes(value)).map(({ value }) => BLIND_TAG_VALUE_TO_LABEL[value]),
    [tags],
  )

  return (
    <div className={`overflow-hidden ${className}`}>
      {/* NOTE(gwak, 2025-04-01): 썸네일 이미지만 있는 경우 대응하기 위해 이미지 배열 길이 검사 */}
      {images.length > 1 ? (
        <MangaCardPreviewImages
          className="flex overflow-x-auto h-fit snap-x snap-mandatory select-none scrollbar-hidden"
          href={href}
          manga={manga}
          mangaIndex={index}
        />
      ) : (
        <Link
          className="flex overflow-x-auto h-fit snap-x snap-mandatory select-none scrollbar-hidden"
          href={href}
          prefetch={index < PREFETCH_INDEX}
        >
          <MangaImage imageIndex={0} manga={manga} />
        </Link>
      )}
      {censoredTags && censoredTags.length > 0 && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur flex items-center justify-center text-center p-4 pointer-events-none">
          <div className="text-foreground text-center font-semibold flex flex-wrap gap-1 justify-center">
            <span>{Array.from(new Set(censoredTags)).join(', ')}</span>
            <span>작품 검열</span>
          </div>
        </div>
      )}
      <div className="absolute bottom-1 right-1 px-1 font-medium text-sm bg-background rounded">
        {count ?? images.length}p
      </div>
    </div>
  )
}
