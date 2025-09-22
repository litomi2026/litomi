'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import IconEye from '@/components/icons/IconEye'
import IconEyeOff from '@/components/icons/IconEyeOff'
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
  const [isBlurDisabled, setIsBlurDisabled] = useState(false)

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
    <div
      aria-current={!isBlurDisabled}
      className="absolute inset-0 animate-fade-in-fast flex items-center justify-center text-center p-4 pointer-events-none transition aria-current:bg-background/80 aria-current:backdrop-blur"
    >
      <button
        className="absolute top-2 right-2 p-2.5 rounded-full bg-background/90 hover:bg-background border border-zinc-700 pointer-events-auto transition"
        onClick={() => setIsBlurDisabled(!isBlurDisabled)}
        title={isBlurDisabled ? '검열 적용' : '검열 임시 해제'}
        type="button"
      >
        {isBlurDisabled ? <IconEye className="size-5" /> : <IconEyeOff className="size-5" />}
      </button>
      <Link
        aria-hidden={isBlurDisabled}
        className="text-foreground text-center font-semibold flex flex-wrap gap-1 justify-center pointer-events-auto transition hover:underline aria-hidden:opacity-0 aria-hidden:pointer-events-none"
        href={`/@${myName}/censor`}
      >
        {censoringReasons.join(', ')} 작품 검열
      </Link>
    </div>
  )
}
