'use client'

import Link from 'next/link'
import { useState } from 'react'

import { CHARACTERS } from './character/characters'

export default function CharacterList() {
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim().toLowerCase()

  const characters = normalizedQuery
    ? CHARACTERS.filter(({ id, name }) => {
        const haystack = [name, id].join(' ').toLowerCase()
        return haystack.includes(normalizedQuery)
      })
    : CHARACTERS

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-4xl w-full mx-auto">
      <header className="flex flex-col gap-2">
        <h1 className="text-lg font-semibold">캐릭터 선택</h1>
        <p className="text-sm text-zinc-400">대화할 캐릭터와 성격을 골라 주세요</p>
      </header>

      <div className="flex items-center gap-3">
        <label className="sr-only" htmlFor="character-search">
          캐릭터 검색
        </label>
        <input
          className="w-full rounded-xl border border-white/7 bg-white/3 px-3 py-2 text-sm placeholder:text-zinc-500"
          id="character-search"
          name="character-search"
          onChange={(e) => setQuery(e.target.value)}
          placeholder="캐릭터 이름이나 설명으로 검색해요"
          type="search"
          value={query}
        />
        <span className="text-xs text-zinc-500 whitespace-nowrap">{characters.length}명</span>
      </div>

      {characters.length === 0 ? (
        <div className="rounded-2xl border border-white/7 bg-white/3 p-4 text-sm text-zinc-400">
          조건에 맞는 캐릭터가 없어요
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {characters.map((character) => (
            <Link
              className="rounded-2xl border border-white/7 bg-white/3 p-4 transition hover:border-white/15"
              href={`/chat/${character.id}`}
              key={character.id}
              prefetch={false}
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-zinc-100">{character.name}</p>
                  <span className="text-xs text-zinc-500 whitespace-nowrap">{`성격 ${character.prompts.length}개`}</span>
                </div>
                <p className="text-xs text-zinc-500">{character.description}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
