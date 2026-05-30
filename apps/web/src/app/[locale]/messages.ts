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
  },
} satisfies LocalizedMessages
