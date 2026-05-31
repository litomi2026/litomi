'use client'

import { Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { twMerge } from 'tailwind-merge'

import type { PasskeySignalData } from './common'

import PasskeyDeleteDialog from './PasskeyDeleteDialog'

const DELETE_ACTION_WIDTH = 80
const DELETE_OPEN_THRESHOLD = 48

type Props = {
  children: React.ReactNode
  credentialId: string
  id: number
  passkeySignalData: PasskeySignalData
}

export default function PasskeyMobileDeleteWrapper({ children, credentialId, id, passkeySignalData }: Props) {
  const [swipeX, setSwipeX] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const touchStartX = useRef(0)

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
    setIsSwiping(true)
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!isSwiping) {
      return
    }

    const currentX = e.touches[0].clientX
    const diff = touchStartX.current - currentX

    setSwipeX(Math.min(Math.max(diff, 0), DELETE_ACTION_WIDTH))
  }

  function handleTouchEnd() {
    setIsSwiping(false)

    if (swipeX >= DELETE_OPEN_THRESHOLD) {
      setSwipeX(DELETE_ACTION_WIDTH)
      setShowConfirmModal(true)
    } else {
      setSwipeX(0)
    }
  }

  function handleTouchCancel() {
    setIsSwiping(false)
    setSwipeX(0)
  }

  function handleOpenChange(open: boolean) {
    setShowConfirmModal(open)

    if (!open) {
      setSwipeX(0)
    }
  }

  return (
    <div className="relative overflow-hidden touch-manipulation">
      <div className="absolute inset-y-px right-px w-24 rounded-e-2xl bg-red-800 flex items-center justify-center sm:hidden">
        <button aria-label="패스키 삭제" className="p-4" onClick={() => setShowConfirmModal(true)} type="button">
          <Trash2 className="size-5 shrink-0" />
        </button>
      </div>
      <div
        className={twMerge(
          'relative touch-pan-y sm:transition-none',
          isSwiping ? '' : 'transition-transform duration-150 ease-out',
        )}
        onTouchCancel={handleTouchCancel}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onTouchStart={handleTouchStart}
        style={{
          transform: `translateX(-${swipeX}px)`,
          willChange: isSwiping || swipeX > 0 ? 'transform' : 'auto',
        }}
      >
        {children}
      </div>
      <PasskeyDeleteDialog
        credentialId={credentialId}
        id={id}
        onOpenChange={handleOpenChange}
        open={showConfirmModal}
        passkeySignalData={passkeySignalData}
      />
    </div>
  )
}
