import { Locale } from '@litomi/domain/locale'

import type { LocalizedMessages } from '@/i18n/messages'

export const messages = {
  [Locale.KO]: {
    Metadata: {
      library: {
        index: {
          title: '공개 서재',
          description: '다른 사용자가 공개한 작품 서재를 둘러보세요.',
        },
        detail: {
          title: '서재',
          description: '공개 서재에 담긴 작품을 확인하세요.',
        },
        bookmark: {
          title: '북마크',
          description: '북마크한 작품을 모아보세요.',
        },
        history: {
          title: '감상 기록',
          description: '최근 감상한 작품 기록을 확인하세요.',
        },
        rating: {
          title: '작품 평가',
          description: '평가한 작품을 모아보고 정리하세요.',
        },
      },
    },
  },
  [Locale.EN]: {
    Metadata: {
      library: {
        index: {
          title: 'Public Libraries',
          description: 'Browse manga libraries shared publicly by other users.',
        },
        detail: {
          title: 'Library',
          description: 'View manga saved in a public library.',
        },
        bookmark: {
          title: 'Bookmarks',
          description: 'See the manga you bookmarked.',
        },
        history: {
          title: 'Viewing History',
          description: 'Check the manga you recently viewed.',
        },
        rating: {
          title: 'Manga Ratings',
          description: 'Review and organize manga you rated.',
        },
      },
    },
  },
  [Locale.JA]: {
    Metadata: {
      library: {
        index: {
          title: '公開ライブラリ',
          description: '他のユーザーが公開した作品ライブラリを見てみましょう。',
        },
        detail: {
          title: 'ライブラリ',
          description: '公開ライブラリに保存された作品を確認しましょう。',
        },
        bookmark: {
          title: 'ブックマーク',
          description: 'ブックマークした作品をまとめて見られます。',
        },
        history: {
          title: '閲覧履歴',
          description: '最近閲覧した作品の履歴を確認しましょう。',
        },
        rating: {
          title: '作品評価',
          description: '評価した作品を見直して整理しましょう。',
        },
      },
    },
  },
  [Locale.ZH_CN]: {
    Metadata: {
      library: {
        index: {
          title: '公开书库',
          description: '浏览其他用户公开分享的作品书库。',
        },
        detail: {
          title: '书库',
          description: '查看公开书库中收藏的作品。',
        },
        bookmark: {
          title: '书签',
          description: '集中查看你已加入书签的作品。',
        },
        history: {
          title: '阅读记录',
          description: '查看你最近阅读过的作品记录。',
        },
        rating: {
          title: '作品评分',
          description: '查看并整理你评分过的作品。',
        },
      },
    },
  },
} satisfies LocalizedMessages
