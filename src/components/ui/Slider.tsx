import { HTMLAttributes, useEffect, useRef, useState } from 'react'

type Props = HTMLAttributes<HTMLDivElement> & {
  className?: string
  max?: number
  min?: number
  onChange?: (value: number) => void
  onValueCommit?: (value: number) => void
  step?: number
  value?: number
}

export default function Slider({
  value: controlledValue,
  onChange,
  onValueCommit,
  min = 0,
  max = 100,
  step = 1,
  className = '',
  ...rest
}: Props) {
  const [value, setValue] = useState<number>(controlledValue !== undefined ? controlledValue : min)
  const sliderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (controlledValue !== undefined) {
      setValue(controlledValue)
    }
  }, [controlledValue])

  // 현재 값의 비율 계산 (0 ~ 1)
  const ratio = (value - min) / (max - min || 1)
  const ratioPercentage = Math.max(0, ratio * 100).toFixed(2)

  // clientX 좌표를 기반으로 새로운 값을 계산 및 업데이트
  const updateValueFromEvent = (clientX: number): number => {
    if (!sliderRef.current) return value
    const rect = sliderRef.current.getBoundingClientRect()
    const newRatio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1)
    const newValue = min + newRatio * (max - min)
    const steppedValue = Math.round((newValue - min) / step) * step + min
    setValue(steppedValue)
    if (onChange) {
      onChange(steppedValue)
    }
    return steppedValue
  }

  // 컨테이너에서 pointer down 발생 시 드래그 시작(트랙이나 thumb 모두 해당)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    updateValueFromEvent(e.clientX)

    const onPointerMove = (e: PointerEvent) => {
      updateValueFromEvent(e.clientX)
    }

    const onPointerUp = (e: PointerEvent) => {
      const finalValue = updateValueFromEvent(e.clientX)
      document.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('pointerup', onPointerUp)
      if (onValueCommit) {
        onValueCommit(finalValue)
      }
    }

    document.addEventListener('pointermove', onPointerMove)
    document.addEventListener('pointerup', onPointerUp)
  }

  return (
    <div
      className={`relative flex w-full cursor-grab touch-none select-none items-center ${className}`}
      ref={sliderRef}
      {...rest}
      onPointerDown={handlePointerDown}
    >
      {/* 트랙 */}
      <div className="relative h-1/3 border w-full grow overflow-hidden rounded-full bg-zinc-300">
        <div
          className="absolute w-full origin-left h-full bg-brand-gradient"
          style={{ transform: `scaleX(${ratio.toFixed(3)})` }}
        />
      </div>
      {/* Thumb */}
      <div className="absolute aspect-square h-full -translate-x-1/2" style={{ left: `${ratioPercentage}%` }}>
        <div className="w-full h-full border-2 rounded-full border-zinc-400 bg-foreground" />
      </div>
    </div>
  )
}
