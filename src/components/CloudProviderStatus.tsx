'use client'

import ms from 'ms'
import { useEffect, useState } from 'react'

type ServiceStatus = 'degraded' | 'down' | 'none' | 'unknown'

interface StatusData {
  lastChecked: Date | null
  supabase: ServiceStatus
  vercel: ServiceStatus
}

type StatusPageResponse = {
  status?: {
    indicator?: string
  }
}

function getStatusPageIndicator(data: unknown): string | undefined {
  if (typeof data !== 'object' || data === null) return undefined
  if (!('status' in data)) return undefined
  const status = (data as { status?: unknown }).status
  if (typeof status !== 'object' || status === null) return undefined
  if (!('indicator' in status)) return undefined
  const indicator = (status as { indicator?: unknown }).indicator
  return typeof indicator === 'string' ? indicator : undefined
}

function toServiceStatus(indicator: string | undefined): ServiceStatus {
  // statuspage.io style: none | minor | major | critical
  if (indicator === 'none') return 'none'
  if (indicator === 'minor' || indicator === 'major') return 'degraded'
  if (indicator === 'critical') return 'down'
  return 'unknown'
}

const STATUS_ENDPOINTS = {
  supabase: 'https://status.supabase.com/api/v2/status.json',
  vercel: 'https://www.vercel-status.com/api/v2/status.json',
}

const STATUS_COLORS: Record<ServiceStatus, string> = {
  none: 'bg-green-500',
  degraded: 'bg-yellow-500',
  down: 'bg-red-500',
  unknown: 'bg-zinc-500',
}

const STATUS_LABELS: Record<ServiceStatus, string> = {
  none: '정상',
  degraded: '일부 장애',
  down: '장애',
  unknown: '확인 중',
}

interface CloudProviderStatusProps {
  onStatusUpdate?: (hasIssues: boolean) => void
}

export default function CloudProviderStatus({ onStatusUpdate }: CloudProviderStatusProps) {
  const [status, setStatus] = useState<StatusData>({
    supabase: 'unknown',
    vercel: 'unknown',
    lastChecked: null,
  })

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const [supabaseRes, vercelRes] = await Promise.all([
          fetch(STATUS_ENDPOINTS.supabase, { cache: 'no-store' })
            .then((res) => res.json() as Promise<StatusPageResponse>)
            .catch(() => null),
          fetch(STATUS_ENDPOINTS.vercel, { cache: 'no-store' })
            .then((res) => res.json() as Promise<StatusPageResponse>)
            .catch(() => null),
        ])

        const supabaseIndicator = getStatusPageIndicator(supabaseRes)
        const vercelIndicator = getStatusPageIndicator(vercelRes)

        setStatus({
          supabase: toServiceStatus(supabaseIndicator),
          vercel: toServiceStatus(vercelIndicator),
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

  const hasIssues =
    status.supabase === 'down' ||
    status.vercel === 'down' ||
    status.supabase === 'degraded' ||
    status.vercel === 'degraded'

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
        </span>
        <span className="underline decoration-dotted underline-offset-4">시스템 상태 {hasIssues && '확인'}</span>
      </summary>
      <div className="mt-3 p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs space-y-2">
        <ServiceStatusRow name="데이터베이스" status={status.supabase} />
        <ServiceStatusRow name="서버" status={status.vercel} />
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
