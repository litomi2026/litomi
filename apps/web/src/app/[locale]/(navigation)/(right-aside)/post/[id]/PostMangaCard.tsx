'use client'

import type { Manga } from '@litomi/domain/manga/model'

import { CensorshipLevel } from '@litomi/domain/censorship/model'
import { MessageCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { twMerge } from 'tailwind-merge'

import MangaCardCensorship from '@/components/card/MangaCardCensorship'
import MangaImage from '@/components/MangaImage'
import useMangaCensorship from '@/hook/useMangaCensorship'
import useMangaListCachedQuery from '@/hook/useMangaListCachedQuery'
import { Link } from '@/i18n/navigation'

type Props = {
  mangaId: number
  catalogManga?: Manga
  variant?: 'cover' | 'inline'
  className?: string
  imageClassName?: string
}

const VARIANT_CONFIG = {
  cover: {
    containerClassName: 'relative overflow-hidden rounded-t-2xl border-b-2 border-zinc-800',
    linkClassName: 'block',
  },
  inline: {
    containerClassName:
      'relative overflow-hidden rounded-lg border-2 border-zinc-700 bg-zinc-800/50 transition hover:bg-zinc-800 hover:border-zinc-600',
    linkClassName: 'flex gap-3 p-3',
  },
} as const

export default function PostMangaCard({
  mangaId,
  catalogManga,
  variant = 'inline',
  className = '',
  imageClassName = '',
}: Props) {
  const { getMatch } = useMangaCensorship()
  const t = useTranslations('Community.post')

  const { mangaMap } = useMangaListCachedQuery({
    catalogMangas: [catalogManga],
    mangaIds: [mangaId],
  })

  const manga = mangaMap.get(mangaId)
  const config = VARIANT_CONFIG[variant]
  const containerClassName = twMerge(config.containerClassName, className)

  if (!manga) {
    return <PostMangaCardSkeleton className={containerClassName} imageClassName={imageClassName} variant={variant} />
  }

  if (getMatch(manga).highestCensorshipLevel === CensorshipLevel.HEAVY) {
    return null
  }

  const title = manga.title
  const thumbnailUrl = manga.images?.[0]?.original?.url ?? manga.images?.[0]?.thumbnail?.url

  if (variant === 'cover') {
    return (
      <div className={containerClassName}>
        <Link className={config.linkClassName} href={`/manga/${mangaId}`} prefetch={false}>
          <MangaImage
            alt={title}
            className={twMerge(
              'block w-full h-auto bg-zinc-900 aspect-7/5 object-contain sm:aspect-[auto_5/7]',
              imageClassName,
            )}
            mangaId={mangaId}
            src={thumbnailUrl}
            variant="thumbnail"
          />
        </Link>
        <MangaCardCensorship manga={manga} />
      </div>
    )
  }

  return (
    <div className={containerClassName}>
      <Link className={config.linkClassName} href={`/manga/${mangaId}`} prefetch={false}>
        <MangaImage
          alt={title}
          className={twMerge('w-20 aspect-5/7 object-cover rounded border-2 border-zinc-700 shrink-0', imageClassName)}
          mangaId={mangaId}
          src={thumbnailUrl}
          variant="thumbnail"
        />
        <div className="flex flex-col gap-2 min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <MessageCircle className="size-5 text-brand shrink-0 mt-0.5" />
            <h3 className="font-bold text-base leading-tight line-clamp-2 wrap-break-word break-all">{title}</h3>
          </div>
          <span className="text-sm text-zinc-400">{t('viewWork')}</span>
        </div>
      </Link>
      <MangaCardCensorship manga={manga} />
    </div>
  )
}

function PostMangaCardSkeleton({
  className,
  imageClassName,
  variant,
}: {
  className: string
  imageClassName: string
  variant: NonNullable<Props['variant']>
}) {
  if (variant === 'cover') {
    return (
      <div aria-busy className={className}>
        <div
          className={twMerge('block w-full bg-zinc-900 aspect-7/5 animate-pulse sm:aspect-[auto_5/7]', imageClassName)}
        />
      </div>
    )
  }

  return (
    <div aria-busy className={className}>
      <div className={VARIANT_CONFIG.inline.linkClassName}>
        <div
          className={twMerge('w-20 aspect-5/7 rounded border-2 border-zinc-700 bg-zinc-900 shrink-0', imageClassName)}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-2 py-0.5">
          <div className="h-5 w-3/4 rounded bg-zinc-700" />
          <div className="h-4 w-20 rounded bg-zinc-700" />
        </div>
      </div>
    </div>
  )
}
