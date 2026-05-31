import { Locale } from '@litomi/domain/locale'

import type { LocalizedMessages } from '@/i18n/messages'

export const messages = {
  [Locale.KO]: {
    Metadata: {
      library: {
        index: {
          title: '공개 서재',
          description: '다른 사용자가 공개한 작품 서재를 둘러보세요.',
        },
        detail: {
          title: '서재',
          description: '공개 서재에 담긴 작품을 확인하세요.',
        },
        bookmark: {
          title: '북마크',
          description: '북마크한 작품을 모아보세요.',
        },
        history: {
          title: '감상 기록',
          description: '최근 감상한 작품 기록을 확인하세요.',
        },
        rating: {
          title: '작품 평가',
          description: '평가한 작품을 모아보고 정리하세요.',
        },
      },
    },
  },
  [Locale.EN]: {
    Metadata: {
      library: {
        index: {
          title: 'Public Libraries',
          description: 'Browse manga libraries shared publicly by other users.',
        },
        detail: {
          title: 'Library',
          description: 'View manga saved in a public library.',
        },
        bookmark: {
          title: 'Bookmarks',
          description: 'See the manga you bookmarked.',
        },
        history: {
          title: 'Viewing History',
          description: 'Check the manga you recently viewed.',
        },
        rating: {
          title: 'Manga Ratings',
          description: 'Review and organize manga you rated.',
        },
      },
    },
  },
} satisfies LocalizedMessages
