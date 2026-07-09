import { Locale } from '@litomi/domain/locale'

import type { LocalizedMessages } from '@/i18n/messages'

export const messages = {
  [Locale.KO]: {
    Metadata: {
      community: {
        settings: {
          title: '설정',
          description: '계정, 보안, 알림, 언어, 테마 설정을 관리하세요.',
        },
      },
    },
    Settings: {
      sections: {
        uiLanguage: {
          title: '화면 언어',
          description: '앱 화면에서 사용할 언어를 선택하세요',
        },
        searchLanguage: {
          title: '검색 언어',
          description: '새 검색어에 기본으로 추가할 작품 언어를 선택하세요',
        },
        theme: {
          title: '테마',
          description: '원하는 색상 테마를 선택하세요',
        },
      },
      searchLanguage: {
        allLanguages: '모든 언어',
        allSelectedHelp: '새 검색은 언어 조건 없이 시작돼요',
        selectedHelp: '새 검색에 언어 조건이 없으면 검색어에 이 언어가 추가돼요',
        save: '저장',
        savedToast: '검색 언어 설정이 반영됐어요',
      },
      theme: {
        options: {
          system: {
            label: '자동',
            description: '기기 설정에 맞춰 자동으로 전환돼요',
          },
          light: {
            label: '라이트',
            description: '밝고 깔끔한 화이트 테마',
          },
          dark: {
            label: '다크',
            description: '눈이 편안한 다크 테마',
          },
          neon: {
            label: '네온',
            description: '생동감 넘치는 사이버펑크 테마',
          },
          retro: {
            label: '레트로',
            description: '따뜻한 빈티지 감성 테마',
          },
        },
      },
    },
  },
  [Locale.EN]: {
    Metadata: {
      community: {
        settings: {
          title: 'Settings and privacy',
          description: 'Manage your account, privacy, security, notifications, language, and theme settings.',
        },
      },
    },
    Settings: {
      sections: {
        uiLanguage: {
          title: 'Display language',
          description: 'Choose the language used in the app UI.',
        },
        searchLanguage: {
          title: 'Search language',
          description: 'Choose the default work language to add to new searches.',
        },
        theme: {
          title: 'Theme',
          description: 'Choose your preferred color theme.',
        },
      },
      searchLanguage: {
        allLanguages: 'All languages',
        allSelectedHelp: 'New searches start without a language condition.',
        selectedHelp: 'If a new search has no language condition, this language is added to the query.',
        save: 'Save',
        savedToast: 'Search language settings updated.',
      },
      theme: {
        options: {
          system: {
            label: 'System',
            description: 'Follows your device settings',
          },
          light: {
            label: 'Light',
            description: 'Bright, clean white theme',
          },
          dark: {
            label: 'Dark',
            description: 'Easy-on-the-eyes dark theme',
          },
          neon: {
            label: 'Neon',
            description: 'Vivid cyberpunk theme',
          },
          retro: {
            label: 'Retro',
            description: 'Warm vintage-inspired theme',
          },
        },
      },
    },
  },
  [Locale.JA]: {
    Metadata: {
      community: {
        settings: {
          title: '設定',
          description: 'アカウント、セキュリティ、通知、言語、テーマ設定を管理します。',
        },
      },
    },
    Settings: {
      sections: {
        uiLanguage: {
          title: '画面言語',
          description: 'アプリ画面で使用する言語を選択します',
        },
        searchLanguage: {
          title: '検索言語',
          description: '新しい検索語に既定で追加する作品言語を選択します',
        },
        theme: {
          title: 'テーマ',
          description: '好みのカラーテーマを選択します',
        },
      },
      searchLanguage: {
        allLanguages: 'すべての言語',
        allSelectedHelp: '新しい検索は言語条件なしで始まります',
        selectedHelp: '新しい検索に言語条件がない場合、この言語が検索語に追加されます',
        save: '保存',
        savedToast: '検索言語設定を反映しました',
      },
      theme: {
        options: {
          system: {
            label: 'システム',
            description: 'デバイスの設定に合わせて切り替わります',
          },
          light: {
            label: 'ライト',
            description: '明るくすっきりしたホワイトテーマ',
          },
          dark: {
            label: 'ダーク',
            description: '目にやさしいダークテーマ',
          },
          neon: {
            label: 'ネオン',
            description: '躍動感のあるサイバーパンクテーマ',
          },
          retro: {
            label: 'レトロ',
            description: '温かみのあるヴィンテージ風テーマ',
          },
        },
      },
    },
  },
  [Locale.ZH_CN]: {
    Metadata: {
      community: {
        settings: {
          title: '设置',
          description: '管理账号、安全、通知、语言和主题设置。',
        },
      },
    },
    Settings: {
      sections: {
        uiLanguage: {
          title: '界面语言',
          description: '选择应用界面使用的语言。',
        },
        searchLanguage: {
          title: '搜索语言',
          description: '选择新搜索默认添加的作品语言。',
        },
        theme: {
          title: '主题',
          description: '选择你喜欢的颜色主题。',
        },
      },
      searchLanguage: {
        allLanguages: '所有语言',
        allSelectedHelp: '新的搜索会在没有语言条件的情况下开始',
        selectedHelp: '如果新搜索没有语言条件，该语言会添加到搜索词中',
        save: '保存',
        savedToast: '搜索语言设置已更新',
      },
      theme: {
        options: {
          system: {
            label: '跟随系统',
            description: '跟随设备的浅色或深色设置',
          },
          light: {
            label: '浅色',
            description: '明亮简洁的白色主题',
          },
          dark: {
            label: '深色',
            description: '护眼的深色主题',
          },
          neon: {
            label: '霓虹',
            description: '充满活力的赛博朋克主题',
          },
          retro: {
            label: '复古',
            description: '温暖的复古风主题',
          },
        },
      },
    },
  },
} satisfies LocalizedMessages
