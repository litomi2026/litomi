import { Locale } from '@litomi/domain/locale'

import type { LocalizedMessages } from '@/i18n/messages'

export const messages = {
  [Locale.KO]: {
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
    RankingDonationPage: {
      summaryTitle: '후원한 만큼 작가에게 돌아가요',
      detailsLabel: '자세히',
      summaryDescription:
        '후원해주신 리보는 모두 작가님을 응원하는 데 사용돼요. 획득한 리보로 좋아하는 작품의 창작자를 후원해보세요.',
      rankColumn: '순위',
      recipientColumn: '대상',
      totalColumn: '총 후원',
      searchTitle: '검색으로 이동',
      artistType: '작가',
      groupType: '단체',
      liboAmount: '{amount} 리보',
      empty: '아직 후원 데이터가 없어요',
    },
    RealtimeRanking: {
      activeUsersLabel: '현재 활성 사용자',
      lastUpdated: '마지막 업데이트: {time}',
      privacyNotice: '개인정보 보호를 위해 활성 사용자 정보는 익명으로 처리되고 있어요',
      errorTitle: '데이터를 불러올 수 없습니다',
      errorDescription: '잠시 후 다시 시도해주세요.',
      popularPagesTitle: '실시간 인기 페이지',
      rankColumn: '순위',
      pageTitleColumn: '페이지 제목',
      viewCountColumn: '조회수',
      thresholdNotice: '조회수가 {threshold} 이상인 상위 {count}개 페이지만 표시돼요',
    },
  },
  [Locale.EN]: {
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
    RankingDonationPage: {
      summaryTitle: 'Donations go back to creators',
      detailsLabel: 'Details',
      summaryDescription:
        'All donated Libo is used to support creators. Use the Libo you earn to support the creators of manga you love.',
      rankColumn: 'Rank',
      recipientColumn: 'Recipient',
      totalColumn: 'Total Donations',
      searchTitle: 'Go to search',
      artistType: 'Artist',
      groupType: 'Group',
      liboAmount: '{amount} Libo',
      empty: 'No donation data yet',
    },
    RealtimeRanking: {
      activeUsersLabel: 'Currently active users',
      lastUpdated: 'Last updated: {time}',
      privacyNotice: 'Active user information is anonymized to protect privacy',
      errorTitle: 'Could not load data',
      errorDescription: 'Please try again later.',
      popularPagesTitle: 'Realtime Popular Pages',
      rankColumn: 'Rank',
      pageTitleColumn: 'Page Title',
      viewCountColumn: 'Views',
      thresholdNotice: 'Only the top {count} pages with at least {threshold} views are shown',
    },
  },
} satisfies LocalizedMessages
