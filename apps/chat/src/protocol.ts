import { z } from 'zod'

// Per-connection state attached to each WebSocket via `server.upgrade({ data })`.
export interface SocketData {
  userId: number
  // Rooms this socket is subscribed to; used to release Valkey refcounts on close.
  rooms: Set<string>
  // Rate limiting state
  msgCount: number
  msgResetAt: number
}

export const ROOM_ID_MAX_LENGTH = 64
export const MAX_ROOMS_PER_SOCKET = 100

export const clientMessageSchema = z.discriminatedUnion('t', [
  z.object({
    t: z.literal('sub'),
    room: z.string().min(1).max(ROOM_ID_MAX_LENGTH),
  }),
  z.object({
    t: z.literal('unsub'),
    room: z.string().min(1).max(ROOM_ID_MAX_LENGTH),
  }),
  z.object({
    t: z.literal('ping'),
  }),
])

export type ClientMessage = z.infer<typeof clientMessageSchema>

export type ServerMessage =
  | { t: 'ready'; userId: number }
  | { t: 'sub:ok'; room: string }
  | { t: 'unsub:ok'; room: string }
  | { t: 'msg'; room: string; data: unknown }
  | { t: 'pong' }
  | { t: 'err'; code: string; message: string }
  | { t: 'reconnect' }

export function encode(message: ServerMessage): string {
  return JSON.stringify(message)
}

export function parseClientMessage(raw: string): ClientMessage | null {
  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    return null
  }

  const result = clientMessageSchema.safeParse(json)
  return result.success ? result.data : null
}

// In-process Bun topic that a socket subscribes to for a room's messages.
export function localTopic(roomId: string): string {
  return `room:${roomId}`
}
