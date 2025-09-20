'use client'

import { Dices } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { memo } from 'react'

import LinkPending from '@/components/LinkPending'
import { useShffleStore } from '@/store/shuffle'

const className = 'flex gap-1 items-center border-2 px-3 p-2 rounded-xl transition'

export default memo(RandomMangaLink)

function RandomMangaLink() {
  const router = useRouter()
  const pathname = usePathname()
  const isRandomPage = pathname === '/random'
  const { cooldown, startTimer } = useShffleStore()

  function handleClick() {
    router.refresh()
    startTimer(20)
  }

  if (!isRandomPage) {
    return (
      <Link className={`hover:bg-zinc-900 active:bg-zinc-950 ${className}`} href="/random">
        <Dices className="size-5" />
        <span className="min-w-9 text-center">랜덤</span>
      </Link>
    )
  }

  return (
    <button
      aria-disabled={cooldown > 0}
      className={`bg-brand-end text-background font-semibold hover:bg-brand-end/90 active:bg-brand-end/95 aria-disabled:font-normal aria-disabled:text-zinc-800 aria-disabled:bg-brand-end/50 aria-disabled:pointer-events-none ${className}`}
      onClick={handleClick}
      title={cooldown > 0 ? `잠시 후에 시도해주세요` : '새로고침'}
    >
      <LinkPending className="size-5">
        <Dices className="size-5" />
      </LinkPending>
      <span className="min-w-9 text-center">{cooldown > 0 ? `${cooldown}초` : '랜덤'}</span>
    </button>
  )
}
