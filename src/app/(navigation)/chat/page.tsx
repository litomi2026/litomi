import { generateOpenGraphMetadata } from '@/constants'

import CharacterChatPageClient from './page-client'

export async function generateMetadata() {
  return {
    ...generateOpenGraphMetadata({
      title: '캐릭터 AI 채팅',
      description: '내 기기에서 AI 모델을 내려받아 캐릭터와 채팅해요',
      url: '/chat',
    }),
    alternates: {
      canonical: '/chat',
      languages: { ko: '/chat' },
    },
  }
}

export default function Page() {
  return <CharacterChatPageClient />
}
