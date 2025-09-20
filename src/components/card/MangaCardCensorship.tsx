'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'

import { CensorshipLevel } from '@/database/enum'
import useMatchedCensorships from '@/hook/useCensorshipCheck'
import useCensorshipsMapQuery from '@/query/useCensorshipsMapQuery'
import useMeQuery from '@/query/useMeQuery'
import { Manga } from '@/types/manga'

type Props = {
  manga: Manga
}

export default function MangaCardCensorship({ manga }: Readonly<Props>) {
  const { data: me } = useMeQuery()
  const myName = me?.name ?? ''
  const { data: censorshipsMap } = useCensorshipsMapQuery()
  const { censoringReasons, highestCensorshipLevel } = useMatchedCensorships({ manga, censorshipsMap })
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (highestCensorshipLevel === CensorshipLevel.HEAVY) {
      const cardElement = ref.current?.closest<HTMLElement>('[data-manga-card]')
      if (cardElement) {
        cardElement.style.display = 'none'
      }
    }
  }, [highestCensorshipLevel])

  if (!censoringReasons || censoringReasons.length === 0) {
    return null
  }

  if (highestCensorshipLevel === CensorshipLevel.HEAVY) {
    return <div ref={ref} style={{ display: 'none' }} />
  }

  return (
    <div className="absolute inset-0 animate-fade-in-fast bg-background/80 backdrop-blur flex items-center justify-center text-center p-4 pointer-events-none">
      <Link
        className="text-foreground text-center font-semibold flex flex-wrap gap-1 justify-center pointer-events-auto hover:underline"
        href={`/@${myName}/censor`}
      >
        {censoringReasons.join(', ')} 작품 검열
      </Link>
    </div>
  )
}
