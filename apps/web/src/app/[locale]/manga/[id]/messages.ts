import type { LocalizedMessages } from '@/i18n/messages'

export const messages = {
  ko: {
    Metadata: {
      manga: {
        fallbackTitle: '작품 #{id}',
        forbiddenDescription: '규정에 따라 볼 수 없는 작품이에요.',
        detailTitle: '{title} 상세',
        defaultJsonLdName: '작품',
      },
    },
  },
  en: {
    Metadata: {
      manga: {
        fallbackTitle: 'Manga #{id}',
        forbiddenDescription: 'This manga is unavailable under service policy.',
        detailTitle: '{title} Details',
        defaultJsonLdName: 'Manga',
      },
    },
  },
} satisfies LocalizedMessages
