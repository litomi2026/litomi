'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'

import { QueryKeys } from '@/lib/react-query/query-keys'
import useChatThreadsQuery from '../_query/useChatThreadsQuery'
import { useChat } from './ChatProvider'

export default function ChatRealtime() {
  const { connectionId, subscribeRoom, unsubscribeRoom, onMessage } = useChat()
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

  // NOTE: 재연결 catch-up — 소켓이 끊긴 동안 relay된 메시지는 유실되므로(WS는 재생이 없음), 재연결
  //       (connectionId>1)마다 chat 쿼리를 모두 무효화해 활성 화면(목록·열린 방·답장방)이 놓친
  //       구간을 다시 가져오게 한다. 최초 연결(=1)은 마운트 시 초기 fetch가 이미 커버하므로 건너뜀.
  useEffect(() => {
    if (connectionId <= 1) {
      return
    }
    queryClient.invalidateQueries({ queryKey: ['chat'] })
  }, [connectionId, queryClient])

  return null
}
