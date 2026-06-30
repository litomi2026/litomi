import { ShieldOff } from 'lucide-react'
import { useTranslations } from 'next-intl'

type Props = {
  width: number
  height: number
  rewardEnabled: boolean
}

export default function AdBlockedMessage({ height, width, rewardEnabled }: Props) {
  const t = useTranslations('Common.ads.blocked')

  return (
    <div
      className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl border text-center bg-white/4 border-white/7"
      style={{ width: `min(${width}px, 100%)`, minHeight: height }}
    >
      {height > 150 && <ShieldOff className="size-8 text-zinc-500" />}
      <div className="space-y-1">
        <p className="text-sm font-medium text-zinc-300">{t('title')}</p>
        <p className="text-xs text-zinc-500">
          {t('descriptionLine1')}
          <br />
          {t('descriptionLine2')}
        </p>
      </div>
      {height > 150 && rewardEnabled && <div className="text-xs text-zinc-600">{t('rewardHint')}</div>}
    </div>
  )
}
