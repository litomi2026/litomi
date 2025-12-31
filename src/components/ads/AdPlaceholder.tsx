type Props = {
  width: number
  height: number
  className?: string
}

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
