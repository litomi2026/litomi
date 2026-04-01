import { Bookmark, Eye, Library, Star } from 'lucide-react'

export enum MetricParam {
  VIEW = 'view',
  LIBRARY = 'library',
  BOOKMARK = 'bookmark',
  RATING = 'rating',
  // POST = 'post',
}

export enum PeriodParam {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
}

export type Params = {
  metric: MetricParam
  period: PeriodParam
}

export type RankingPrimaryIconStyle = 'fill' | 'stroke-bold'

export const DEFAULT_METRIC = MetricParam.VIEW
export const DEFAULT_PERIOD = PeriodParam.WEEK

export const metricInfo = {
  [MetricParam.VIEW]: { label: '조회', icon: Eye, selectedIconStyle: 'stroke-bold' },
  [MetricParam.BOOKMARK]: { label: '북마크', icon: Bookmark, selectedIconStyle: 'fill' },
  [MetricParam.LIBRARY]: { label: '서재', icon: Library, selectedIconStyle: 'stroke-bold' },
  [MetricParam.RATING]: { label: '별점', icon: Star, selectedIconStyle: 'fill' },
  // [MetricParam.POST]: { label: '댓글', icon: MessageCircle },
} as const

export const periodLabels = {
  [PeriodParam.DAY]: '일간',
  [PeriodParam.WEEK]: '주간',
  [PeriodParam.MONTH]: '월간',
  [PeriodParam.QUARTER]: '분기',
  [PeriodParam.YEAR]: '연간',
} as const

export const PRIMARY_RANKING_NAV_LINK_CLASSNAME =
  'relative flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-500 transition hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-700/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-[current=page]:pointer-events-none aria-[current=page]:font-semibold aria-[current=page]:text-foreground after:pointer-events-none after:absolute after:right-4 after:bottom-0.5 after:left-4 after:h-0.5 after:rounded-full after:bg-foreground after:opacity-0 after:transition aria-[current=page]:after:opacity-100'

export const SECONDARY_RANKING_NAV_LINK_CLASSNAME =
  'rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-500 transition hover:bg-zinc-900 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-700/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-[current=page]:pointer-events-none aria-[current=page]:bg-zinc-900 aria-[current=page]:text-foreground'

export function getPrimaryRankingIconClassName(selected: boolean, selectedIconStyle: RankingPrimaryIconStyle) {
  if (!selected) {
    return 'size-4 shrink-0 transition-[fill,stroke-width]'
  }

  if (selectedIconStyle === 'fill') {
    return 'size-4 shrink-0 fill-current transition-[fill,stroke-width]'
  }

  return 'size-4 shrink-0 stroke-[2.75] transition-[fill,stroke-width]'
}
