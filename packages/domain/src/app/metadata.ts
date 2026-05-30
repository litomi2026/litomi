import { Locale } from '../locale'

export const APPLICATION_NAME = '리토미 - 만화 웹 뷰어'
export const SHORT_NAME = '리토미'
export const THEME_COLOR = '#0a0a0a'

export const DESCRIPTION =
  '만화 웹 뷰어 - 히토미 대체 서비스로 E-Hentai 계열 만화, 동인지, 일러스트를 광고 없이 한 곳에서 감상하세요.'

export type AppMetadataLocale = Locale.EN | Locale.KO

export const APP_METADATA = {
  [Locale.KO]: {
    applicationName: APPLICATION_NAME,
    description: DESCRIPTION,
    shortName: SHORT_NAME,
  },
  [Locale.EN]: {
    applicationName: 'Litomi - Manga Web Viewer',
    description:
      'A manga web viewer for browsing E-Hentai-style manga, doujinshi, and illustrations in one ad-free place.',
    shortName: 'Litomi',
  },
} satisfies Record<AppMetadataLocale, { applicationName: string; description: string; shortName: string }>
