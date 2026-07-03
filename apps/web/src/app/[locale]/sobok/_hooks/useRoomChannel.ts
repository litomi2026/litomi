'use client'

import type { ChatRelayMessageDTO } from '@litomi/contracts'
import { useEffect, useRef } from 'react'
import { useChat } from '../_components/ChatProvider'

interface RoomChannelHandlers {
  onMessage?: (message: ChatRelayMessageDTO) => void
  onRevoked?: () => void
}

// Subscribes to one WS room for the lifetime of the component (no-op while room is null)
// and routes that room's events to the handlers. Handlers are kept in a ref so callers
// can pass inline closures without resubscribing every render.
export default function useRoomChannel(room: string | null, handlers: RoomChannelHandlers) {
  const { subscribeRoom, unsubscribeRoom, onMessage, onRevoked } = useChat()
  const handlersRef = useRef(handlers)

  useEffect(() => {
    handlersRef.current = handlers
  })

  useEffect(() => {
    if (!room) {
      return
    }

    subscribeRoom(room)

    const offMessage = onMessage((msgRoom, message) => {
      if (msgRoom === room) {
        handlersRef.current.onMessage?.(message)
      }
    })

    const offRevoked = onRevoked((revokedRoom) => {
      if (revokedRoom === room) {
        handlersRef.current.onRevoked?.()
      }
    })

    return () => {
      offMessage()
      offRevoked()
      unsubscribeRoom(room)
    }
  }, [room, subscribeRoom, unsubscribeRoom, onMessage, onRevoked])
}
