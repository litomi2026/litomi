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
  },
} satisfies LocalizedMessages
