import { Locale } from '@litomi/domain/locale'

import type { LocalizedMessages } from '@/i18n/messages'

export const messages = {
  [Locale.KO]: {
    Metadata: {
      explore: {
        fortune: {
          title: '오늘의 운세',
          description: '오늘의 분위기와 흐름을 가볍게 확인해 봐요.',
        },
        new: {
          title: '신작',
          pagedTitle: '신작 {page}페이지',
          description: '새로 추가된 작품을 최신순으로 확인하세요.',
        },
        random: {
          title: '랜덤',
          description: '무작위로 추천되는 작품을 둘러보세요.',
        },
        recommendManga: {
          title: '추천 작품',
          description: '리토미가 추천하는 작품을 확인하세요.',
        },
        tag: {
          title: '태그',
          description: '태그별로 작품을 탐색하세요.',
        },
      },
    },
  },
  [Locale.EN]: {
    Metadata: {
      explore: {
        fortune: {
          title: "Today's Fortune",
          description: "Take a light look at today's mood and flow.",
        },
        new: {
          title: 'New',
          pagedTitle: 'New Manga Page {page}',
          description: 'Browse newly added manga in latest order.',
        },
        random: {
          title: 'Random',
          description: 'Browse randomly recommended manga.',
        },
        recommendManga: {
          title: 'Recommended Manga',
          description: 'Discover manga recommended by Litomi.',
        },
        tag: {
          title: 'Tags',
          description: 'Explore manga by tag.',
        },
      },
    },
  },
} satisfies LocalizedMessages
