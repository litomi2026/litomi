import { APP_METADATA } from '@litomi/domain/app/metadata'
import { Locale } from '@litomi/domain/locale'

import type { LocalizedMessages } from '@/i18n/messages'

export const messages = {
  [Locale.KO]: {
    Metadata: {
      app: {
        description: APP_METADATA[Locale.KO].description,
      },
      newYear: {
        title: '새해 카운트다운',
        description: '카운트다운과 불꽃놀이로 새해를 축하하세요.',
      },
    },
    NotFound: {
      titleLine1: '찾던 페이지가',
      titleLine2: '서가에서 사라졌어요',
      description:
        '주소가 바뀌었거나 더 이상 제공하지 않는 페이지일 수 있어요. 홈에서 다시 둘러보거나 검색으로 원하는 작품을 찾아보세요.',
      homeAction: '홈으로 가기',
      searchAction: '검색하러 가기',
      emptyDescription: 'NO MATCH IN CATALOG',
      emptyTitle: '비어 있는 결과예요',
    },
  },
  [Locale.EN]: {
    Metadata: {
      app: {
        description: APP_METADATA[Locale.EN].description,
      },
      newYear: {
        title: 'New Year Countdown',
        description: 'Celebrate the new year with a countdown and fireworks.',
      },
    },
    NotFound: {
      titleLine1: 'This page slipped',
      titleLine2: 'off the shelf',
      description:
        'The address may have changed, or the page may no longer be available. Head home or search for the work you wanted.',
      homeAction: 'Go home',
      searchAction: 'Search',
      emptyDescription: 'NO MATCH IN CATALOG',
      emptyTitle: 'Nothing here',
    },
  },
} satisfies LocalizedMessages
