'use client'

import { useId } from 'react'

import CustomSelect from '@/components/ui/CustomSelect'

import type { CharacterDefinition } from '../types/characterDefinition'

type Props = {
  characterKey: string
  characters: readonly CharacterDefinition[]
  disabled: boolean
  onChangeCharacterKey: (key: string) => void
}

export function CharacterPanel({ characterKey, characters, disabled, onChangeCharacterKey }: Props) {
  const selectedCharacter = characters.find((c) => c.key === characterKey)!
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
        onChange={(value) => onChangeCharacterKey(value)}
        options={characters.map((c) => ({
          value: c.key,
          label: c.name,
        }))}
        value={characterKey}
      />
      <p className="text-xs text-zinc-500">{selectedCharacter.description}</p>
    </section>
  )
}
