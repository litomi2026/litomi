import { Download } from 'lucide-react'

export type InstallState =
  | { kind: 'error'; message: string }
  | { kind: 'installed' }
  | { kind: 'installing'; progress: { text: string; progress: number; timeElapsed: number } }
  | { kind: 'not-installed' }
  | { kind: 'unknown' }

interface InstallStateRendererProps {
  installState: InstallState
  onInstall: () => void
  onRefreshInstallState: () => void
}

export function ModelStatus({ installState, onInstall, onRefreshInstallState }: InstallStateRendererProps) {
  if (installState.kind === 'unknown') {
    return <p className="text-sm text-zinc-500">모델 상태를 확인하고 있어요…</p>
  }

  if (installState.kind === 'not-installed') {
    return (
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-400">처음 한 번만 내려받으면 돼요</p>
        <button
          className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-zinc-100 text-zinc-900 hover:bg-white transition"
          onClick={onInstall}
          type="button"
        >
          <Download className="size-4" />
          설치하기
        </button>
      </div>
    )
  }

  if (installState.kind === 'installing') {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-zinc-400 tabular-nums">{installState.progress.text}</p>
        <div className="h-2 rounded-full bg-white/7 overflow-hidden">
          <div
            className="h-2 bg-brand transition-[width] duration-200"
            style={{ width: `${installState.progress.progress * 100}%` }}
          />
        </div>
        <p className="text-xs text-zinc-500 tabular-nums">
          {(installState.progress.progress * 100).toFixed(1)}% · {Math.round(installState.progress.timeElapsed)}초
        </p>
      </div>
    )
  }

  if (installState.kind === 'error') {
    return (
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-red-300">{installState.message}</p>
        <button
          className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-white/7 hover:border-white/15 transition"
          onClick={onRefreshInstallState}
          type="button"
        >
          다시 확인
        </button>
      </div>
    )
  }

  return null
}
