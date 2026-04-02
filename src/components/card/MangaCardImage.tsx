import Link from 'next/link'
import { twMerge } from 'tailwind-merge'

import { Manga } from '@/types/manga'
import { getViewerLink } from '@/utils/manga'
import { View } from '@/utils/param'

import LinkPending from '../LinkPending'
import MangaImage from '../MangaImage'
import MangaCardCensorship from './MangaCardCensorship'
import MangaCardPreviewImages from './MangaCardPreviewImages'
import MangaCardRankBadge from './MangaCardRankBadge'
import MangaTorrentBadge from './MangaTorrentBadge'

type Props = {
  manga: Manga
  mangaIndex: number
  rank?: number
  className?: string
  variant: View
}

const VARIANT_CONFIG = {
  [View.CARD]: {
    containerClassName:
      'h-fit my-auto aspect-4/3 [&_img]:snap-start [&_img]:shrink-0 [&_img]:w-full [&_img]:object-contain [&_img]:aspect-4/3',
    imageContainerClassName: 'h-fit',
    pageCountClassName: 'bottom-1 right-1',
    rankBadgeClassName: 'top-1 left-1',
    showPreviewImages: true,
    torrentBadgeClassName: 'bottom-1 left-1',
  },
  [View.IMAGE]: {
    containerClassName:
      'aspect-5/7 [&_img]:block [&_img]:h-full [&_img]:snap-start [&_img]:shrink-0 [&_img]:w-full [&_img]:object-cover [&_img]:aspect-5/7',
    imageContainerClassName: 'h-full',
    pageCountClassName: 'bottom-2 right-2',
    rankBadgeClassName: 'top-2 left-2',
    showPreviewImages: false,
    torrentBadgeClassName: 'bottom-2 left-2',
  },
} as const

export default function MangaCardImage({ manga, mangaIndex, rank, className = '', variant }: Props) {
  const { count, images = [] } = manga
  const href = getViewerLink(manga.id)
  const config = VARIANT_CONFIG[variant]
  const shouldShowPreviewImages = config.showPreviewImages && images.length > 1

  return (
    <div className={twMerge('overflow-hidden relative', config.containerClassName, className)}>
      {/* NOTE(gwak, 2025-04-01): 썸네일 이미지만 있는 경우 대응하기 위해 이미지 배열 길이 검사 */}
      {shouldShowPreviewImages ? (
        <MangaCardPreviewImages
          className={twMerge(
            'flex overflow-x-auto snap-x snap-mandatory select-none scrollbar-hidden relative',
            config.imageContainerClassName,
          )}
          href={href}
          manga={manga}
          mangaIndex={mangaIndex}
        />
      ) : images.length > 0 ? (
        <Link
          className={twMerge(
            'flex overflow-x-auto snap-x snap-mandatory select-none scrollbar-hidden relative',
            config.imageContainerClassName,
          )}
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
            variant="thumbnail"
          />
        </Link>
      ) : null}
      <MangaCardCensorship manga={manga} />
      {rank && rank > 0 && <MangaCardRankBadge className={config.rankBadgeClassName} rank={rank} />}
      <MangaTorrentBadge
        className={twMerge('absolute z-10 font-semibold text-xs', config?.torrentBadgeClassName)}
        manga={manga}
      />
      <div
        className={twMerge('absolute z-10 px-1 font-medium text-sm bg-background rounded', config?.pageCountClassName)}
      >
        {count ?? images.length}p
      </div>
    </div>
  )
}
