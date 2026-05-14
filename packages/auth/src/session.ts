import { env } from '@litomi/env/env/server.common'
import 'server-only'
import { sec } from '@litomi/std'
import crypto from 'crypto'
import { userAgent as parseUserAgent } from 'next/server'

const { JWT_SECRET_REFRESH_TOKEN } = env

export const REFRESH_SESSION_ABSOLUTE_TTL_SECONDS = sec('60 days')
export const REFRESH_SESSION_IDLE_TTL_SECONDS = sec('14 days')
export const REFRESH_SESSION_REUSE_GRACE_SECONDS = sec('1 minute')
export const SESSION_DEVICE_LABEL_MAX_LENGTH = 128

export function addSeconds(date: Date, seconds: number) {
  return new Date(date.getTime() + seconds * 1000)
}

export function buildSessionDeviceLabel(rawUserAgent: string | null | undefined) {
  if (!rawUserAgent || rawUserAgent === 'unknown') {
    return null
  }

  const agent = parseUserAgent({ headers: new Headers({ 'user-agent': rawUserAgent }) })
  const browser = agent.browser.name || '일반 브라우저'
  const os = normalizeSessionOSName(agent.os.name)
  const device = normalizeSessionDeviceType(agent.device.type)

  return [browser, os, device].filter(Boolean).join(' ').trim().slice(0, SESSION_DEVICE_LABEL_MAX_LENGTH)
}

export function generateSessionToken({ familyId, tokenId }: { familyId: string; tokenId: string }) {
  return crypto.createHmac('sha256', JWT_SECRET_REFRESH_TOKEN).update(`${familyId}:${tokenId}`).digest('base64url')
}

export function getRemainingSeconds(expiresAt: Date, now: Date) {
  return Math.max(1, Math.ceil((expiresAt.getTime() - now.getTime()) / 1000))
}

export function hashSessionToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('base64url')
}

export function minDate(a: Date, b: Date) {
  return a.getTime() <= b.getTime() ? a : b
}

export function truncateSessionMetadata(value: string | null | undefined, maxLength: number) {
  if (!value) {
    return null
  }

  return value.slice(0, maxLength)
}

function normalizeSessionDeviceType(type: string | undefined) {
  if (type === 'mobile') {
    return '모바일'
  }

  if (type === 'tablet') {
    return '태블릿'
  }

  return '데스크톱'
}

function normalizeSessionOSName(name: string | undefined) {
  if (!name) {
    return ''
  }

  if (name === 'Mac OS') {
    return 'macOS'
  }

  return name
}
