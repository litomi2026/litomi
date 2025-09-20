'use client'

import { Dices } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { memo, useEffect } from 'react'

import { useShffleStore } from '@/store/shuffle'

import LinkPending from './LinkPending'

const className = 'flex gap-1 items-center border-2 px-3 p-2 rounded-xl transition hover:bg-zinc-900 active:bg-zinc-950'

type Props = {
  href?: string
}

export default memo(RandomLink)

function RandomLink({ href }: Props) {
  const { cooldown, startTimer } = useShffleStore()
  const router = useRouter()

  function handleClick() {
    router.refresh()
    startTimer(20)
  }

  useEffect(() => {
    if (!href) {
      startTimer()
    }
  }, [startTimer, href])

  if (href) {
    return (
      <Link className={className} href={href}>
        <Dices className="size-5" /> 랜덤
      </Link>
    )
  }

  return (
    <button
      aria-disabled={cooldown > 0}
      className={`aria-disabled:text-zinc-500 aria-disabled:bg-zinc-900 aria-disabled:pointer-events-none ${className}`}
      onClick={handleClick}
      title={cooldown > 0 ? `잠시 후에 시도해주세요` : '새로고침'}
    >
      <LinkPending className="size-5">
        <Dices className="size-5" />
      </LinkPending>
      <span className="min-w-9 text-center shrink-0">{cooldown > 0 ? `${cooldown}초` : '랜덤'}</span>
    </button>
  )
}
