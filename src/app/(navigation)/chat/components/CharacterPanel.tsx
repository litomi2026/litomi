'use client'

import { useId } from 'react'

import CustomSelect from '@/components/ui/CustomSelect'

import type { CharacterDefinition } from '../types/characterDefinition'

type Props = {
  characterId: string
  characters: readonly CharacterDefinition[]
  disabled: boolean
  onChangeCharacterId: (id: string) => void
}

export function CharacterPanel({ characterId, characters, disabled, onChangeCharacterId }: Props) {
  const selectedCharacter = characters.find((c) => c.id === characterId)
  const id = useId()

  return (
    <section className="rounded-2xl border border-white/7 bg-white/3 p-4 flex flex-col gap-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <label className="text-sm font-medium" htmlFor={id}>
        캐릭터
      </label>
      <CustomSelect
        buttonClassName="text-sm"
        disabled={disabled}
        id={id}
        name="character"
        onChange={(value) => onChangeCharacterId(value)}
        options={characters.map((c) => ({
          value: c.id,
          label: c.name,
        }))}
        value={characterId}
      />
      <p className="text-xs text-zinc-500">{selectedCharacter?.description ?? '.'}</p>
    </section>
  )
}
