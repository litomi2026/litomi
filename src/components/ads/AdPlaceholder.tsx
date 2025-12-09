type Props = {
  width: number
  height: number
  className?: string
}

/**
 * CLS 방지를 위한 광고 플레이스홀더
 * 광고가 로드되기 전에 공간을 미리 확보합니다
 */
export default function AdPlaceholder({ width, height, className = '' }: Props) {
  return (
    <div
      className={`flex items-center justify-center bg-zinc-800/50 rounded-lg animate-pulse ${className}`}
      style={{
        width: `min(${width}px, 100%)`,
        height: height,
        aspectRatio: `${width}/${height}`,
      }}
    >
      <span className="text-xs text-zinc-500">광고</span>
    </div>
  )
}
