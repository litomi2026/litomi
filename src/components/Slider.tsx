import { HTMLAttributes, useEffect, useRef, useState } from 'react'

type SliderProps = HTMLAttributes<HTMLDivElement> & {
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
}: SliderProps) {
  const [value, setValue] = useState<number>(controlledValue !== undefined ? controlledValue : min)
  const sliderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (controlledValue !== undefined) {
      setValue(controlledValue)
    }
  }, [controlledValue])

  // 현재 값의 비율 계산 (0 ~ 1)
  const ratio = (value - min) / (max - min)

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
      className={`relative flex w-full touch-none select-none items-center ${className}`}
      ref={sliderRef}
      {...rest}
      onPointerDown={handlePointerDown}
    >
      {/* 트랙 */}
      <div className="relative h-2/5 border-1 w-full grow overflow-hidden rounded-full bg-gray-400">
        {/* 현재 값 비율에 따른 Range */}
        <div className="absolute h-full bg-brand-gradient" style={{ width: `${ratio * 100}%` }} />
      </div>
      {/* Thumb */}
      <div
        className="block -translate-x-1/2 absolute cursor-grab h-full aspect-square rounded-full border-2 border-gray-500 bg-white transition focus:outline-none"
        style={{ left: `${ratio * 100}%` }}
      />
    </div>
  )
}
