import { harpiTagMap } from '@/database/harpi-tag'
import { isMangaKey } from '@/database/manga'
import { Manga } from '@/types/manga'
import dayjs from 'dayjs'
import Link from 'next/link'
import { memo } from 'react'

import IconExternalLink from './icons/IconExternalLink'
import MangaCardPreviewImage from './MangaCardPreviewImage'
import TagList from './TagList'

const BLIND_TAG_LABELS = {
  bestiality: '수간',
  guro: '고어',
  snuff: '스너프',
  yaoi: '게이',
  scat: '스캇',
} as const

const BLIND_TAGS = Object.keys(BLIND_TAG_LABELS)

type Props = {
  manga: Manga
  index?: number
}

export default memo(MangaCard)

function MangaCard({ manga, index = 0 }: Props) {
  const { id, artists, characters, date, group, related, series, tags, title, type, images } = manga
  const mappedTags = tags?.map((tag) => harpiTagMap[tag] || tag)
  const translatedTags = mappedTags?.map((tag) => (typeof tag === 'string' ? tag : tag.korStr || tag.engStr))

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

  const existedRelatedIds = related?.filter((id) => isMangaKey(String(id)))

  return (
    <li
      className="grid grid-rows-[auto_1fr] sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 lg:grid-rows-1 border-2 rounded-lg overflow-hidden bg-zinc-900 border-zinc-800"
      key={id}
    >
      <div className="relative h-fit my-auto">
        <MangaCardPreviewImage manga={manga} mangaIndex={index} />
        {censoredTags && censoredTags.length > 0 && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur flex items-center justify-center text-center p-4 pointer-events-none">
            <div className="text-foreground text-center font-semibold flex flex-wrap gap-1 justify-center">
              <span>{censoredTags.join('/')}</span>
              <span>작품 검열</span>
            </div>
          </div>
        )}
        <div className="absolute bottom-1 right-1 px-1 font-medium text-sm bg-background rounded">{images.length}p</div>
      </div>
      <div className="flex grow flex-col border-t-2 sm:border-t-0 sm:border-l-2 md:border-l-0 md:border-t-2 lg:border-t-0 lg:border-l-2 border-zinc-800 justify-between p-2 gap-2">
        <div className="flex flex-col gap-2 text-sm">
          <h4 className="line-clamp-3 font-bold text-base lg:line-clamp-6 leading-5 min-w-0">{title}</h4>
          <div>종류 {type}</div>
          {artists && artists.length > 0 && <div className="line-clamp-1">작가 {artists.join(', ')}</div>}
          {group && group.length > 0 && <div className="line-clamp-1">그룹 {group.join(', ')}</div>}
          {series && series.length > 0 && <div className="line-clamp-1">시리즈 {series.join(', ')}</div>}
          {characters && characters.length > 0 && <div className="line-clamp-1">캐릭터 {characters.join(', ')}</div>}
          {existedRelatedIds && existedRelatedIds.length > 0 && (
            <div className="flex gap-2 whitespace-nowrap">
              연관
              <ul className="flex flex-wrap overflow-auto gap-1">
                {existedRelatedIds.map((id) => (
                  <li className="rounded px-1 text-foreground bg-zinc-500" key={id}>
                    <Link href={`/manga/${id}`}>{id}</Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {translatedTags && translatedTags.length > 0 && (
            <div className="flex gap-2 whitespace-nowrap">
              태그
              <TagList
                className="flex flex-wrap gap-1 font-semibold [&_li]:rounded [&_li]:px-1 [&_li]:text-foreground"
                tags={translatedTags}
              />
            </div>
          )}
        </div>
        <div className="flex text-xs justify-between items-center gap-1">
          <a
            className="text-zinc-500 focus:underline flex items-center gap-1 hover:underline"
            href={`/manga/${id}`}
            target="_blank"
          >
            {id}
            <IconExternalLink className="w-3" />
          </a>
          <div className="text-right text-zinc-500"></div>
          <div className="text-right text-zinc-500">{dayjs(date).format('YYYY-MM-DD HH:mm')}</div>
        </div>
      </div>
    </li>
  )
}
