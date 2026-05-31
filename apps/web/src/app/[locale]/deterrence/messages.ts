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
  [Locale.JA]: {
    Metadata: {
      deterrence: {
        title: '19歳未満の利用制限に関するお知らせ',
        description: '未成年者と保護者向けに、利用制限と保護機能の設定方法を案内します。',
      },
    },
  },
  [Locale.ZH_CN]: {
    Metadata: {
      deterrence: {
        title: '未满 19 岁访问限制说明',
        description: '面向未成年人和监护人，说明访问限制与保护功能设置。',
      },
    },
  },
} satisfies LocalizedMessages
