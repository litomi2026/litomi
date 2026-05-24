'use client'

import { env } from '@litomi/env/client'
import { useState } from 'react'

type Props = {
  digest?: string
  pathname?: string | null
}

export default function ErrorDiagnosticDetails({ digest, pathname }: Props) {
  const [capturedAt] = useState(() => new Date())
  const commitSHA = env.NEXT_PUBLIC_COMMIT_SHA || 'local'
  const environment = env.NEXT_PUBLIC_APP_ENV || 'development'

  return (
    <div className="mt-4 space-y-3">
      <details
        className="mx-auto rounded-lg border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-left text-xs text-zinc-300"
        open
      >
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

function DiagnosticRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-zinc-900 pb-1 last:border-b-0 last:pb-0">
      <span className="shrink-0 text-zinc-500">{label}</span>
      <span className="break-all text-right text-zinc-200">{value}</span>
    </div>
  )
}
