'use client'

import IconShuffle from '@/components/icons/IconShuffle'
import { useRouter } from 'next/navigation'
import { ComponentProps, useCallback, useEffect, useState } from 'react'

interface Props extends ComponentProps<'button'> {
  action: 'random' | 'refresh'
  defaultCooldown?: number
  href: string
  iconClassName?: string
}

export default function ShuffleButton({
  iconClassName,
  className = '',
  action,
  href,
  defaultCooldown = 60,
  ...props
}: Props) {
  const router = useRouter()
  const [cooldown, setCooldown] = useState(3)

  const handleClick = useCallback(() => {
    if (action === 'refresh') {
      router.refresh()
    } else {
      router.push(href)
    }
    setCooldown(defaultCooldown)
  }, [action, defaultCooldown, href, router])

  useEffect(() => {
    if (cooldown === 0) return

    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [cooldown])

  return (
    <button
      className={`flex gap-2 items-center text-sm md:text-base border-2 px-3 py-2 rounded-xl transition border-zinc-800 hover:bg-zinc-800 active:bg-zinc-900 disabled:text-zinc-500 disabled:bg-zinc-800 disabled:pointer-events-none ${className}`}
      disabled={action === 'refresh' && cooldown > 0}
      onClick={handleClick}
      {...props}
    >
      <div className="min-w-10 shrink-0">{action === 'refresh' && cooldown > 0 ? `${cooldown}초` : '랜덤'}</div>
      <IconShuffle className={iconClassName} />
    </button>
  )
}
