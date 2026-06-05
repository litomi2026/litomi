'use client'

import { DEFAULT_LOCALE, LOCALE_LANGUAGE_TAGS } from '@litomi/domain/locale'
import ms from 'ms'
import { useEffect, useState } from 'react'

type ServiceStatus = 'critical' | 'major' | 'minor' | 'none' | 'unknown'

interface StatusData {
  aiven: ServiceStatus
  api: ServiceStatus
  lastChecked: Date | null
  litomi: ServiceStatus
  supabase: ServiceStatus
  vercel: ServiceStatus
}

type StatusPageResponse = {
  status?: {
    indicator?: string
    description?: string
  }
}

function toServiceStatus(indicator: string | undefined): ServiceStatus {
  switch (indicator) {
    case 'critical':
      return 'critical'
    case 'major':
      return 'major'
    case 'minor':
      return 'minor'
    case 'none':
      return 'none'
    default:
      return 'unknown'
  }
}

const STATUS_ENDPOINTS = {
  aiven: 'https://status.aiven.io/api/v2/status.json',
  supabase: 'https://status.supabase.com/api/v2/status.json',
  vercel: 'https://www.vercel-status.com/api/v2/status.json',
  api: '/api/health',
  litomi: '/health',
}

const STATUS_COLORS: Record<ServiceStatus, string> = {
  none: 'bg-green-500',
  minor: 'bg-yellow-500',
  major: 'bg-orange-500',
  critical: 'bg-red-500',
  unknown: 'bg-zinc-500',
}

const STATUS_LABELS: Record<ServiceStatus, string> = {
  none: '정상',
  minor: '주의',
  major: '부분 장애',
  critical: '시스템 장애',
  unknown: '확인 중',
}

interface CloudProviderStatusProps {
  locale?: string | null
  onStatusUpdate?: (hasIssues: boolean) => void
}

export default function CloudProviderStatus({ locale, onStatusUpdate }: CloudProviderStatusProps) {
  const languageTag = getLanguageTag(locale)

  const [status, setStatus] = useState<StatusData>({
    aiven: 'unknown',
    api: 'unknown',
    litomi: 'unknown',
    supabase: 'unknown',
    vercel: 'unknown',
    lastChecked: null,
  })

  const hasIssues = [status.supabase, status.vercel, status.api, status.litomi].some(
    (s) => s === 'minor' || s === 'major' || s === 'critical',
  )

  useEffect(() => {
    async function checkStatus() {
      try {
        const [supabaseRes, vercelRes, apiStatus, litomiStatus, aivenRes] = await Promise.all([
          fetch(STATUS_ENDPOINTS.supabase, { cache: 'no-store' })
            .then((res) => res.json() as Promise<StatusPageResponse>)
            .catch(() => null),
          fetch(STATUS_ENDPOINTS.vercel, { cache: 'no-store' })
            .then((res) => res.json() as Promise<StatusPageResponse>)
            .catch(() => null),
          fetch(STATUS_ENDPOINTS.api, { cache: 'no-store' })
            .then((res) => (res.ok ? 'none' : 'critical') as ServiceStatus)
            .catch(() => 'critical' as ServiceStatus),
          fetch(STATUS_ENDPOINTS.litomi, { cache: 'no-store' })
            .then((res) => (res.ok ? 'none' : 'critical') as ServiceStatus)
            .catch(() => 'critical' as ServiceStatus),
          fetch(STATUS_ENDPOINTS.aiven, { cache: 'no-store' })
            .then((res) => res.json() as Promise<StatusPageResponse>)
            .catch(() => null),
        ])

        setStatus({
          aiven: toServiceStatus(aivenRes?.status?.indicator),
          api: apiStatus,
          litomi: litomiStatus,
          supabase: toServiceStatus(supabaseRes?.status?.indicator),
          vercel: toServiceStatus(vercelRes?.status?.indicator),
          lastChecked: new Date(),
        })
      } catch (error) {
        console.error('Failed to fetch status:', error)
      }
    }

    checkStatus()
    const interval = setInterval(checkStatus, ms('30 seconds'))

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (onStatusUpdate && status.lastChecked) {
      onStatusUpdate(hasIssues)
    }
  }, [hasIssues, onStatusUpdate, status.lastChecked])

  if (!hasIssues) {
    return null
  }

  return (
    <details className="my-4 text-sm">
      <summary className="flex items-center gap-2 cursor-pointer w-fit mx-auto text-zinc-400 hover:text-zinc-300 transition">
        <span className="flex items-center gap-1">
          <StatusDot status={status.aiven} />
          <StatusDot status={status.supabase} />
          <StatusDot status={status.vercel} />
          <StatusDot status={status.api} />
          <StatusDot status={status.litomi} />
        </span>
        <span className="underline decoration-dotted underline-offset-4">시스템 상태 {hasIssues && '확인'}</span>
      </summary>
      <div className="mt-3 p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs space-y-2">
        <ServiceStatusRow name="외부 데이터베이스" status={status.aiven} />
        <ServiceStatusRow name="외부 데이터베이스" status={status.supabase} />
        <ServiceStatusRow name="외부 서버 (Vercel)" status={status.vercel} />
        <ServiceStatusRow name="리토미 API 서버" status={status.api} />
        <ServiceStatusRow name="리토미 웹 서버" status={status.litomi} />
        {status.lastChecked && (
          <p className="text-zinc-500 text-center pt-1">
            마지막 확인: {status.lastChecked.toLocaleTimeString(languageTag)}
          </p>
        )}
      </div>
    </details>
  )
}

function getLanguageTag(locale: string | null | undefined) {
  if (locale && locale in LOCALE_LANGUAGE_TAGS) {
    return LOCALE_LANGUAGE_TAGS[locale as keyof typeof LOCALE_LANGUAGE_TAGS]
  }

  return LOCALE_LANGUAGE_TAGS[DEFAULT_LOCALE]
}

function ServiceStatusRow({ name, status }: { name: string; status: ServiceStatus }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-zinc-300">{name}</span>
      <span className="flex items-center gap-1.5">
        <StatusDot status={status} />
        <span className="text-zinc-400">{STATUS_LABELS[status] ?? '알 수 없음'}</span>
      </span>
    </div>
  )
}

function StatusDot({ status }: { status: ServiceStatus }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block w-2 h-2 rounded-full ${STATUS_COLORS[status] ?? 'bg-amber-500'}`}
    />
  )
}
