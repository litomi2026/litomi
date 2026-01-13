'use client'

import type { CharacterDefinition } from '../types/characterDefinition'

type Props = {
  characterKey: string
  characters: readonly CharacterDefinition[]
  isLocked: boolean
  selectedCharacter: CharacterDefinition
  onChangeCharacterKey: (key: string) => void
}

export function CharacterPanel({ characterKey, characters, isLocked, selectedCharacter, onChangeCharacterKey }: Props) {
  return (
    <section className="rounded-2xl border border-white/7 bg-white/3 p-4 flex flex-col gap-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <label className="text-sm font-medium" htmlFor="character">
        캐릭터
      </label>
      <select
        aria-disabled={isLocked}
        className="bg-white/2 border border-white/7 rounded-xl px-3 py-2 text-sm aria-disabled:opacity-50 aria-disabled:cursor-not-allowed"
        disabled={isLocked}
        id="character"
        name="character"
        onChange={(e) => onChangeCharacterKey(e.target.value)}
        value={characterKey}
      >
        {characters.map((c) => (
          <option key={c.key} value={c.key}>
            {c.name}
          </option>
        ))}
      </select>
      <p className="text-xs text-zinc-500">{selectedCharacter.description}</p>
    </section>
  )
}
