'use client'

import { sendGTMEvent } from '@next/third-parties/google'

import { env } from '@/env/client'

type AnalyticsParams = Record<string, AnalyticsValue | undefined>
type AnalyticsScalar = boolean | number | string | Date | null
type AnalyticsValue = AnalyticsScalar | AnalyticsScalar[]

const { NEXT_PUBLIC_GTM_ID, NEXT_PUBLIC_GTM_SCRIPT_URL } = env

export function identify(userId: number | string | null) {
  if (!isGoogleTagManagerEnabled()) {
    return
  }

  sendGTMEvent({
    user_id: userId === null ? null : String(userId),
  })
}

export function track(eventName: string, params?: AnalyticsParams) {
  if (!isGoogleTagManagerEnabled()) {
    return
  }

  sendGTMEvent({
    event: eventName,
    ...normalizeParams(params),
  })
}

function isGoogleTagManagerEnabled() {
  return Boolean(NEXT_PUBLIC_GTM_ID || NEXT_PUBLIC_GTM_SCRIPT_URL)
}

function normalizeParams(params?: AnalyticsParams) {
  if (!params) {
    return
  }

  const normalizedEntries = Object.entries(params).flatMap(([key, value]) => {
    if (value === undefined) {
      return []
    }

    if (Array.isArray(value)) {
      return [[key, value.map(normalizeScalar)]]
    }

    return [[key, normalizeScalar(value)]]
  })

  if (normalizedEntries.length === 0) {
    return
  }

  return Object.fromEntries(normalizedEntries)
}

function normalizeScalar(value: AnalyticsScalar) {
  if (value instanceof Date) {
    return value.toISOString()
  }

  return value
}
