import { Bookmark, Eye, Library, MessageCircle } from 'lucide-react'
import { ElementType } from 'react'

import { sec } from '@/utils/date'

export enum MetricParam {
  VIEW = 'view',
  LIBRARY = 'library',
  BOOKMARK = 'bookmark',
  POST = 'post',
}

export enum PeriodParam {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  HALF = 'half',
  YEAR = 'year',
  ALL = 'all',
}

export type Params = {
  metric: MetricParam
  period: PeriodParam
}

export const DEFAULT_METRIC = MetricParam.VIEW
export const DEFAULT_PERIOD = PeriodParam.WEEK

export const metricInfo: Record<string, { label: string; icon: ElementType }> = {
  [MetricParam.VIEW]: { label: '조회수', icon: Eye },
  [MetricParam.BOOKMARK]: { label: '북마크', icon: Bookmark },
  [MetricParam.LIBRARY]: { label: '서재', icon: Library },
  [MetricParam.POST]: { label: '댓글', icon: MessageCircle },
}

export const periodLabels: Record<string, string> = {
  [PeriodParam.DAY]: '일간',
  [PeriodParam.WEEK]: '주간',
  [PeriodParam.MONTH]: '월간',
  [PeriodParam.QUARTER]: '분기',
  [PeriodParam.HALF]: '반기',
  [PeriodParam.YEAR]: '연간',
  [PeriodParam.ALL]: '전체',
}

export const RANKING_PAGE_REVALIDATE = sec('23 hours')
