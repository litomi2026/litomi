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
  [Locale.JA]: {
    Metadata: {
      libo: {
        index: {
          title: 'Libo',
          description: 'Libo を貯めたり使ったりする機能を確認しましょう。',
        },
        history: {
          title: 'Libo 履歴',
          description: 'Libo の獲得と使用履歴を確認しましょう。',
        },
        roulette: {
          title: 'ルーレット',
          description: 'Libo ルーレットを回して報酬を確認しましょう。',
        },
        shop: {
          title: 'Libo ショップ',
          description: 'Libo で利用できる項目を確認しましょう。',
        },
        stats: {
          title: '広告収益統計',
          description: '広告収益と Libo 関連の統計を確認しましょう。',
        },
      },
    },
  },
  [Locale.ZH_CN]: {
    Metadata: {
      libo: {
        index: {
          title: 'Libo',
          description: '查看获取和使用 Libo 的相关功能。',
        },
        history: {
          title: 'Libo 明细',
          description: '查看 Libo 的获得和使用记录。',
        },
        roulette: {
          title: '转盘',
          description: '转动 Libo 转盘并查看奖励。',
        },
        shop: {
          title: 'Libo 商店',
          description: '浏览可使用 Libo 兑换的项目。',
        },
        stats: {
          title: '广告收益统计',
          description: '查看广告收益和 Libo 相关统计。',
        },
      },
    },
  },
} satisfies LocalizedMessages
