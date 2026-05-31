import { Dices, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useTransition } from 'react'
import { twMerge } from 'tailwind-merge'

import { useRouter } from '@/i18n/navigation'
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
  const t = useTranslations('TopNavigation.actions.randomRefresh')

  function handleClick() {
    if (onClick) {
      onClick()
    } else {
      startTransition(() => router.refresh())
    }
    startTimer(timer)
  }

  const showLoading = isLoading || isPending
  const isDisabled = cooldown > 0 || showLoading

  return (
    <button
      aria-disabled={isDisabled}
      className={twMerge(
        'bg-brand font-semibold hover:bg-brand/90 active:bg-brand/95 aria-disabled:font-normal aria-disabled:text-zinc-800 aria-disabled:bg-brand/50 aria-disabled:pointer-events-none',
        className,
        'text-background',
      )}
      onClick={handleClick}
      title={showLoading ? t('loadingTitle') : cooldown > 0 ? t('cooldownTitle') : t('refreshTitle')}
    >
      {showLoading ? <Loader2 className="size-5 animate-spin" /> : <Dices className="size-5" />}
      <span className="min-w-9 tabular-nums text-center hidden sm:inline">
        {showLoading ? t('loading') : cooldown > 0 ? t('seconds', { seconds: cooldown }) : t('refresh')}
      </span>
    </button>
  )
}
