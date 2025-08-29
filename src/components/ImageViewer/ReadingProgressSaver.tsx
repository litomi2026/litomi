'use client'

import ms from 'ms'
import { useCallback, useEffect, useMemo } from 'react'

import { saveReadingProgress } from '@/app/manga/[id]/actions'
import { useImageIndexStore } from '@/components/ImageViewer/store/imageIndex'
import { SessionStorageKeyMap } from '@/constants/storage'
import useActionResponse from '@/hook/useActionResponse'
import useMeQuery from '@/query/useMeQuery'
import { debounce } from '@/utils/debounce'

type Props = {
  mangaId: number
}

export default function ReadingProgressSaver({ mangaId }: Props) {
  const { data: me, isLoading } = useMeQuery()
  const imageIndex = useImageIndexStore((state) => state.imageIndex)

  const [_, dispatchAction, isSaving] = useActionResponse({
    action: saveReadingProgress,
    shouldSetResponse: false,
  })

  const saveProgress = useMemo(() => {
    if (isLoading) {
      return () => {}
    }

    if (me) {
      return debounce((page: number) => {
        dispatchAction(mangaId, page)
      }, ms('10 seconds'))
    } else {
      return debounce((page: number) => {
        sessionStorage.setItem(SessionStorageKeyMap.readingHistory(mangaId), String(page))
      }, 500)
    }
  }, [me, mangaId, dispatchAction, isLoading])

  const clearProgress = useCallback(() => {
    if (!me) {
      sessionStorage.removeItem(SessionStorageKeyMap.readingHistory(mangaId))
    }
  }, [me, mangaId])

  useEffect(() => {
    if (imageIndex > 0 && !isSaving) {
      saveProgress(imageIndex)
    }
  }, [imageIndex, isSaving, saveProgress])

  useEffect(() => {
    return () => {
      clearProgress()
    }
  }, [clearProgress])

  return null
}
