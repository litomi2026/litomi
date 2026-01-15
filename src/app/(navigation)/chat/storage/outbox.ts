'use client'

import ms from 'ms'
import { useCallback, useEffect, useRef } from 'react'

import type { ProblemDetailsError } from '@/utils/react-query-error'

import { fetchWithErrorHandling, ProblemDetailsError as ProblemDetailsErrorClass } from '@/utils/react-query-error'

import {
  deleteOutboxItem,
  getAllOutboxItems,
  getSessionMap,
  type OutboxItem,
  setSessionMap,
  upsertOutboxItem,
} from './indexeddb'

const BASE_DELAY_MS = ms('2s')
const MAX_DELAY_MS = ms('5m')
const FLUSH_INTERVAL_MS = ms('15s')

type EnqueueMessagesOptions = {
  clientSessionId: string
  messages: {
    clientMessageId: string
    role: 'assistant' | 'user'
    content: string
  }[]
}

type EnqueueSessionOptions = {
  clientSessionId: string
  characterId: string
  characterName?: string
  title?: string
  systemPrompt: string
  modelId: string
}

type FlushOptions = {
  backendUrl: string
}

type ProcessResult = 'continue' | 'pause'

export async function enqueueAppendMessages(options: EnqueueMessagesOptions) {
  const nowMs = Date.now()
  const id = `appendMessages:${options.clientSessionId}:${crypto.randomUUID()}`

  const item: OutboxItem = {
    id,
    kind: 'appendMessages',
    status: 'pending',
    createdAtMs: nowMs,
    attempt: 0,
    nextAttemptAtMs: nowMs,
    payload: options,
  }

  await upsertOutboxItem(item)
}

export async function enqueueCreateSession(options: EnqueueSessionOptions) {
  const nowMs = Date.now()
  const id = `createSession:${options.clientSessionId}`

  const item: OutboxItem = {
    id,
    kind: 'createSession',
    status: 'pending',
    createdAtMs: nowMs,
    attempt: 0,
    nextAttemptAtMs: nowMs,
    payload: options,
  }

  await upsertOutboxItem(item)
}

export async function flushOutbox({ backendUrl }: FlushOptions) {
  const nowMs = Date.now()
  const items = (await getAllOutboxItems())
    .filter((i) => i.status === 'pending' && i.nextAttemptAtMs <= nowMs)
    .sort((a, b) => a.createdAtMs - b.createdAtMs)

  for (const item of items) {
    // NOTE: 한 번에 하나씩 처리(순서/자원 관리)
    const result = await processItem(item, { backendUrl })
    if (result === 'pause') {
      return { paused: true }
    }
  }

  return { paused: false }
}

export function useOutboxAutoFlush(options: { backendUrl: string; onUnauthorized?: () => void }) {
  const { backendUrl, onUnauthorized } = options
  const isFlushingRef = useRef(false)

  const flush = useCallback(async () => {
    if (isFlushingRef.current) {
      return
    }

    isFlushingRef.current = true
    try {
      const result = await flushOutbox({ backendUrl })
      if (result.paused) {
        onUnauthorized?.()
      }
    } finally {
      isFlushingRef.current = false
    }
  }, [backendUrl, onUnauthorized])

  useEffect(() => {
    const intervalId = setInterval(() => {
      flush()
    }, FLUSH_INTERVAL_MS)

    function handleOnline() {
      flush()
    }

    window.addEventListener('online', handleOnline)

    // initial
    flush()

    return () => {
      clearInterval(intervalId)
      window.removeEventListener('online', handleOnline)
    }
  }, [flush])

  return { flush }
}

async function handleOutboxError(item: OutboxItem, error: unknown): Promise<ProcessResult> {
  if (error instanceof ProblemDetailsErrorClass) {
    if (error.status === 401) {
      // 로그인 후 재개
      return 'pause'
    }

    if (error.status === 429) {
      await reschedule(item, error)
      return 'continue'
    }

    if (error.status === 403) {
      await markFailed(item, error.message || '권한이 없어요')
      return 'continue'
    }

    if (error.status >= 400 && error.status < 500) {
      await markFailed(item, error.message || '저장에 실패했어요')
      return 'continue'
    }

    if (error.status >= 500) {
      await reschedule(item, error)
      return 'continue'
    }
  }

  // 네트워크/기타 오류는 재시도
  await reschedule(item, null)
  return 'continue'
}

async function markFailed(item: OutboxItem, message: string) {
  await upsertOutboxItem({
    ...item,
    status: 'failed',
    lastError: message,
  })
}

async function processAppendMessages(
  item: Extract<OutboxItem, { kind: 'appendMessages' }>,
  { backendUrl }: FlushOptions,
) {
  const map = await getSessionMap(item.payload.clientSessionId)
  if (!map) {
    // 세션이 먼저 만들어져야 해서 대기
    return 'continue'
  }

  try {
    const url = `${backendUrl}/api/v1/character-chat/sessions/${map.serverSessionId}/messages`

    await fetchWithErrorHandling<{ ok: true }>(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ messages: item.payload.messages }),
    })

    await deleteOutboxItem(item.id)
    return 'continue'
  } catch (error) {
    return await handleOutboxError(item, error)
  }
}

async function processCreateSession(
  item: Extract<OutboxItem, { kind: 'createSession' }>,
  { backendUrl }: FlushOptions,
) {
  try {
    const url = `${backendUrl}/api/v1/character-chat/sessions`

    const { data } = await fetchWithErrorHandling<{ id: number }>(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(item.payload),
    })

    await setSessionMap({
      clientSessionId: item.payload.clientSessionId,
      serverSessionId: data.id,
      updatedAtMs: Date.now(),
    })

    await deleteOutboxItem(item.id)
    return 'continue'
  } catch (error) {
    return await handleOutboxError(item, error)
  }
}

async function processItem(item: OutboxItem, { backendUrl }: FlushOptions): Promise<ProcessResult> {
  if (item.kind === 'createSession') {
    return await processCreateSession(item, { backendUrl })
  }

  return await processAppendMessages(item, { backendUrl })
}

async function reschedule(item: OutboxItem, error: ProblemDetailsError | null) {
  const attempt = item.attempt + 1

  const retryAfterSeconds = error?.retryAfterSeconds
  const retryAfterMs = retryAfterSeconds ? retryAfterSeconds * ms('1s') : null

  const exp = Math.min(BASE_DELAY_MS * 2 ** item.attempt, MAX_DELAY_MS)
  const jittered = exp * (0.75 + Math.random() * 0.5)
  const delayMs = retryAfterMs ?? jittered

  await upsertOutboxItem({
    ...item,
    attempt,
    nextAttemptAtMs: Date.now() + delayMs,
    lastError: error ? error.message : item.lastError,
  })
}
