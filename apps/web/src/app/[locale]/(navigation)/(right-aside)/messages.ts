import { Locale } from '@litomi/domain/locale'

import type { LocalizedMessages } from '@/i18n/messages'

export const messages = {
  [Locale.KO]: {
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
    Profile: {
      navigation: {
        myLitomi: '내 리토미',
        logout: '로그아웃',
        stories: '이야기',
        censor: '검열',
        donations: '후원',
        settings: '설정',
      },
      fallback: {
        missingUser: '존재하지 않는 사용자',
        guest: '비회원',
        loginPrompt: '로그인하면 모든 기능을 이용할 수 있어요',
        missingDescription: '존재하지 않는 사용자예요',
      },
      summary: {
        joinedAt: '가입일: {date}',
        following: '팔로우 중',
        followers: '팔로워',
      },
      posts: {
        createPlaceholder: '첫 글을 작성해보세요!',
        emptyTitle: '아직 작성한 글이 없어요',
        emptyDescription: '생각을 공유하고 다른 사용자들과 소통해보세요',
      },
      notFound: {
        title: '사용자를 찾을 수 없어요',
        description: '주소가 바뀌었거나 공개된 프로필을 찾을 수 없어요',
        action: '이야기 목록으로 가기',
      },
      edit: {
        action: '프로필 수정',
        imageAlt: '프로필 이미지',
        loginId: '아이디',
        immutable: '변경할 수 없어요',
        name: '이름',
        namePlaceholder: '고유한 이름을 입력하세요',
        nameHelp: '이름으로 찾을 수 있어요 (2-32자)',
        nickname: '닉네임',
        nicknamePlaceholder: '사용할 닉네임을 입력하세요',
        nicknameHelp: '다른 사용자에게 표시되는 별명이에요 (2-32자)',
        imageURL: '프로필 이미지 URL',
        imageURLHelp: '이미지는 정사각형 비율을 권장해요',
        propagationNotice:
          '클라우드 비용 절감을 위해 서버 트래픽을 제한하고 있어 변경 사항이 반영되는데 최대 1분이 소요될 수 있어요',
        reset: '초기화',
        save: '저장',
      },
    },
  },
  [Locale.EN]: {
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
    Profile: {
      navigation: {
        myLitomi: 'My Litomi',
        logout: 'Log out',
        stories: 'Stories',
        censor: 'Censor',
        donations: 'Donations',
        settings: 'Settings',
      },
      fallback: {
        missingUser: 'User not found',
        guest: 'Guest',
        loginPrompt: 'Log in to use every feature',
        missingDescription: 'This user does not exist',
      },
      summary: {
        joinedAt: 'Joined {date}',
        following: 'Following',
        followers: 'Followers',
      },
      posts: {
        createPlaceholder: 'Write your first post',
        emptyTitle: 'No posts yet',
        emptyDescription: 'Share your thoughts and connect with other users',
      },
      notFound: {
        title: 'User not found',
        description: 'The address may have changed, or this public profile could not be found',
        action: 'Go to stories',
      },
      edit: {
        action: 'Edit profile',
        imageAlt: 'Profile image',
        loginId: 'Login ID',
        immutable: 'Cannot be changed',
        name: 'Name',
        namePlaceholder: 'Enter a unique name',
        nameHelp: 'People can find you by this name (2-32 characters)',
        nickname: 'Nickname',
        nicknamePlaceholder: 'Enter a nickname',
        nicknameHelp: 'Shown to other users (2-32 characters)',
        imageURL: 'Profile image URL',
        imageURLHelp: 'A square image is recommended',
        propagationNotice:
          'To reduce cloud costs, server traffic is rate-limited. Changes can take up to 1 minute to appear.',
        reset: 'Reset',
        save: 'Save',
      },
    },
  },
} satisfies LocalizedMessages
