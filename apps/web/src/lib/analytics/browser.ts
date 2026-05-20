'use client'

import { env } from '@litomi/env/client'
import { sendGTMEvent } from '@next/third-parties/google'

export type AnalyticsParams = Record<string, AnalyticsValue | undefined>

type AnalyticsObject = {
  readonly [key: string]: AnalyticsPrimitive | undefined
}

type AnalyticsPrimitive = boolean | number | string | null
type AnalyticsValue = AnalyticsPrimitive | Date | readonly (AnalyticsObject | AnalyticsPrimitive)[]

const { NEXT_PUBLIC_GTM_ID, NEXT_PUBLIC_GTM_SCRIPT_URL } = env

export function identify(userId: number | string | null) {
  if (!isGoogleTagManagerEnabled()) {
    return
  }

  sendGTMEvent({
    event: 'auth_identify',
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

function normalizeParams(params?: AnalyticsParams): Record<string, unknown> | undefined {
  if (!params) {
    return
  }

  let normalizedParams: Record<string, unknown> | undefined

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) {
      continue
    }

    normalizedParams ??= {}

    if (value instanceof Date) {
      normalizedParams[key] = value.toISOString()
      continue
    }

    normalizedParams[key] = value
  }

  return normalizedParams
}
