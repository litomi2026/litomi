import { Dices } from 'lucide-react'
import { useRouter } from 'next/navigation'

import LinkPending from '@/components/LinkPending'
import { useShffleStore } from '@/store/shuffle'

type Props = {
  timer?: number
  className?: string
}

export default function RandomRefreshButton({ timer, className = '' }: Props) {
  const router = useRouter()
  const { cooldown, startTimer } = useShffleStore()

  function handleClick() {
    router.refresh()
    startTimer(timer)
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
      <span className="min-w-9 text-center">{cooldown > 0 ? `${cooldown}초` : '갱신'}</span>
    </button>
  )
}
