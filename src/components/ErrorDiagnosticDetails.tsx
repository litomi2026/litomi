'use client'

import { useState } from 'react'

import { env } from '@/env/client'

type Props = Readonly<{
  digest?: string
  errorMessage?: string
  pathname?: string | null
}>

export default function ErrorDiagnosticDetails({ digest, errorMessage, pathname }: Props) {
  const [capturedAt] = useState(() => new Date())
  const commitSHA = env.NEXT_PUBLIC_COMMIT_SHA || 'local'
  const environment = env.NEXT_PUBLIC_APP_ENV || 'development'

  return (
    <div className="mt-4 space-y-3">
      {/Failed to find Server Action/i.test(errorMessage || '') && (
        <div className="mx-auto max-w-prose rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-left text-xs text-amber-100">
          <p className="font-medium text-amber-200">배포 버전이 바뀌는 중일 수 있어요.</p>
          <p className="mt-1 text-amber-50/90">
            이전 페이지와 새 서버가 섞여서 Server Action 을 찾지 못할 때 주로 발생합니다. 최신 배포로 새로고침한 뒤 다시
            시도해주세요.
          </p>
          <button
            className="mt-3 rounded-full border border-amber-300/30 px-3 py-1.5 text-xs font-medium text-amber-50 transition hover:bg-amber-200/10"
            onClick={() => window.location.reload()}
          >
            최신 버전으로 새로고침
          </button>
        </div>
      )}

      <details className="mx-auto max-w-prose rounded-lg border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-left text-xs text-zinc-300">
        <summary className="cursor-pointer list-none font-medium text-zinc-200">진단 정보</summary>
        <div className="mt-3 grid gap-1.5">
          <DiagnosticRow label="환경" value={environment} />
          <DiagnosticRow label="커밋" value={commitSHA} />
          {pathname && <DiagnosticRow label="경로" value={pathname} />}
          {digest && <DiagnosticRow label="오류 코드" value={digest} />}
          <DiagnosticRow label="발생 시각" value={capturedAt.toLocaleString('ko-KR')} />
        </div>
      </details>
    </div>
  )
}

function DiagnosticRow({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-zinc-900 pb-1 last:border-b-0 last:pb-0">
      <span className="shrink-0 text-zinc-500">{label}</span>
      <span className="break-all text-right text-zinc-200">{value}</span>
    </div>
  )
}
