'use client'

import IconShuffle from '@/components/icons/IconShuffle'
import { useShffleStore } from '@/store/shuffle'
import { useRouter } from 'next/navigation'
import { ComponentProps, memo, useCallback, useEffect } from 'react'

interface Props extends ComponentProps<'button'> {
  action: 'random' | 'refresh'
  defaultCooldown?: number
  href: string
  iconClassName?: string
}

export default memo(ShuffleButton)

function ShuffleButton({ iconClassName, className = '', action, href, defaultCooldown = 20, ...props }: Props) {
  const router = useRouter()
  const { cooldown, setCooldown } = useShffleStore()

  const handleClick = useCallback(() => {
    if (action === 'refresh') {
      router.refresh()
    } else {
      router.push(href)
    }
    setCooldown(defaultCooldown)
    window.scrollTo({ top: 0 })
  }, [action, defaultCooldown, href, router, setCooldown])

  useEffect(() => {
    if (cooldown === 0) return

    const timer = setInterval(() => {
      if (cooldown <= 1) {
        clearInterval(timer)
        return setCooldown(0)
      }
      return setCooldown(cooldown - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [cooldown, setCooldown])

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
