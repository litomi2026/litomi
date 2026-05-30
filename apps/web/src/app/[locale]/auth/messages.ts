import { Locale } from '@litomi/domain/locale'

import type { LocalizedMessages } from '@/i18n/messages'

export const messages = {
  [Locale.KO]: {
    Metadata: {
      auth: {
        login: {
          title: '로그인',
          description: '리토미 계정으로 로그인하세요.',
        },
        signup: {
          title: '회원가입',
          description: '리토미 계정을 만들고 작품과 서재를 관리하세요.',
        },
      },
    },
  },
  [Locale.EN]: {
    Metadata: {
      auth: {
        login: {
          title: 'Log in',
          description: 'Log in to your Litomi account.',
        },
        signup: {
          title: 'Sign up',
          description: 'Create a Litomi account to manage manga and libraries.',
        },
      },
    },
  },
} satisfies LocalizedMessages
