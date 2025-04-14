import { harpiTagMap } from '@/database/harpi-tag'
import { Manga } from '@/types/manga'
import Link from 'next/link'

import MangaImage from '../MangaImage'
import MangaCardPreviewImages from './MangaCardPreviewImages'

const BLIND_TAG_LABELS = {
  bestiality: '수간',
  수간: '수간',
  guro: '고어',
  고어: '고어',
  snuff: '스너프',
  스너프: '스너프',
  yaoi: '게이',
  야오이: '게이',
  남성만: '게이',
  scat: '스캇',
  스캇: '스캇',
} as const

const BLIND_TAGS = Object.entries(BLIND_TAG_LABELS).flat()

type Props = {
  href: string
  manga: Manga
  index?: number
  className?: string
}

export default function MangaCardImage({ manga, href, index, className = '' }: Props) {
  const { count, tags, images } = manga
  const mappedTags = tags?.map((tag) => harpiTagMap[tag] || tag)

  const censoredTags = mappedTags
    ?.map((decodedTag) => (typeof decodedTag === 'string' ? decodedTag : decodedTag.engStr))
    ?.filter((englishTag) => {
      const tagName = englishTag.split(':').pop() ?? ''
      return BLIND_TAGS.includes(tagName)
    })
    .map((blindedTag) => {
      const tagName = blindedTag.split(':').pop()
      return BLIND_TAG_LABELS[tagName as keyof typeof BLIND_TAG_LABELS]
    })
    .reduce((acc, cur) => acc.add(cur), new Set<string>())

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
        <Link className="flex overflow-x-auto h-fit snap-x snap-mandatory select-none scrollbar-hidden" href={href}>
          <MangaImage imageIndex={0} manga={manga} />
        </Link>
      )}
      {censoredTags && censoredTags.size > 0 && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur flex items-center justify-center text-center p-4 pointer-events-none">
          <div className="text-foreground text-center font-semibold flex flex-wrap gap-1 justify-center">
            <span>{Array.from(censoredTags).join('/')}</span>
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
