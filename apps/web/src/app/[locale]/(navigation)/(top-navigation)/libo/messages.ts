import { Locale } from '@litomi/domain/locale'

import type { LocalizedMessages } from '@/i18n/messages'

export const messages = {
  [Locale.KO]: {
    Metadata: {
      libo: {
        index: {
          title: '리보',
          description: '리보를 모으고 사용하는 기능을 확인하세요.',
        },
        history: {
          title: '리보 내역',
          description: '리보 적립과 사용 내역을 확인하세요.',
        },
        roulette: {
          title: '룰렛',
          description: '리보 룰렛을 돌려 보상을 확인하세요.',
        },
        shop: {
          title: '리보 상점',
          description: '리보로 이용할 수 있는 항목을 확인하세요.',
        },
        stats: {
          title: '광고 수익 통계',
          description: '광고 수익과 리보 관련 통계를 확인하세요.',
        },
      },
    },
  },
  [Locale.EN]: {
    Metadata: {
      libo: {
        index: {
          title: 'Libo',
          description: 'View features for earning and using Libo.',
        },
        history: {
          title: 'Libo History',
          description: 'Check your Libo earnings and spending history.',
        },
        roulette: {
          title: 'Roulette',
          description: 'Spin the Libo roulette and check your rewards.',
        },
        shop: {
          title: 'Libo Shop',
          description: 'Browse items available with Libo.',
        },
        stats: {
          title: 'Ad Revenue Stats',
          description: 'Check ad revenue and Libo-related statistics.',
        },
      },
    },
  },
} satisfies LocalizedMessages
