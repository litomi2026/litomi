import { Locale } from '@litomi/domain/locale'

import type { LocalizedMessages } from '@/i18n/messages'

export const messages = {
  [Locale.KO]: {
    Metadata: {
      deterrence: {
        title: '19세 미만 이용 제한 안내',
        description: '청소년 및 보호자를 위한 이용 제한 안내와 보호 기능 설정 방법을 안내합니다.',
      },
    },
  },
  [Locale.EN]: {
    Metadata: {
      deterrence: {
        title: 'Under-19 Access Restriction Notice',
        description: 'Guidance for minors and guardians about access restrictions and protection settings.',
      },
    },
  },
} satisfies LocalizedMessages
