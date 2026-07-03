'use client'

import type { ChatRelayMessageDTO } from '@litomi/contracts'
import { useEffect, useEffectEvent } from 'react'
import { useChat } from '../_components/ChatProvider'

interface RoomChannelHandlers {
  onMessage?: (message: ChatRelayMessageDTO) => void
  onRevoked?: () => void
}

// Subscribes to one WS room for the lifetime of the component (no-op while room is null)
// and routes that room's events to the handlers. Handlers are effect events, so callers
// can pass inline closures without resubscribing every render.
export default function useRoomChannel(room: string | null, handlers: RoomChannelHandlers) {
  const { subscribeRoom, unsubscribeRoom, onMessage, onRevoked } = useChat()
  const emitMessage = useEffectEvent((message: ChatRelayMessageDTO) => handlers.onMessage?.(message))
  const emitRevoked = useEffectEvent(() => handlers.onRevoked?.())

  useEffect(() => {
    if (!room) {
      return
    }

    subscribeRoom(room)

    const offMessage = onMessage((msgRoom, message) => {
      if (msgRoom === room) {
        emitMessage(message)
      }
    })

    const offRevoked = onRevoked((revokedRoom) => {
      if (revokedRoom === room) {
        emitRevoked()
      }
    })

    return () => {
      offMessage()
      offRevoked()
      unsubscribeRoom(room)
    }
  }, [room, subscribeRoom, unsubscribeRoom, onMessage, onRevoked])
}
