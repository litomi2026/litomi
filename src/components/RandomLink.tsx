'use client'

import { Dices } from 'lucide-react'
import Link from 'next/link'
import { ComponentProps, memo, useEffect } from 'react'

import { useShffleStore } from '@/store/shuffle'

import LinkPending from './LinkPending'

export default memo(RandomLink)

function RandomLink({ className = '', href }: ComponentProps<'a'>) {
  const { cooldown, startTimer } = useShffleStore()

  useEffect(() => {
    startTimer()
  }, [startTimer])

  return (
    <Link
      aria-disabled={cooldown > 0}
      className={`flex gap-1 items-center border-2 px-3 p-2 rounded-xl transition hover:bg-zinc-900 active:bg-zinc-950 aria-disabled:text-zinc-500 aria-disabled:bg-zinc-900 aria-disabled:pointer-events-none ${className}`}
      href={href ?? ''}
      onClick={() => startTimer(20)}
    >
      <LinkPending className="size-5">
        <Dices className="size-5" />
      </LinkPending>
      <span className="min-w-9 text-center shrink-0">{cooldown > 0 ? `${cooldown}초` : '랜덤'}</span>
    </Link>
  )
}
