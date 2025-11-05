'use client'

import { ReactNode, useRef, useState } from 'react'

interface Props {
  children: ReactNode
  enabled: boolean
  notification: {
    id: number
    type: number
    title: string
    body: string
    createdAt: string | Date
    read: boolean
    data: string | null
  }
  onDelete: (id: number) => void
  onMarkAsRead: (id: number) => void
}

export default function SwipeableWrapper({ notification, onDelete, onMarkAsRead, enabled, children }: Props) {
  const [swipeX, setSwipeX] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const startX = useRef(0)
  const cardRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!enabled) return
    startX.current = e.touches[0].clientX
    setIsSwiping(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping || !enabled) return
    const currentX = e.touches[0].clientX
    const diff = currentX - startX.current
    const maxSwipe = 120
    const constrainedDiff = Math.max(-maxSwipe, Math.min(maxSwipe, diff))
    setSwipeX(constrainedDiff)
  }

  const handleTouchEnd = () => {
    if (!isSwiping) return

    const threshold = 80
    if (swipeX > threshold && onMarkAsRead && notification && !notification.read) {
      // 오른쪽으로 스와이프
      onMarkAsRead(notification.id)
    } else if (swipeX < -threshold && onDelete) {
      // 왼쪽으로 스와이프
      onDelete(notification.id)
    }

    setSwipeX(0)
    setIsSwiping(false)
  }

  const isTouchDevice = typeof window !== 'undefined' && 'ontouchstart' in window

  if (!isTouchDevice || !enabled) {
    return children
  }

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-between px-4">
        <div className={`flex items-center gap-2 transition ${swipeX > 40 ? 'opacity-100' : 'opacity-0'}`}>
          <div className="p-2 rounded-lg bg-green-600/20">
            <span className="text-xs font-medium text-green-400">읽음</span>
          </div>
        </div>
        <div className={`flex items-center gap-2 transition ${swipeX < -40 ? 'opacity-100' : 'opacity-0'}`}>
          <div className="p-2 rounded-lg bg-red-600/20">
            <span className="text-xs font-medium text-red-400">삭제</span>
          </div>
        </div>
      </div>
      <div
        className="relative transition"
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onTouchStart={handleTouchStart}
        ref={cardRef}
        style={{ transform: `translateX(${swipeX}px)` }}
      >
        {children}
      </div>
    </div>
  )
}
