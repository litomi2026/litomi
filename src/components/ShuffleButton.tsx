'use client'

import { useRouter } from 'next/navigation'
import { ComponentProps, memo, useCallback, useEffect } from 'react'

import IconShuffle from '@/components/icons/IconShuffle'
import { useShffleStore } from '@/store/shuffle'

interface Props extends ComponentProps<'button'> {
  action: 'random' | 'refresh'
  href?: string
  iconClassName?: string
  retryInterval?: number
}

export default memo(ShuffleButton)

function ShuffleButton({ iconClassName, className = '', action, href, retryInterval = 20, ...props }: Props) {
  const router = useRouter()
  const { cooldown, startTimer } = useShffleStore()

  const handleClick = useCallback(() => {
    if (action === 'refresh') {
      router.refresh()
    } else if (href) {
      router.push(href)
    }
    startTimer(retryInterval)
    window.scrollTo({ top: 0 })
  }, [action, retryInterval, href, router, startTimer])

  useEffect(() => {
    startTimer()
  }, [startTimer])

  return (
    <button
      className={`flex gap-2 items-center border-2 px-3 py-2 rounded-xl transition hover:bg-zinc-800 active:bg-zinc-900 disabled:text-zinc-500 disabled:bg-zinc-800 disabled:pointer-events-none ${className}`}
      disabled={action === 'refresh' && cooldown > 0}
      onClick={handleClick}
      {...props}
    >
      <div className="min-w-10 shrink-0">{action === 'refresh' && cooldown > 0 ? `${cooldown}초` : '랜덤'}</div>
      <IconShuffle className={iconClassName} />
    </button>
  )
}
