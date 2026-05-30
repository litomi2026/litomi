import { APP_METADATA } from '@litomi/domain/app/metadata'

import type { LocalizedMessages } from '@/i18n/messages'

export const messages = {
  ko: {
    Metadata: {
      app: {
        description: APP_METADATA.ko.description,
      },
      newYear: {
        title: '새해 카운트다운',
        description: '카운트다운과 불꽃놀이로 새해를 축하하세요.',
      },
    },
  },
  en: {
    Metadata: {
      app: {
        description: APP_METADATA.en.description,
      },
      newYear: {
        title: 'New Year Countdown',
        description: 'Celebrate the new year with a countdown and fireworks.',
      },
    },
  },
} satisfies LocalizedMessages
