import type { LocalizedMessages } from '@/i18n/messages'

export const messages = {
  ko: {
    Metadata: {
      community: {
        posts: {
          title: '이야기',
          description: '리토미 사용자들이 남긴 이야기와 추천 글을 확인하세요.',
        },
        notification: {
          title: '알림',
          description: '새 작품과 서비스 알림을 확인하세요.',
        },
        post: {
          deletedTitle: '삭제된 글이에요',
        },
        profile: {
          indexTitle: '이야기',
          title: '{nickname} (@{name}) 이야기',
          missingTitle: '존재하지 않는 사용자',
          description: '팔로우 중 {followingCount}명 · 팔로워 {followerCount}명',
          missingDescription: '@{username} 사용자를 찾을 수 없어요.',
        },
        settings: {
          title: '설정',
          description: '계정, 보안, 알림, 언어, 테마 설정을 관리하세요.',
        },
        censor: {
          title: '검열',
          description: '콘텐츠 표시와 차단 관련 설정을 관리하세요.',
        },
      },
    },
  },
  en: {
    Metadata: {
      community: {
        posts: {
          title: 'Stories',
          description: 'Read stories and recommendations from Litomi users.',
        },
        notification: {
          title: 'Notifications',
          description: 'Check new manga and service notifications.',
        },
        post: {
          deletedTitle: 'This post was deleted',
        },
        profile: {
          indexTitle: 'Stories',
          title: "{nickname} (@{name})'s Stories",
          missingTitle: 'User not found',
          description: 'Following {followingCount} · {followerCount} followers',
          missingDescription: 'Could not find @{username}.',
        },
        settings: {
          title: 'Settings',
          description: 'Manage your account, security, notifications, language, and theme settings.',
        },
        censor: {
          title: 'Censor',
          description: 'Manage content visibility and blocking settings.',
        },
      },
    },
  },
} satisfies LocalizedMessages
