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
    TopNavigation: {
      actions: {
        label: '빠른 이동',
        menu: '메뉴 열기',
        recommend: '추천',
        new: '신작',
        random: '랜덤',
        liveCam: '라이브 섹스 캠',
        randomRefresh: {
          loadingTitle: '로딩 중...',
          cooldownTitle: '잠시 후에 시도해 주세요',
          refreshTitle: '새로고침',
          loading: '로딩',
          seconds: '{seconds}초',
          refresh: '갱신',
        },
      },
      footer: {
        installApp: '앱 설치/다운로드',
        terms: '이용약관',
        privacy: '개인정보처리방침',
        ageRestriction: '사용자 연령 제한 규정',
        notice2257: '2257 고지',
        dmca: '저작권/DMCA',
        youthProtection: '청소년보호정책',
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
    TopNavigation: {
      actions: {
        label: 'Quick navigation',
        menu: 'Open menu',
        recommend: 'Recommended',
        new: 'New',
        random: 'Random',
        liveCam: 'Live sex cam',
        randomRefresh: {
          loadingTitle: 'Loading...',
          cooldownTitle: 'Please try again shortly',
          refreshTitle: 'Refresh',
          loading: 'Loading',
          seconds: '{seconds}s',
          refresh: 'Refresh',
        },
      },
      footer: {
        installApp: 'Install app',
        terms: 'Terms',
        privacy: 'Privacy Policy',
        ageRestriction: 'Age Restriction Rules',
        notice2257: '2257 Notice',
        dmca: 'Copyright/DMCA',
        youthProtection: 'Youth Protection Policy',
      },
    },
  },
} satisfies LocalizedMessages
