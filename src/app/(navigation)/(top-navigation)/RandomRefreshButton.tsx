import { Dices } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

import IconSpinner from '@/components/icons/IconSpinner'
import { useShffleStore } from '@/store/shuffle'

type Props = {
  timer?: number
  className?: string
  isLoading?: boolean
  onClick?: () => Promise<void> | void
}

export default function RandomRefreshButton({ timer, className = '', isLoading = false, onClick }: Props) {
  const router = useRouter()
  const { cooldown, startTimer } = useShffleStore()
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (onClick) {
      onClick()
    } else {
      startTransition(() => {
        router.refresh()
      })
    }
    startTimer(timer)
  }

  const showLoading = isLoading || isPending
  const isDisabled = cooldown > 0 || showLoading

  return (
    <button
      aria-disabled={isDisabled}
      className={`bg-brand text-background font-semibold hover:bg-brand/90 active:bg-brand/95 aria-disabled:font-normal aria-disabled:text-zinc-800 aria-disabled:bg-brand/50 aria-disabled:pointer-events-none ${className}`}
      onClick={handleClick}
      title={showLoading ? '로딩 중...' : cooldown > 0 ? `잠시 후에 시도해 주세요` : '새로고침'}
    >
      {showLoading ? <IconSpinner className="size-5" /> : <Dices className="size-5" />}
      <span className="min-w-9 text-center">{showLoading ? '로딩' : cooldown > 0 ? `${cooldown}초` : '갱신'}</span>
    </button>
  )
}
