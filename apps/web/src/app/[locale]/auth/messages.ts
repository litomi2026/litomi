import type { LocalizedMessages } from '@/i18n/messages'

export const messages = {
  ko: {
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
  en: {
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
