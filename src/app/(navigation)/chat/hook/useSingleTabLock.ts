'use client'

import ms from 'ms'
import { useEffect, useState } from 'react'

type LockKind = 'acquired' | 'acquiring' | 'blocked'
type LockState = { kind: 'acquired' } | { kind: 'acquiring' } | { kind: 'blocked'; retry: () => void }

type Options = {
  channel: string
}

type StoredLock = {
  ownerId: string
  updatedAtMs: number
}

const LOCK_TTL_MS = ms('10s')
const HEARTBEAT_MS = ms('2s')

export function useSingleTabLock({ channel }: Options): LockState {
  const [kind, setKind] = useState<LockKind>('acquiring')
  const [ownerId] = useState(() => crypto.randomUUID())

  const channelKey = storageKey(channel)

  useEffect(() => {
    setKind(tryAcquireLock({ channelKey, ownerId }))
  }, [channelKey, ownerId])

  function retry() {
    setKind(tryAcquireLock({ channelKey, ownerId }))
  }

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== channelKey) {
        return
      }

      if (kind !== 'acquired') {
        setKind(tryAcquireLock({ channelKey, ownerId }))
      }
    }

    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [channelKey, kind, ownerId])

  useEffect(() => {
    if (kind !== 'acquired') {
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
  }, [channelKey, kind, ownerId])

  if (kind === 'blocked') {
    return { kind: 'blocked', retry }
  }

  if (kind === 'acquired') {
    return { kind: 'acquired' }
  }

  return { kind: 'acquiring' }
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

function tryAcquireLock(options: { channelKey: string; ownerId: string }): LockKind {
  const { channelKey, ownerId } = options
  const nowMs = Date.now()
  const current = parseLock(localStorage.getItem(channelKey))

  if (current && !isExpired(current, nowMs) && current.ownerId !== ownerId) {
    return 'blocked'
  }

  const next: StoredLock = { ownerId, updatedAtMs: nowMs }
  localStorage.setItem(channelKey, JSON.stringify(next))

  const confirmed = parseLock(localStorage.getItem(channelKey))
  return confirmed?.ownerId === ownerId ? 'acquired' : 'blocked'
}
