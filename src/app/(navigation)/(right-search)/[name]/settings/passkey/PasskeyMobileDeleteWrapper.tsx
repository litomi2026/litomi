'use client'

import { Trash2 } from 'lucide-react'
import { useState } from 'react'

import PasskeyDeleteButton from './PasskeyDeleteButton'

type Props = {
  children: React.ReactNode
  id: number
}

export default function PasskeyMobileDeleteWrapper({ children, id }: Readonly<Props>) {
  const [swipeX, setSwipeX] = useState(0)
  const [touchStart, setTouchStart] = useState(0)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentX = e.touches[0].clientX
    const diff = touchStart - currentX

    if (diff > 0) {
      setSwipeX(Math.min(diff, 80))
    }
  }

  const handleTouchEnd = () => {
    if (swipeX > 60) {
      setSwipeX(80)
      setShowConfirmModal(true)
    } else {
      setSwipeX(0)
    }
  }

  const handleCancel = () => {
    setShowConfirmModal(false)
    setSwipeX(0)
  }

  return (
    <div className="relative overflow-hidden touch-manipulation">
      <div className="absolute inset-y-px right-px w-24 rounded-e-2xl bg-red-800 flex items-center justify-center sm:hidden">
        <button aria-label="패스키 삭제" className="p-4" onClick={() => setShowConfirmModal(true)} type="button">
          <Trash2 className="w-5" />
        </button>
      </div>
      <div
        className="relative transition-transform sm:transition-none touch-pan-y"
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onTouchStart={handleTouchStart}
        style={{
          transform: `translateX(-${swipeX}px)`,
          willChange: swipeX > 0 ? 'transform' : 'auto',
        }}
      >
        {children}
      </div>
      <PasskeyDeleteButton id={id} onCancel={handleCancel} onOpenChange={setShowConfirmModal} open={showConfirmModal} />
    </div>
  )
}
