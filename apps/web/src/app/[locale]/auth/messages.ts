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
    Auth: {
      loginButton: {
        action: '로그인',
        passkey: '패스키로 로그인',
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
    Auth: {
      loginButton: {
        action: 'Log in',
        passkey: 'Log in with passkey',
      },
    },
  },
} satisfies LocalizedMessages
