'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'

import { CHARACTERS } from '../../../character/characters'

const AIChat = dynamic(() => import('./AIChat'), { ssr: false })

type Props = {
  characterId: string
  promptId: string
  threadId: string
}

export default function ChatThread({ characterId, promptId, threadId }: Props) {
  const character = CHARACTERS.find((c) => c.id === characterId)
  const prompt = character?.prompts.find((p) => p.id === promptId)

  if (!character) {
    return (
      <div className="flex flex-col gap-4 p-6 max-w-xl w-full mx-auto">
        <h1 className="text-lg font-semibold">캐릭터를 찾지 못했어요</h1>
        <p className="text-sm text-zinc-400">선택한 캐릭터가 목록에 없어요. 다시 골라 주세요.</p>
        <Link className="text-sm text-zinc-300 underline hover:text-white transition" href="/chat" prefetch={false}>
          캐릭터 목록으로
        </Link>
      </div>
    )
  }

  if (!prompt) {
    return (
      <div className="flex flex-col gap-4 p-6 max-w-xl w-full mx-auto">
        <h1 className="text-lg font-semibold">성격을 찾지 못했어요</h1>
        <p className="text-sm text-zinc-400">선택한 성격이 목록에 없어요. 다시 골라 주세요.</p>
        <Link
          className="text-sm text-zinc-300 underline hover:text-white transition"
          href={`/chat/${character.id}`}
          prefetch={false}
        >
          성격 목록으로
        </Link>
      </div>
    )
  }

  return <AIChat character={character} prompt={prompt} threadId={threadId} />
}
