'use client'

import ms from 'ms'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type LockState = { kind: 'acquired' } | { kind: 'acquiring' } | { kind: 'blocked'; retry: () => void }

type Options = {
  channel: string
  title: string
}

type StoredLock = {
  ownerId: string
  updatedAtMs: number
}

const LOCK_TTL_MS = ms('10s')
const HEARTBEAT_MS = ms('2s')

export function useSingleTabLock({ channel, title }: Options): LockState {
  const [state, setState] = useState<LockState>({ kind: 'acquiring' })
  const ownerId = useMemo(() => crypto.randomUUID(), [])

  const channelKey = useMemo(() => storageKey(channel), [channel])
  const isOwnerRef = useRef(false)
  const tryAcquireRef = useRef<() => void>(() => {})

  const retry = useCallback(() => {
    tryAcquireRef.current()
  }, [])

  const tryAcquire = useCallback(() => {
    const nowMs = Date.now()
    const current = parseLock(localStorage.getItem(channelKey))

    if (current && !isExpired(current, nowMs) && current.ownerId !== ownerId) {
      isOwnerRef.current = false
      setState({ kind: 'blocked', retry })
      return
    }

    const next: StoredLock = { ownerId, updatedAtMs: nowMs }
    localStorage.setItem(channelKey, JSON.stringify(next))

    const confirmed = parseLock(localStorage.getItem(channelKey))
    if (confirmed?.ownerId === ownerId) {
      isOwnerRef.current = true
      setState({ kind: 'acquired' })
      return
    }

    isOwnerRef.current = false
    setState({ kind: 'blocked', retry })
  }, [channelKey, ownerId, retry])

  useEffect(() => {
    tryAcquireRef.current = tryAcquire
  }, [tryAcquire])

  useEffect(() => {
    tryAcquire()
  }, [tryAcquire])

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== channelKey) {
        return
      }

      if (!isOwnerRef.current) {
        tryAcquire()
      }
    }

    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [channelKey, tryAcquire])

  useEffect(() => {
    if (!isOwnerRef.current) {
      return
    }

    const intervalId = setInterval(() => {
      const nowMs = Date.now()
      localStorage.setItem(channelKey, JSON.stringify({ ownerId, updatedAtMs: nowMs }))
    }, HEARTBEAT_MS)

    function release() {
      const current = parseLock(localStorage.getItem(channelKey))
      if (current?.ownerId === ownerId) {
        localStorage.removeItem(channelKey)
      }
    }

    window.addEventListener('pagehide', release)
    window.addEventListener('beforeunload', release)

    return () => {
      clearInterval(intervalId)
      window.removeEventListener('pagehide', release)
      window.removeEventListener('beforeunload', release)
      release()
    }
  }, [channelKey, ownerId, title])

  return state
}

function isExpired(lock: StoredLock, nowMs: number) {
  return nowMs - lock.updatedAtMs > LOCK_TTL_MS
}

function parseLock(raw: string | null): StoredLock | null {
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    if (!('ownerId' in parsed) || !('updatedAtMs' in parsed)) return null
    const ownerId = (parsed as { ownerId: unknown }).ownerId
    const updatedAtMs = (parsed as { updatedAtMs: unknown }).updatedAtMs
    if (typeof ownerId !== 'string' || ownerId.length === 0) return null
    if (typeof updatedAtMs !== 'number' || !Number.isFinite(updatedAtMs) || updatedAtMs <= 0) return null
    return { ownerId, updatedAtMs }
  } catch {
    return null
  }
}

function storageKey(channel: string) {
  return `litomi:lock:${channel}`
}
