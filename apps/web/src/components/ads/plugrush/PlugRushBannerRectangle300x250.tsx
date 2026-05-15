import PlugRushAdZone from './PlugRushAdZone'

const ZONE_ID = '_2637233'
const WIDTH = 300
const HEIGHT = 250

type Props = {
  className?: string
}

export default function PlugRushBannerRectangle300x250({ className = '' }: Props) {
  return (
    <div
      className={`flex flex-col items-center justify-center ${className}`}
      style={{ width: `min(${WIDTH}px, 100%)`, minHeight: HEIGHT }}
      title={`plugrush: ${ZONE_ID}`}
    >
      <div
        className="relative rounded-xl border overflow-hidden bg-white/4 border-white/7"
        style={{ width: `min(${WIDTH}px, 100%)`, height: HEIGHT }}
      >
        <PlugRushAdZone className="w-full h-full" slotClassName="absolute inset-0" zoneElementId={ZONE_ID} />
      </div>
      <div className="text-xs h-5 flex items-center justify-center" />
    </div>
  )
}
