import { type HTMLAttributes, type PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from 'react'
import { twMerge } from 'tailwind-merge'

type Props = HTMLAttributes<HTMLDivElement> & {
  isReversed?: boolean
  max?: number
  min?: number
  onChange?: (value: number) => void
  onValueCommit?: (value: number) => void
  step?: number
  value?: number
}

export default function Slider({
  value: controlledValue,
  isReversed,
  onChange,
  onValueCommit,
  min = 0,
  max = 100,
  step = 1,
  className = '',
  ...rest
}: Props) {
  const [value, setValue] = useState<number>(controlledValue ?? min)
  const sliderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (controlledValue !== undefined) {
      setValue(controlledValue)
    }
  }, [controlledValue])

  const ratio = Math.max(0, Math.min((value - min) / (max - min || 1), 1))
  const thumbRatio = isReversed ? 1 - ratio : ratio
  const thumbRatioPercentage = (thumbRatio * 100).toFixed(2)

  function updateValueFromClientX(clientX: number) {
    const slider = sliderRef.current

    if (!slider) {
      return value
    }

    const rect = slider.getBoundingClientRect()
    const visualRatio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1)
    const nextRatio = isReversed ? 1 - visualRatio : visualRatio
    const rawValue = min + nextRatio * (max - min)
    const nextValue = Math.round((rawValue - min) / step) * step + min

    setValue(nextValue)
    onChange?.(nextValue)

    return nextValue
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    event.preventDefault()
    updateValueFromClientX(event.clientX)

    function handlePointerMove(event: PointerEvent) {
      updateValueFromClientX(event.clientX)
    }

    function handlePointerUp(event: PointerEvent) {
      const finalValue = updateValueFromClientX(event.clientX)
      document.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('pointerup', handlePointerUp)
      onValueCommit?.(finalValue)
    }

    document.addEventListener('pointermove', handlePointerMove)
    document.addEventListener('pointerup', handlePointerUp)
  }

  return (
    <div
      className={twMerge('relative flex w-full cursor-grab touch-none select-none items-center', className)}
      ref={sliderRef}
      {...rest}
      onPointerDown={handlePointerDown}
    >
      <div className="relative h-1/3 w-full grow overflow-hidden rounded-full border bg-zinc-300">
        <div
          className={twMerge('absolute h-full w-full bg-brand-gradient', isReversed ? 'origin-right' : 'origin-left')}
          style={{ transform: `scaleX(${ratio})` }}
        />
      </div>
      <div className="absolute aspect-square h-full -translate-x-1/2" style={{ left: `${thumbRatioPercentage}%` }}>
        <div className="h-full w-full rounded-full border-2 border-zinc-400 bg-foreground" />
      </div>
    </div>
  )
}
