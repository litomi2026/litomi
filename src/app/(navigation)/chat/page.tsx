import { Metadata } from 'next'

import { generateOpenGraphMetadata } from '@/constants'

import CharacterList from './CharacterList'

export const metadata: Metadata = {
  title: '캐릭터 AI 채팅',
  description: '내 기기에서 AI 모델을 내려받아 캐릭터와 대화해요',
  ...generateOpenGraphMetadata({
    title: '캐릭터 AI 채팅',
    description: '내 기기에서 AI 모델을 내려받아 캐릭터와 대화해요',
    url: '/chat',
  }),
  alternates: {
    canonical: '/chat',
    languages: { ko: '/chat' },
  },
}

export default function Page() {
  return <CharacterList />
}
