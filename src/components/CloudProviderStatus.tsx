'use client'

import ms from 'ms'
import { useEffect, useState } from 'react'

import { env } from '@/env/client'

type ServiceStatus = 'critical' | 'major' | 'minor' | 'none' | 'unknown'

interface StatusData {
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
  supabase: 'https://status.supabase.com/api/v2/status.json',
  vercel: 'https://www.vercel-status.com/api/v2/status.json',
  api: `${env.NEXT_PUBLIC_API_ORIGIN}/health`,
  litomi: '/api/health',
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
  onStatusUpdate?: (hasIssues: boolean) => void
}

export default function CloudProviderStatus({ onStatusUpdate }: CloudProviderStatusProps) {
  const [status, setStatus] = useState<StatusData>({
    api: 'unknown',
    litomi: 'unknown',
    supabase: 'unknown',
    vercel: 'unknown',
    lastChecked: null,
  })

  useEffect(() => {
    async function checkStatus() {
      try {
        const [supabaseRes, vercelRes, apiStatus, litomiStatus] = await Promise.all([
          fetch(STATUS_ENDPOINTS.supabase, { cache: 'no-store' })
            .then((res) => res.json() as Promise<StatusPageResponse>)
            .catch(() => null),
          fetch(STATUS_ENDPOINTS.vercel, { cache: 'no-store' })
            .then((res) => res.json() as Promise<StatusPageResponse>)
            .catch(() => null),
          fetch(STATUS_ENDPOINTS.api, { cache: 'no-store' })
            .then(async (res) => {
              if (!res.ok) return 'critical' as ServiceStatus
              const data = await res.json()
              return (data.status === 'ok' ? 'none' : 'major') as ServiceStatus
            })
            .catch(() => 'critical' as ServiceStatus),
          fetch(STATUS_ENDPOINTS.litomi, { cache: 'no-store' })
            .then((res) => (res.ok ? 'none' : 'critical') as ServiceStatus)
            .catch(() => 'critical' as ServiceStatus),
        ])

        setStatus({
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

  const hasIssues = [status.supabase, status.vercel, status.api, status.litomi].some(
    (s) => s === 'minor' || s === 'major' || s === 'critical',
  )

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
          <StatusDot status={status.supabase} />
          <StatusDot status={status.vercel} />
          <StatusDot status={status.api} />
          <StatusDot status={status.litomi} />
        </span>
        <span className="underline decoration-dotted underline-offset-4">시스템 상태 {hasIssues && '확인'}</span>
      </summary>
      <div className="mt-3 p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs space-y-2">
        <ServiceStatusRow name="외부 데이터베이스" status={status.supabase} />
        <ServiceStatusRow name="외부 서버 (Vercel)" status={status.vercel} />
        <ServiceStatusRow name="리토미 API 서버" status={status.api} />
        <ServiceStatusRow name="리토미 웹 서버" status={status.litomi} />
        {status.lastChecked && (
          <p className="text-zinc-500 text-center pt-1">
            마지막 확인: {status.lastChecked.toLocaleTimeString('ko-KR')}
          </p>
        )}
      </div>
    </details>
  )
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
