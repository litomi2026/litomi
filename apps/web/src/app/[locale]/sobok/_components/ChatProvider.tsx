'use client'

import type { ChatRelayMessageDTO } from '@litomi/contracts'
import { createContext, type ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { getChatWebSocketURL } from '../_lib/chat'

type ServerMessage =
  | { t: 'ready'; userId: number }
  | { t: 'sub:ok'; room: string }
  | { t: 'unsub:ok'; room: string }
  | { t: 'msg'; room: string; data: ChatRelayMessageDTO }
  | { t: 'pong' }
  | { t: 'err'; code: string; message: string }
  | { t: 'reconnect' }

type RealtimeListener = (room: string, message: ChatRelayMessageDTO) => void

type ChatContextType = {
  myUserId: number | null
  isConnected: boolean
  connectionId: number
  subscribeRoom: (room: string) => void
  unsubscribeRoom: (room: string) => void
  onMessage: (listener: RealtimeListener) => () => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

const HEARTBEAT_INTERVAL_MS = 25_000
const STALE_AFTER_MS = 55_000
const MAX_BACKOFF_MS = 30_000

export default function ChatProvider({ children }: { children: ReactNode }) {
  const [myUserId, setMyUserId] = useState<number | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionId, setConnectionId] = useState(0)

  const wsRef = useRef<WebSocket | null>(null)
  const roomCountsRef = useRef<Map<string, number>>(new Map())
  const listenersRef = useRef<Set<RealtimeListener>>(new Set())
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const attemptRef = useRef(0)
  const lastActivityRef = useRef(Date.now())
  const unmountedRef = useRef(false)

  const value = {
    myUserId,
    isConnected,
    connectionId,
    subscribeRoom,
    unsubscribeRoom,
    onMessage,
  }

  const stopHeartbeat = useCallback(() => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current)
      heartbeatTimerRef.current = null
    }
  }, [])

  const connect = useCallback(() => {
    if (unmountedRef.current) {
      return
    }

    const existing = wsRef.current
    if (existing && (existing.readyState === WebSocket.CONNECTING || existing.readyState === WebSocket.OPEN)) {
      return
    }

    // new WebSocket()은 동기적으로 던질 수 있다. (HTTPS 페이지의 ws:// mixed-content로 인한 SecurityError, CSP connect-src 위반, WeChat 등 인앱웹뷰 제약)
    let ws: WebSocket
    try {
      ws = new WebSocket(getChatWebSocketURL())
    } catch (error) {
      console.error('chat WebSocket 연결 실패:', error)
      scheduleReconnect()
      return
    }

    wsRef.current = ws

    ws.onopen = () => {
      attemptRef.current = 0
      lastActivityRef.current = Date.now()
      setIsConnected(true)
      setConnectionId((id) => id + 1)

      for (const room of roomCountsRef.current.keys()) {
        ws.send(JSON.stringify({ t: 'sub', room }))
      }

      stopHeartbeat()

      heartbeatTimerRef.current = setInterval(() => {
        if (Date.now() - lastActivityRef.current > STALE_AFTER_MS) {
          ws.close()
          return
        }

        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ t: 'ping' }))
        }
      }, HEARTBEAT_INTERVAL_MS)
    }

    ws.onmessage = (event) => {
      lastActivityRef.current = Date.now()

      let msg: ServerMessage
      try {
        msg = JSON.parse(event.data) as ServerMessage
      } catch {
        return
      }

      if (msg.t === 'ready') {
        setMyUserId(msg.userId)
      } else if (msg.t === 'msg') {
        for (const listener of listenersRef.current) {
          listener(msg.room, msg.data)
        }
      } else if (msg.t === 'reconnect') {
        ws.close()
      }
    }

    ws.onerror = () => ws.close()
    ws.onclose = () => scheduleReconnect()
  }, [stopHeartbeat])

  function send(data: unknown) {
    const ws = wsRef.current
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data))
    }
  }

  function subscribeRoom(room: string) {
    const counts = roomCountsRef.current
    const next = (counts.get(room) ?? 0) + 1
    counts.set(room, next)

    if (next === 1) {
      send({ t: 'sub', room })
    }
  }

  function unsubscribeRoom(room: string) {
    const counts = roomCountsRef.current
    const current = counts.get(room)

    if (!current) {
      return
    }

    if (current <= 1) {
      counts.delete(room)
      send({ t: 'unsub', room })
    } else {
      counts.set(room, current - 1)
    }
  }

  function onMessage(listener: RealtimeListener) {
    listenersRef.current.add(listener)
    return () => {
      listenersRef.current.delete(listener)
    }
  }

  function scheduleReconnect() {
    if (unmountedRef.current) {
      return
    }

    stopHeartbeat()
    setIsConnected(false)
    setMyUserId(null)

    const delay = Math.min(MAX_BACKOFF_MS, 1000 * 2 ** attemptRef.current) + Math.random() * 1000
    attemptRef.current += 1
    reconnectTimerRef.current = setTimeout(connect, delay)
  }

  // NOTE: WebSocket 기본 라이프사이클 관리 (Mount/Unmount)
  useEffect(() => {
    unmountedRef.current = false
    connect()

    return () => {
      unmountedRef.current = true
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
      }

      stopHeartbeat()

      const ws = wsRef.current
      if (ws) {
        ws.onclose = null
        ws.close()
      }
    }
  }, [connect, stopHeartbeat])

  // NOTE: 모바일 브라우저 네트워크 & 화면 활성화 상태 감지
  useEffect(() => {
    function handleAwake() {
      attemptRef.current = 0
      const ws = wsRef.current

      if (ws && ws.readyState === WebSocket.OPEN) {
        if (Date.now() - lastActivityRef.current > STALE_AFTER_MS) {
          ws.close()
        } else {
          ws.send(JSON.stringify({ t: 'ping' }))
        }
      } else {
        if (reconnectTimerRef.current) {
          clearTimeout(reconnectTimerRef.current)
          reconnectTimerRef.current = null
        }
        connect()
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        handleAwake()
      }
    }

    window.addEventListener('online', handleAwake)
    window.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('online', handleAwake)
      window.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [connect])

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat() {
  const context = useContext(ChatContext)

  if (!context) {
    throw new Error('useChat must be used within a ChatProvider')
  }

  return context
}
