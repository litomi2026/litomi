'use client'

import { type RefObject, useCallback, useEffect, useState } from 'react'
import type { ChatMessageListHandle } from '../_components/ChatMessageList'

const HIGHLIGHT_MS = 1500

// Jump to a message in the virtualized list and flash it briefly. The target may be scrolled out
// of the DOM, so we scroll by key through the list handle rather than holding a node ref.
export default function useMessageJump(listRef: RefObject<ChatMessageListHandle | null>) {
  const [highlightedId, setHighlightedId] = useState<string | null>(null)

  const jumpTo = useCallback(
    (messageId: string) => {
      listRef.current?.scrollToKey(messageId, { align: 'center' })
      setHighlightedId(messageId)
    },
    [listRef],
  )

  // Clear the flash after it plays.
  useEffect(() => {
    if (!highlightedId) {
      return
    }

    const timer = window.setTimeout(() => {
      setHighlightedId(null)
    }, HIGHLIGHT_MS)

    return () => {
      window.clearTimeout(timer)
    }
  }, [highlightedId])

  return { highlightedId, jumpTo }
}
