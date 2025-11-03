'use client'

import { Star } from 'lucide-react'
import { memo, useCallback, useRef, useState } from 'react'

const RATING_PRESETS = [
  { label: '망작', min: '0.01', max: '1.5' },
  { label: '명작', min: '3.5', max: '5' },
  { label: '만신', min: '4.5', max: '5' },
]

type Props = {
  minValue?: string
  maxValue?: string
  onMinChange: (value: string) => void
  onMaxChange: (value: string) => void
  className?: string
}

export default memo(RatingSlider)

function RatingSlider({ minValue, maxValue, onMinChange, onMaxChange }: Readonly<Props>) {
  const sliderRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState<'max' | 'min' | null>(null)

  const min = 0
  const max = 5
  const step = 0.1

  const minVal = minValue ? parseFloat(minValue) : min
  const maxVal = maxValue ? parseFloat(maxValue) : max
  const minPos = ((minVal - min) / (max - min)) * 100
  const maxPos = ((maxVal - min) / (max - min)) * 100

  const updateValue = useCallback(
    (clientX: number, type: 'max' | 'min') => {
      if (!sliderRef.current) return

      const rect = sliderRef.current.getBoundingClientRect()
      const percentage = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1)
      const rawValue = min + percentage * (max - min)
      const steppedValue = Math.round(rawValue / step) * step
      const clampedValue = Math.min(Math.max(steppedValue, min), max)

      if (type === 'min') {
        const newMin = Math.min(clampedValue, maxVal - step)

        if (newMin === min && maxVal === max) {
          onMinChange('')
          onMaxChange('')
        } else {
          onMinChange(newMin.toFixed(1))
        }
      } else {
        const newMax = Math.max(clampedValue, minVal + step)

        if (minVal === min && newMax === max) {
          onMinChange('')
          onMaxChange('')
        } else {
          onMaxChange(newMax.toFixed(1))
        }
      }
    },
    [minVal, maxVal, onMinChange, onMaxChange],
  )

  const handlePointerDown = (e: React.PointerEvent, type: 'max' | 'min') => {
    e.preventDefault()
    setIsDragging(type)
    updateValue(e.clientX, type)

    const handlePointerMove = (e: PointerEvent) => {
      updateValue(e.clientX, type)
    }

    const handlePointerUp = () => {
      setIsDragging(null)
      document.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('pointerup', handlePointerUp)
    }

    document.addEventListener('pointermove', handlePointerMove)
    document.addEventListener('pointerup', handlePointerUp)
  }

  const handleTrackClick = (e: React.MouseEvent) => {
    if (!sliderRef.current || isDragging) return

    const rect = sliderRef.current.getBoundingClientRect()
    const percentage = (e.clientX - rect.left) / rect.width
    const clickValue = min + percentage * (max - min)

    const distToMin = Math.abs(clickValue - minVal)
    const distToMax = Math.abs(clickValue - maxVal)

    if (distToMin < distToMax) {
      updateValue(e.clientX, 'min')
    } else {
      updateValue(e.clientX, 'max')
    }
  }

  function handlePresetClick(preset: (typeof RATING_PRESETS)[number]) {
    const presetMin = preset.min || '0'
    const presetMax = preset.max || '5'

    if (parseFloat(presetMin) === 0 && parseFloat(presetMax) === 5) {
      onMinChange('')
      onMaxChange('')
    } else {
      onMinChange(presetMin)
      onMaxChange(presetMax)
    }
  }

  return (
    <fieldset>
      <label className="flex items-center gap-2" htmlFor="min-rating">
        별점
      </label>
      <div className="flex items-center justify-between my-2">
        <div className="flex gap-2">
          {RATING_PRESETS.map((preset) => (
            <button
              aria-pressed={minValue === preset.min && maxValue === preset.max}
              className="px-3 py-1 text-xs rounded-lg border transition bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300
                aria-pressed:bg-zinc-700 aria-pressed:border-brand aria-pressed:text-zinc-100"
              key={preset.label}
              onClick={() => handlePresetClick(preset)}
              type="button"
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Star
            aria-current={Boolean(minValue || maxValue)}
            className="size-4 aria-current:fill-brand aria-current:text-brand"
          />
          <span className="font-medium tabular-nums">
            {minVal.toFixed(1)} ~ {maxVal.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Slider */}
      <div className="relative h-8 mx-4 flex items-center cursor-pointer" onClick={handleTrackClick} ref={sliderRef}>
        <div className="absolute w-full h-2 bg-zinc-800 rounded-full" />
        <div
          className="absolute h-2 bg-gradient-to-r from-brand-start to-brand rounded-full"
          style={{
            left: `${minPos}%`,
            right: `${100 - maxPos}%`,
          }}
        />
        {[1, 2, 3, 4].map((star) => (
          <div
            className="absolute flex flex-col items-center pointer-events-none top-1 -translate-x-1/2"
            key={star}
            style={{ left: `${(star / 5) * 100}%` }}
          >
            <div className="h-2 w-px bg-zinc-700" />
            <span className="text-[10px] text-zinc-600 mt-2">{star}</span>
          </div>
        ))}
        <div
          aria-current={isDragging === 'min'}
          className="absolute size-6 -translate-x-1/2 cursor-grab transition aria-current:scale-110 aria-current:cursor-grabbing hover:scale-105"
          onPointerDown={(e) => handlePointerDown(e, 'min')}
          style={{ left: `${minPos}%` }}
        >
          <div className="w-full h-full bg-zinc-800 border-2 border-brand rounded-full shadow-lg">
            <Star className="w-3 h-3 fill-brand text-brand m-auto mt-1" />
          </div>
        </div>
        <div
          aria-current={isDragging === 'max'}
          className="absolute size-6 -translate-x-1/2 cursor-grab transition aria-current:scale-110 aria-current:cursor-grabbing hover:scale-105"
          onPointerDown={(e) => handlePointerDown(e, 'max')}
          style={{ left: `${maxPos}%` }}
        >
          <div className="w-full h-full bg-zinc-800 border-2 border-brand rounded-full shadow-lg">
            <Star className="w-3 h-3 fill-brand text-brand m-auto mt-1" />
          </div>
        </div>
      </div>
    </fieldset>
  )
}
