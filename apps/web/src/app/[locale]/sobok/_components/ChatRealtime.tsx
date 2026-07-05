'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'

import { QueryKeys } from '@/lib/react-query/query-keys'
import useChatThreadsQuery from '../_query/useChatThreadsQuery'
import { useChat } from './ChatProvider'

export default function ChatRealtime() {
  const { connectionId, myUserId, subscribeRoom, unsubscribeRoom, onMessage } = useChat()
  const { data } = useChatThreadsQuery()
  const queryClient = useQueryClient()
  const currentRoomsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    // Broadcasts on b: (entitled only) + the artist's 1:1 answers on fc: (all threads —
    // readable regardless of entitlement) drive the chat-list preview/unread in the background.
    const nextRooms = new Set<string>()

    for (const thread of data?.threads ?? []) {
      if (thread.entitled) {
        nextRooms.add(`b:${thread.artist.id}`)
      }
      if (myUserId) {
        nextRooms.add(`fc:${thread.artist.id}:${myUserId}`)
      }
    }

    // 1. 목록에서 사라진 방 구독 취소
    for (const room of currentRoomsRef.current) {
      if (!nextRooms.has(room)) {
        unsubscribeRoom(room)
        currentRoomsRef.current.delete(room)
      }
    }

    // 2. 새로 나타난 방 구독
    for (const room of nextRooms) {
      if (!currentRoomsRef.current.has(room)) {
        subscribeRoom(room)
        currentRoomsRef.current.add(room)
      }
    }
  }, [data?.threads, myUserId, subscribeRoom, unsubscribeRoom])

  // NOTE: 언마운트 시에만 전체 구독 취소
  useEffect(() => {
    return () => {
      for (const room of currentRoomsRef.current) {
        unsubscribeRoom(room)
      }
      currentRoomsRef.current.clear()
    }
  }, [unsubscribeRoom])

  // NOTE: 다른 화면에 있어도 새 브로드캐스트/아티스트 답장을 캐치해 목록 상태를 새로고침
  useEffect(() => {
    return onMessage((_room, msg) => {
      if (msg.kind === 'broadcast' || msg.kind === 'artistReply') {
        queryClient.invalidateQueries({ queryKey: QueryKeys.chatThreads })
      }
    })
  }, [onMessage, queryClient])

  // NOTE: 재연결 catch-up — 소켓이 끊긴 동안 relay된 메시지는 유실되므로, 재연결(connectionId>1)
  //       마다 chat 쿼리를 무효화해 활성 화면(목록·열린 방·답장방)이 놓친 구간을 다시 가져오게 한다.
  useEffect(() => {
    if (connectionId <= 1) {
      return
    }
    queryClient.invalidateQueries({ queryKey: ['chat'] })
  }, [connectionId, queryClient])

  return null
}
