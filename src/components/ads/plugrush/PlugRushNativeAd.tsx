import { twMerge } from 'tailwind-merge'

import PlugRushAdZone from './PlugRushAdZone'

const ZONE_ID = '_2637244'

type Props = {
  className?: string
}

export default function PlugRushNativeAd({ className = '' }: Props) {
  return (
    <div
      className={twMerge(
        'relative aspect-736/225 rounded-xl border overflow-hidden bg-white/4 border-white/7',
        className,
      )}
      title={`plugrush: ${ZONE_ID}`}
    >
      <PlugRushAdZone className="w-full h-full" slotClassName="absolute inset-0" zoneElementId={ZONE_ID} />
    </div>
  )
}
