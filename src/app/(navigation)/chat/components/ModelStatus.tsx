import { CheckCircle, Download, Loader2, TriangleAlert } from 'lucide-react'
import { ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'

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

type ModelStatusViewModel = {
  primaryText: string
  secondaryText: string
  actionText: string
  progress: number
  actionDisabled: boolean
  tone: 'error' | 'muted' | 'neutral'
  icon: ReactNode
}

export function ModelStatus({ installState, onInstall, onRefreshInstallState }: InstallStateRendererProps) {
  const isNotInstalled = installState.kind === 'not-installed'
  const isUnknown = installState.kind === 'unknown'
  const isError = installState.kind === 'error'

  const { actionDisabled, actionText, icon, primaryText, progress, secondaryText, tone } =
    getModelStatusViewModel(installState)

  return (
    <div className="flex items-center gap-3 px-1">
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <p
          className={twMerge(
            'min-w-0 text-sm tabular-nums truncate',
            tone === 'error' ? 'text-red-300' : tone === 'muted' ? 'text-zinc-500' : 'text-zinc-400',
          )}
        >
          {primaryText}
        </p>
        <div>
          <div className="h-2 rounded-full bg-white/7 overflow-hidden">
            <div
              className={twMerge(
                'h-2 transition-[width] duration-200',
                isUnknown ? 'bg-white/20 animate-pulse' : tone === 'error' ? 'bg-white/10' : 'bg-brand',
              )}
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
        <p className="text-xs text-zinc-500 tabular-nums truncate">{secondaryText}</p>
      </div>
      <button
        aria-disabled={actionDisabled}
        className={twMerge(
          'inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl transition aria-disabled:border-white/7 aria-disabled:text-zinc-500 aria-disabled:opacity-60 aria-disabled:cursor-default',
          isNotInstalled
            ? 'border-white bg-zinc-100 text-zinc-900 hover:bg-white'
            : 'border-white/7 hover:border-white/15 text-zinc-200',
        )}
        onClick={isNotInstalled ? onInstall : isError ? onRefreshInstallState : undefined}
        type="button"
      >
        {icon}
        {actionText}
      </button>
    </div>
  )
}

function getModelStatusViewModel(installState: InstallState): ModelStatusViewModel {
  switch (installState.kind) {
    case 'error':
      return {
        primaryText: installState.message,
        secondaryText: '다시 확인해 주세요',
        actionText: '오류',
        progress: 0,
        actionDisabled: false,
        tone: 'error',
        icon: <TriangleAlert className="size-4" />,
      }
    case 'installed':
      return {
        primaryText: '모델이 준비됐어요',
        secondaryText: '100%',
        actionText: '완료',
        progress: 1,
        actionDisabled: true,
        tone: 'muted',
        icon: <CheckCircle className="size-4" />,
      }
    case 'installing':
      return {
        primaryText: installState.progress.text,
        secondaryText: `${(installState.progress.progress * 100).toFixed(0)}% · ${Math.round(installState.progress.timeElapsed)}초`,
        actionText: '설치',
        progress: installState.progress.progress,
        actionDisabled: true,
        tone: 'neutral',
        icon: <Loader2 className="size-4 animate-spin" />,
      }
    case 'not-installed':
      return {
        primaryText: '처음 한 번만 내려받으면 돼요',
        secondaryText: '0%',
        actionText: '설치',
        progress: 0,
        actionDisabled: false,
        tone: 'neutral',
        icon: <Download className="size-4" />,
      }
    case 'unknown':
      return {
        primaryText: '모델 상태를 확인하고 있어요…',
        secondaryText: '...%',
        actionText: '확인',
        progress: 0,
        actionDisabled: true,
        tone: 'muted',
        icon: <Loader2 className="size-4 animate-spin" />,
      }
  }
}
