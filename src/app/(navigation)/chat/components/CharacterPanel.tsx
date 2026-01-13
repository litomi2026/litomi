'use client'

import type { CharacterDefinition } from '../domain/characters'

type Props = {
  characterKey: string
  characters: readonly CharacterDefinition[]
  isLocked: boolean
  selectedCharacter: CharacterDefinition | undefined
  onChangeCharacterKey: (key: string) => void
}

export function CharacterPanel({ characterKey, characters, isLocked, selectedCharacter, onChangeCharacterKey }: Props) {
  return (
    <section className="rounded-2xl border border-zinc-800/60 p-4 flex flex-col gap-3">
      <label className="text-sm font-medium" htmlFor="character">
        캐릭터
      </label>
      <select
        aria-disabled={isLocked}
        className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm aria-disabled:opacity-50 aria-disabled:cursor-not-allowed"
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
      <p className="text-xs text-zinc-500">{selectedCharacter?.description}</p>
    </section>
  )
}
