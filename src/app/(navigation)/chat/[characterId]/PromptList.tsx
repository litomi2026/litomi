'use client'

import Link from 'next/link'
import { useState } from 'react'

import { CHARACTERS } from '../character/characters'

type Props = {
  characterId: string
}

export default function PromptList({ characterId }: Props) {
  const character = CHARACTERS.find((c) => c.id === characterId)
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim().toLowerCase()

  const prompts =
    !character || !normalizedQuery
      ? (character?.prompts ?? [])
      : character.prompts.filter((prompt) => {
          const haystack = [prompt.title, prompt.id].join(' ').toLowerCase()
          return haystack.includes(normalizedQuery)
        })

  if (!character) {
    return (
      <div className="flex flex-col gap-4 p-6 max-w-xl w-full mx-auto">
        <h1 className="text-lg font-semibold">캐릭터를 찾지 못했어요</h1>
        <p className="text-sm text-zinc-400">선택한 캐릭터가 목록에 없어요. 다시 골라 주세요.</p>
        <Link className="text-sm text-zinc-300 underline hover:text-white transition" href="/chat">
          캐릭터 목록으로
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-4xl w-full mx-auto">
      <header className="flex flex-col gap-2">
        <Link className="text-xs text-zinc-400 underline hover:text-zinc-200 transition w-fit" href="/chat">
          캐릭터 목록으로
        </Link>
        <h1 className="text-lg font-semibold">{character.name}</h1>
        <p className="text-sm text-zinc-400">{character.description}</p>
      </header>

      <div className="flex items-center gap-3">
        <label className="sr-only" htmlFor="prompt-search">
          프롬프트 검색
        </label>
        <input
          className="w-full rounded-xl border border-white/7 bg-white/3 px-3 py-2 text-sm placeholder:text-zinc-500"
          id="prompt-search"
          name="prompt-search"
          onChange={(e) => setQuery(e.target.value)}
          placeholder="프롬프트 제목이나 설명으로 검색해요"
          type="search"
          value={query}
        />
        <span className="text-xs text-zinc-500 whitespace-nowrap">{prompts.length}개</span>
      </div>

      {prompts.length === 0 ? (
        <div className="rounded-2xl border border-white/7 bg-white/3 p-4 text-sm text-zinc-400">
          조건에 맞는 프롬프트가 없어요
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {prompts.map((prompt) => (
            <Link
              className="rounded-2xl border border-white/7 bg-white/3 p-4 transition hover:border-white/15"
              href={`/chat/${character.id}/${prompt.id}/${crypto.randomUUID()}`}
              key={prompt.id}
              prefetch={false}
            >
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-zinc-100">{prompt.title}</p>
                {prompt.description ? <p className="text-xs text-zinc-500">{prompt.description}</p> : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
