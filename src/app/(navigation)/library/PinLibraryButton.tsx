'use client'

import { Pin } from 'lucide-react'
import { useState } from 'react'
import { twMerge } from 'tailwind-merge'

import type { LibraryListItem } from '@/backend/api/v1/library/GET'

import { showAdultVerificationRequiredToast } from '@/lib/toast'
import useMeQuery from '@/query/useMeQuery'
import { canAccessAdultRestrictedAPIs } from '@/utils/adult-verification'

import usePinLibraryMutation from './usePinLibraryMutation'
import usePinnedLibraryListInfiniteQuery from './usePinnedLibraryListInfiniteQuery'

type Props = {
  className?: string
  libraryId: number
  library?: LibraryListItem
}

export default function PinLibraryButton({ className = '', libraryId, library }: Readonly<Props>) {
  const { data: me } = useMeQuery()
  const canAccess = canAccessAdultRestrictedAPIs(me)
  const { mutate, isPending } = usePinLibraryMutation()
  const { data: pinnedData } = usePinnedLibraryListInfiniteQuery({ userId: me?.id ?? null, enabled: !!me })
  const isPinned = pinnedData?.pages.some((page) => page.libraries.some((lib) => lib.id === libraryId))
  const [isAnimating, setIsAnimating] = useState(false)

  function handlePinToggle() {
    if (isPending) {
      return
    }

    const action = isPinned ? 'unpin' : 'pin'

    if (action === 'pin' && !canAccess) {
      showAdultVerificationRequiredToast({ username: me?.name })
      return
    }

    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 300)

    mutate({ libraryId, action, library })
  }

  if (!me) {
    return null
  }

  return (
    <button
      className={twMerge(
        'relative hover:bg-zinc-800 rounded-lg p-2 disabled:opacity-50 active:scale-90 transition duration-300',
        className,
      )}
      disabled={isPending}
      onClick={handlePinToggle}
      title={isPinned ? '고정 해제' : '서재 고정'}
      type="button"
    >
      <Pin
        className={twMerge(
          'size-5 transition duration-300',
          isAnimating ? 'scale-110' : '',
          isPinned ? 'fill-current' : '',
        )}
      />
    </button>
  )
}
