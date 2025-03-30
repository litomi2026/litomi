'use client'

import IconShuffle from '@/components/icons/IconShuffle'
import { useRouter } from 'next/navigation'
import { ComponentProps, useCallback, useEffect, useState } from 'react'

interface Props extends ComponentProps<'button'> {
  action: 'random' | 'refresh'
  iconClassName?: string
}

export default function ShuffleButton({ iconClassName, className = '', action, ...props }: Props) {
  const router = useRouter()
  const [cooldown, setCooldown] = useState(0)

  const handleClick = useCallback(() => {
    if (action === 'refresh') {
      if (cooldown > 0) return // 이미 대기 중이면 무시
      router.refresh()
      setCooldown(60)
    } else {
      router.push('/mangas/random')
    }
  }, [action, cooldown, router])

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
      className={`flex gap-2 items-center border-2 px-3 py-2 rounded-xl transition border-zinc-800 hover:bg-zinc-800 active:bg-zinc-900 disabled:text-zinc-500 disabled:bg-zinc-800 disabled:pointer-events-none ${className}`}
      disabled={action === 'refresh' && cooldown > 0}
      onClick={handleClick}
      {...props}
    >
      <span className="min-w-10">{action === 'refresh' && cooldown > 0 ? `${cooldown}초` : '랜덤'}</span>
      <IconShuffle className={iconClassName} />
    </button>
  )
}
