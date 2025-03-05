/* eslint-disable @next/next/no-img-element */

import { getImageSrc } from '@/constants/url'
import { Manga } from '@/types/manga'
import dayjs from 'dayjs'
import Link from 'next/link'

type Props = {
  manga: Manga
  index?: number
}

export default function MangaCard({ manga, index }: Props) {
  const { id, artists, characters, date, group, related, series, tags, title, type, images, cdn } = manga

  return (
    <li className="grid grid-cols-2 border border-stone-700" key={id}>
      <Link className="relative" href={`/manga/${id}`} target="_blank">
        <img
          alt="manga-image"
          className="object-contain bg-stone-900 aspect-[3/4]"
          fetchPriority={index && index < 3 ? 'high' : undefined}
          height={images[0].height ?? 1536}
          referrerPolicy="same-origin"
          src={getImageSrc({ cdn, id, name: images[0].name })}
          width={images[0].width ?? 1536}
        />
        <div className="absolute bottom-1 min-w-7 text-center  left-1/2 -translate-x-1/2 px-1 bg-black rounded">
          {images.length}
        </div>
      </Link>
      <div className="flex flex-col border-l border-stone-700 justify-between p-1 gap-1">
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
                  <li className="rounded px-1 text-white bg-stone-500" key={id}>
                    <Link href={`/manga/${id}`}>{id}</Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {tags.length > 0 && (
            <div className="text-sm flex gap-2 whitespace-nowrap">
              태그
              <ul className="flex xl:flex-wrap overflow-auto gap-1">
                {tags.map((tag) => {
                  const a = tag.split(':')
                  const backgroundColor =
                    {
                      male: 'bg-blue-500',
                      female: 'bg-red-500',
                    }[a[0]] ?? 'bg-gray-500'
                  return (
                    <li className={`rounded px-1 text-white ${backgroundColor}`} key={tag}>
                      {a[a.length - 1]}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
        <div className="flex text-xs justify-between  items-center">
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
