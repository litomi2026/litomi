'use client'

import { useRef } from 'react'

type LongPressOptions = {
  onLongPress: () => void
  onClick?: () => void
  delay?: number
  moveThreshold?: number
  disabled?: boolean
}

export default function useLongPress({
  onLongPress,
  onClick,
  delay = 500,
  moveThreshold = 10,
  disabled = false,
}: LongPressOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isLongPressTriggeredRef = useRef(false)
  const startPosRef = useRef<{ x: number; y: number } | null>(null)
  const pointerTypeRef = useRef<string | null>(null)

  function clear() {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  function reset() {
    clear()
    startPosRef.current = null
    pointerTypeRef.current = null
  }

  function handlePointerDown(e: React.PointerEvent) {
    if (disabled) return
    if (e.button === 2) return // 우클릭 무시
    if (timerRef.current) return

    pointerTypeRef.current = e.pointerType
    startPosRef.current = { x: e.clientX, y: e.clientY }
    isLongPressTriggeredRef.current = false

    timerRef.current = setTimeout(() => {
      timerRef.current = null
      isLongPressTriggeredRef.current = true
      onLongPress()
    }, delay)
  }

  function handlePointerUp() {
    if (!isLongPressTriggeredRef.current && timerRef.current) {
      onClick?.()
    }
    reset()
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!startPosRef.current) {
      return
    }

    const deltaX = Math.abs(e.clientX - startPosRef.current.x)
    const deltaY = Math.abs(e.clientY - startPosRef.current.y)

    if (deltaX > moveThreshold || deltaY > moveThreshold) {
      reset()
    }
  }

  function handlePointerLeave() {
    reset()
  }

  return {
    onPointerDown: handlePointerDown,
    onPointerUp: handlePointerUp,
    onPointerMove: handlePointerMove,
    onPointerLeave: handlePointerLeave,
    onPointerCancel: handlePointerLeave,
  }
}
