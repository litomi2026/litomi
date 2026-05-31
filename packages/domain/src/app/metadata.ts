import { Locale, type PublicLocale } from '../locale'

export const APPLICATION_NAME = '리토미 - 만화 웹 뷰어'
export const SHORT_NAME = '리토미'
export const THEME_COLOR = '#0a0a0a'

export const DESCRIPTION =
  '만화 웹 뷰어 - 히토미 대체 서비스로 E-Hentai 계열 만화, 동인지, 일러스트를 광고 없이 한 곳에서 감상하세요.'

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
  [Locale.JA]: {
    applicationName: 'Litomi - 漫画ウェブビューア',
    description: 'E-Hentai 系の漫画、同人誌、イラストを広告なしでまとめて楽しめる漫画ウェブビューアです。',
    shortName: 'Litomi',
  },
  [Locale.ZH_CN]: {
    applicationName: 'Litomi - 漫画网页阅读器',
    description: '一个漫画网页阅读器，可在无广告环境中集中浏览 E-Hentai 系漫画、同人志和插画。',
    shortName: 'Litomi',
  },
} satisfies Record<PublicLocale, { applicationName: string; description: string; shortName: string }>
