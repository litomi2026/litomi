'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'

import { QueryKeys } from '@/lib/react-query/query-keys'
import useChatThreadsQuery from '../_query/useChatThreadsQuery'
import { useChat } from './ChatProvider'

export default function ChatRealtime() {
  const { subscribeRoom, unsubscribeRoom, onMessage } = useChat()
  const { data } = useChatThreadsQuery()
  const queryClient = useQueryClient()
  const currentRoomsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const nextRooms = new Set(
      data?.threads.filter((thread) => thread.entitled).map((thread) => `b:${thread.artist.id}`),
    )

    // 1. 기존 방 중에서 목록에서 사라진 방 구독 취소
    for (const room of currentRoomsRef.current) {
      if (!nextRooms.has(room)) {
        unsubscribeRoom(room)
        currentRoomsRef.current.delete(room)
      }
    }

    // 2. 새 목록 중에서 기존에 없던 새로운 방 구독
    for (const room of nextRooms) {
      if (!currentRoomsRef.current.has(room)) {
        subscribeRoom(room)
        currentRoomsRef.current.add(room)
      }
    }
  }, [data?.threads, subscribeRoom, unsubscribeRoom])

  // NOTE: 언마운트 시에만 전체 구독 취소
  useEffect(() => {
    return () => {
      for (const room of currentRoomsRef.current) {
        unsubscribeRoom(room)
      }
      currentRoomsRef.current.clear()
    }
  }, [unsubscribeRoom])

  // NOTE: 다른 채팅방을 보고 있거나 홈 화면에 있더라도, 백그라운드에서 새 메시지를 캐치해서 앱 전체의 상태를 새로고침
  useEffect(() => {
    return onMessage((room, msg) => {
      if (msg.kind === 'broadcast' && room.startsWith('b:')) {
        queryClient.invalidateQueries({ queryKey: QueryKeys.chatThreads })
      }
    })
  }, [onMessage, queryClient])

  return null
}
