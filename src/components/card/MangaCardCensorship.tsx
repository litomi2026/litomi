import { useMemo } from 'react'

import { CensorshipLevel } from '@/database/enum'
import { Manga } from '@/types/manga'

const BLIND_TAG_VALUE_TO_LABEL: Record<string, string> = {
  bestiality: '수간',
  guro: '고어',
  snuff: '고어',
  yaoi: '게이',
  males_only: '게이',
  scat: '스캇',
  coprophagia: '스캇',
}

const BLIND_TAG_VALUES = Object.keys(BLIND_TAG_VALUE_TO_LABEL)

type Props = {
  manga: Manga
  level: CensorshipLevel
}

export default function MangaCardCensorship({ manga, level }: Readonly<Props>) {
  const { tags } = manga

  const censoredTags = useMemo(
    () =>
      tags?.filter(({ value }) => BLIND_TAG_VALUES.includes(value)).map(({ value }) => BLIND_TAG_VALUE_TO_LABEL[value]),
    [tags],
  )

  if (!censoredTags || censoredTags.length === 0) {
    return null
  }

  if (level === CensorshipLevel.HEAVY) {
    // TODO: 중증 검열 표시
    return null
  }

  return (
    <div className="absolute inset-0 bg-background/50 backdrop-blur flex items-center justify-center text-center p-4 pointer-events-none">
      <div className="text-foreground text-center font-semibold flex flex-wrap gap-1 justify-center">
        <span>{Array.from(new Set(censoredTags)).join(', ')}</span>
        <span>작품 검열</span>
      </div>
    </div>
  )
}
