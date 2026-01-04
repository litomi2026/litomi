'use client'

import ms from 'ms'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { toast } from 'sonner'

const NUDGE_WINDOW = ms('1 minute')
const TOAST_DURATION = ms('15 seconds')

export default function NewYearToastNudge() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (pathname?.startsWith('/nye')) {
      return
    }

    const now = new Date()
    const isDec31 = now.getMonth() === 11 && now.getDate() === 31
    if (!isDec31) {
      return
    }

    const showNudgeIfNeeded = () => {
      const nowMs = Date.now()
      const targetMs = getNextNewYearTargetMs(nowMs)
      const triggerStartMs = targetMs - NUDGE_WINDOW
      if (nowMs < triggerStartMs || nowMs >= targetMs) {
        return
      }

      const targetYear = new Date(targetMs).getFullYear()
      const storageKey = getToastStorageKey(targetYear)
      const toastId = storageKey

      try {
        if (sessionStorage.getItem(storageKey) === '1') {
          return
        }
        sessionStorage.setItem(storageKey, '1')
      } catch {
        // ignore
      }

      toast('새해 카운트다운이 1분 남았어요', {
        id: toastId,
        duration: TOAST_DURATION,
        action: {
          label: '보러 가기',
          onClick: () => router.push('/nye'),
        },
      })
    }

    const nowMs = Date.now()
    const targetMs = getNextNewYearTargetMs(nowMs)
    const triggerStartMs = targetMs - NUDGE_WINDOW

    // If we're already within the 1-minute window, show immediately.
    if (nowMs >= triggerStartMs && nowMs < targetMs) {
      showNudgeIfNeeded()
      return
    }

    // Otherwise, schedule a single timer to run exactly when the window starts.
    const delayMs = triggerStartMs - nowMs
    if (delayMs <= 0) {
      return
    }

    const timeoutId = window.setTimeout(showNudgeIfNeeded, delayMs)
    return () => window.clearTimeout(timeoutId)
  }, [pathname, router])

  return null
}

function getNextNewYearTargetMs(nowMs: number): number {
  const now = new Date(nowMs)
  return new Date(now.getFullYear() + 1, 0, 1, 0, 0, 0, 0).getTime()
}

function getToastStorageKey(targetYear: number): string {
  return `nye-nudge-${targetYear}`
}
