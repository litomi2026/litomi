import { harpiTagMap } from '@/database/harpi-tag'
import { Manga } from '@/types/manga'
import dayjs from 'dayjs'
import Link from 'next/link'

import MangaImage from './MangaImage'

const BLIND_TAG_LABELS = {
  bestiality: '수간',
  guro: '고어',
  snuff: '스너프',
  yaoi: '게이',
  scat: '스캇',
} as const

const tagStyles = {
  male: 'bg-blue-500',
  female: 'bg-red-500',
  남: 'bg-blue-500',
  여: 'bg-red-500',
}

const BLIND_TAGS = Object.keys(BLIND_TAG_LABELS)

type Props = {
  manga: Manga
  index?: number
}

export default function MangaCard({ manga, index }: Props) {
  const { id, artists, characters, date, group, related, series, tags, title, type, images } = manga

  const decodedTags = tags?.map((tag) => harpiTagMap[tag] || tag)
  const englishTags = decodedTags?.map((tag) => (typeof tag === 'string' ? tag : tag.engStr))
  const koreanTags = decodedTags?.map((tag) => (typeof tag === 'string' ? tag : tag.korStr || tag.engStr))

  const censoredTags = englishTags
    ?.filter((tag) => {
      const tagName = tag.split(':').pop() ?? ''
      return BLIND_TAGS.includes(tagName)
    })
    .map((tag) => {
      const tagName = tag.split(':').pop()
      return BLIND_TAG_LABELS[tagName as keyof typeof BLIND_TAG_LABELS]
    })

  return (
    <li className="grid grid-cols-2 border rounded-lg overflow-hidden border-gray-700" key={id}>
      <div className="relative">
        <Link
          className="flex overflow-x-auto snap-x snap-mandatory relative"
          draggable={false}
          href={`/manga/${manga.id}`}
          target="_blank"
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <MangaImage
              className="object-contain snap-start bg-gray-900 aspect-[3/4]"
              fetchPriority={index && index < 3 ? 'high' : 'low'}
              imageIndex={i}
              key={i}
              manga={manga}
            />
          ))}
        </Link>
        {censoredTags && censoredTags.length > 0 && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur flex items-center justify-center text-center p-4">
            <div className="text-foreground text-center font-semibold flex flex-wrap gap-1 justify-center">
              <span>{censoredTags.join('/')}</span>
              <span>작품 검열</span>
            </div>
          </div>
        )}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 px-1.5 bg-background rounded">{images.length}</div>
      </div>
      <div className="flex flex-col border-l border-gray-700 justify-between p-2 gap-1">
        <div className="flex flex-col gap-2">
          <h4 className="line-clamp-3 sm:line-clamp-6 md:line-clamp-1 lg:line-clamp-3 xl:line-clamp-6 leading-5 min-w-0">
            {title}
          </h4>
          <div className="text-sm">종류 {type}</div>
          {artists && artists.length > 0 && <div className="text-sm line-clamp-1">작가 {artists.join(', ')}</div>}
          {group && group.length > 0 && <div className="text-sm line-clamp-1">그룹 {group.join(', ')}</div>}
          {series && series.length > 0 && <div className="text-sm line-clamp-1">시리즈 {series.join(', ')}</div>}
          {characters && characters.length > 0 && (
            <div className="text-sm line-clamp-1">캐릭터 {characters.join(', ')}</div>
          )}
          {related && related.length > 0 && (
            <div className="text-sm flex gap-2 whitespace-nowrap">
              연관
              <ul className="flex xl:flex-wrap overflow-auto gap-1">
                {related.map((id) => (
                  <li className="rounded px-1 text-foreground bg-gray-500" key={id}>
                    <Link href={`/manga/${id}`}>{id}</Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {koreanTags && koreanTags.length > 0 && (
            <div className="text-sm flex gap-2 whitespace-nowrap">
              태그
              <ul className="flex xl:flex-wrap overflow-auto gap-1">
                {koreanTags.map((tag) => {
                  const [category, label] = tag.split(':')
                  const tagStyle = tagStyles[category as keyof typeof tagStyles] ?? 'bg-gray-500'
                  return (
                    <li className={`rounded px-1 text-foreground ${tagStyle}`} key={tag}>
                      {label}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
        <div className="flex text-xs justify-between items-center">
          <Link className="text-gray-500 focus:underline hover:underline" href={`/manga/${id}`}>
            {id}
          </Link>
          <div className="text-right text-gray-500"></div>
          <div className="text-right text-gray-500">{dayjs(date).format('YYYY-MM-DD HH:mm')}</div>
        </div>
      </div>
    </li>
  )
}
