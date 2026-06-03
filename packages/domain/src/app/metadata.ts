import { Locale, type PublicLocale } from '../locale'

export const APPLICATION_NAME = '리토미 - 만화 웹 뷰어'
export const SHORT_NAME = '리토미'
export const THEME_COLOR = '#0a0a0a'

export const DESCRIPTION =
  '히토미 미러 만화 웹 뷰어 서비스로 E-Hentai 계열 만화, 동인지, 일러스트를 한 곳에서 감상하세요. 익명 인증 후 광고가 자동으로 숨겨져요.'

export const APP_METADATA = {
  [Locale.KO]: {
    applicationName: APPLICATION_NAME,
    description: DESCRIPTION,
    shortName: SHORT_NAME,
  },
  [Locale.EN]: {
    applicationName: 'Litomi - Manga Web Viewer',
    description:
      'A manga web viewer for browsing E-Hentai-style manga, doujinshi, and illustrations in one place. Ads are automatically hidden after anonymous verification.',
    shortName: 'Litomi',
  },
  [Locale.JA]: {
    applicationName: 'リトミ - 漫画ウェブビューア',
    description:
      'E-Hentai 系の漫画、同人誌、イラストをまとめて楽しめる漫画ウェブビューアです。匿名の認証後、広告は自動的に非表示になります。',
    shortName: 'リトミ',
  },
  [Locale.ZH_CN]: {
    applicationName: '莉托米 - 漫画网页阅读器',
    description: '一个漫画网页阅读器，可集中浏览 E-Hentai 系漫画、同人志和插画。匿名认证后，广告会自动隐藏。',
    shortName: '莉托米',
  },
} satisfies Record<PublicLocale, { applicationName: string; description: string; shortName: string }>
