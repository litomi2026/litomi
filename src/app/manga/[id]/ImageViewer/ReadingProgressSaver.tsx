'use client'

import ms from 'ms'
import { useCallback, useEffect, useRef } from 'react'

import { SessionStorageKeyMap } from '@/constants/storage'
import useActionResponse from '@/hook/useActionResponse'
import useMeQuery from '@/query/useMeQuery'

import { saveReadingProgress } from '../actions'
import { useImageIndexStore } from './store/imageIndex'

type Props = {
  mangaId: number
}

export default function ReadingProgressSaver({ mangaId }: Props) {
  const { data: me, isLoading } = useMeQuery()
  const imageIndex = useImageIndexStore((state) => state.imageIndex)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedPageRef = useRef<number | null>(null)

  const [_, dispatchAction, isSaving] = useActionResponse({
    action: saveReadingProgress,
    shouldSetResponse: false,
    silentNetworkError: true,
  })

  const saveProgress = useCallback(
    (page: number) => {
      if (lastSavedPageRef.current === page) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }
        return
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      if (isLoading) {
        return
      }

      if (me) {
        timeoutRef.current = setTimeout(() => {
          lastSavedPageRef.current = page
          dispatchAction(mangaId, page)
          timeoutRef.current = null
        }, ms('5 seconds'))
      } else {
        timeoutRef.current = setTimeout(() => {
          lastSavedPageRef.current = page
          sessionStorage.setItem(SessionStorageKeyMap.readingHistory(mangaId), String(page))
          timeoutRef.current = null
        }, ms('1 second'))
      }
    },
    [me, mangaId, dispatchAction, isLoading],
  )

  useEffect(() => {
    if (imageIndex > 0 && !isSaving) {
      saveProgress(imageIndex + 1)
    }
  }, [imageIndex, isSaving, saveProgress])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [])

  return null
}
