'use client'

import Link from 'next/link'

import { CensorshipLevel } from '@/database/enum'
import useMatchedCensorships from '@/hook/useCensorshipCheck'
import useCensorshipsMapQuery from '@/query/useCensorshipsMapQuery'
import useMeQuery from '@/query/useMeQuery'
import { Manga } from '@/types/manga'

type Props = {
  manga: Manga
  level: CensorshipLevel
}

export default function MangaCardCensorship({ manga, level }: Readonly<Props>) {
  const { data: me } = useMeQuery()
  const loginId = me?.loginId ?? ''
  const { data: censorshipsMap } = useCensorshipsMapQuery()
  const { censoringReasons, highestCensorshipLevel } = useMatchedCensorships({ manga, censorshipsMap })

  if (level !== highestCensorshipLevel) {
    return null
  }

  if (!censoringReasons || censoringReasons.length === 0) {
    return null
  }

  if (highestCensorshipLevel === CensorshipLevel.HEAVY) {
    return (
      <div className="absolute inset-0 animate-fade-in-fast bg-zinc-900 flex items-center justify-center p-4 text-zinc-400 text-center">
        <div>
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-800 flex items-center justify-center">
            <span className="text-xl">🚫</span>
          </div>
          <div className="font-semibold mb-1">검열된 콘텐츠</div>
          <span>{censoringReasons.join(', ')}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 animate-fade-in-fast bg-background/80 backdrop-blur flex items-center justify-center text-center p-4 pointer-events-none">
      <Link
        className="text-foreground text-center font-semibold flex flex-wrap gap-1 justify-center pointer-events-auto hover:underline"
        href={`/@${loginId}/censor`}
      >
        {censoringReasons.join(', ')} 작품 검열
      </Link>
    </div>
  )
}
