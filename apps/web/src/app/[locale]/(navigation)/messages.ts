import { Locale } from '@litomi/domain/locale'

import type { LocalizedMessages } from '@/i18n/messages'

export const messages = {
  [Locale.KO]: {
    Metadata: {
      navigation: {
        app: {
          title: '앱으로 사용하기',
          description: '리토미 앱 설치 방법을 환경별로 안내해요.',
        },
        chat: {
          title: 'AI 채팅',
          description: '내 기기에서 AI 모델을 내려받아 캐릭터와 대화해요.',
        },
      },
      search: {
        title: '검색',
        queryTitle: '{query} 검색',
        description: '리토미에서 언어, 종류, 작가, 시리즈, 캐릭터, 태그 조건으로 만화와 동인지를 검색하세요.',
        queryDescription: '{query} 조건에 맞는 만화와 동인지를 리토미에서 찾아보세요.',
        landingQueryLabels: {
          'language:korean': '한국어 작품',
          'type:doujinshi': '동인지',
          'type:manga': '망가',
        },
      },
    },
    Navigation: {
      sidebar: {
        home: '홈',
        search: '검색',
        ranking: '인기',
        library: '서재',
        bookmark: '북마크',
        posts: '이야기',
        tag: '태그',
        notification: '알림',
        libo: '리보',
        chat: 'AI 채팅',
        fortune: '운세',
      },
      mobileMenu: {
        open: '메뉴 열기',
        close: '메뉴 닫기',
        menu: '메뉴',
        menuLabel: '모바일 메뉴',
        navLabel: '모바일 보조 메뉴',
        ranking: '인기',
        bookmark: '북마크',
        posts: '이야기',
        tag: '태그',
        chat: 'AI 채팅',
        libo: '리보',
        history: '감상 기록',
        rating: '평가',
        fortune: '운세',
        settings: '설정',
      },
    },
  },
  [Locale.EN]: {
    Metadata: {
      navigation: {
        app: {
          title: 'Use as an App',
          description: 'Learn how to install the Litomi app for each environment.',
        },
        chat: {
          title: 'AI Chat',
          description: 'Download an AI model on your device and chat with characters.',
        },
      },
      search: {
        title: 'Search',
        queryTitle: '{query} Search',
        description: 'Search Litomi by language, type, artist, series, character, and tag.',
        queryDescription: 'Find manga and doujinshi matching {query} on Litomi.',
        landingQueryLabels: {
          'language:korean': 'Korean works',
          'type:doujinshi': 'Doujinshi',
          'type:manga': 'Manga',
        },
      },
    },
    Navigation: {
      sidebar: {
        home: 'Home',
        search: 'Search',
        ranking: 'Popular',
        library: 'Library',
        bookmark: 'Bookmarks',
        posts: 'Posts',
        tag: 'Tags',
        notification: 'Notifications',
        libo: 'Libo',
        chat: 'AI Chat',
        fortune: 'Fortune',
      },
      mobileMenu: {
        open: 'Open menu',
        close: 'Close menu',
        menu: 'Menu',
        menuLabel: 'Mobile menu',
        navLabel: 'Mobile secondary menu',
        ranking: 'Popular',
        bookmark: 'Bookmarks',
        posts: 'Posts',
        tag: 'Tags',
        chat: 'AI Chat',
        libo: 'Libo',
        history: 'Reading history',
        rating: 'Ratings',
        fortune: 'Fortune',
        settings: 'Settings',
      },
    },
  },
} satisfies LocalizedMessages
