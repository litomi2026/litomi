import dayjs from 'dayjs'
import ms, { StringValue } from 'ms'

export function formatDistanceFromNow(date: Date): string {
  const nowMs = Date.now()
  const diffMs = date.getTime() - nowMs

  if (diffMs <= 0) {
    return ''
  }

  const SECOND_MS = ms('1s')
  const MINUTE_MS = ms('1m')
  const HOUR_MS = ms('1h')
  const DAY_MS = ms('1d')

  const seconds = Math.floor(diffMs / SECOND_MS)
  if (seconds <= 0) return ''
  if (seconds <= 60) return `${seconds}초`

  const minutes = Math.floor(diffMs / MINUTE_MS)
  if (minutes < 60) return `${minutes}분 남음`

  const hours = Math.floor(diffMs / HOUR_MS)
  if (hours < 24) return `${hours}시간 남음`

  const days = Math.floor(diffMs / DAY_MS)
  if (days < 7) return `${days}일 남음`
  if (days < 30) return `${Math.floor(days / 7)}주 남음`

  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

export function formatDistanceToNow(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  if (hours < 24) return `${hours}시간 전`
  if (days < 7) return `${days}일 전`
  if (days < 30) return `${Math.floor(days / 7)}주 전`
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

export function formatLocalDate(date: Date) {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function sec(text: StringValue): number {
  return ms(text) / 1000
}
