import type { LocalizedMessages } from '@/i18n/messages'

export const messages = {
  ko: {
    Metadata: {
      ranking: {
        realtime: {
          title: '실시간',
          description: '리토미의 실시간 방문자 현황을 확인하세요.',
        },
        donation: {
          title: '후원 랭킹',
          description: '작품과 창작자를 응원한 후원 랭킹을 확인하세요.',
        },
        title: '{period} {metric} 순위',
        metrics: {
          view: '조회',
          bookmark: '북마크',
          library: '서재',
          rating: '별점',
        },
        periods: {
          day: '일간',
          week: '주간',
          month: '월간',
          quarter: '분기',
          year: '연간',
        },
      },
    },
  },
  en: {
    Metadata: {
      ranking: {
        realtime: {
          title: 'Realtime',
          description: 'Check Litomi realtime visitor activity.',
        },
        donation: {
          title: 'Donation Ranking',
          description: 'See the ranking of donations supporting manga and creators.',
        },
        title: '{period} {metric} Ranking',
        metrics: {
          view: 'Views',
          bookmark: 'Bookmarks',
          library: 'Libraries',
          rating: 'Ratings',
        },
        periods: {
          day: 'Daily',
          week: 'Weekly',
          month: 'Monthly',
          quarter: 'Quarterly',
          year: 'Yearly',
        },
      },
    },
  },
} satisfies LocalizedMessages
