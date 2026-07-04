'use client'
import { useMutation } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'

import { LocalStorageKey } from '@/storage'
import { fetchAPIData } from '@/utils/api-request'
import { ProblemDetailsError } from '@/utils/fetch-response'

type CallbackState = { type: 'error'; message: string } | { type: 'loading' } | { type: 'success' }

export default function BBatonCallbackPage() {
  const [state, setState] = useState<CallbackState>({ type: 'loading' })
  const didRunRef = useRef(false)

  const completeMutation = useMutation<void, unknown, { code: string; state: string }>({
    mutationFn: async ({ code, state }) => {
      await fetchAPIData<void>('/api/v1/bbaton/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, state }),
      })
    },
    onSuccess: () => {
      setState({ type: 'success' })

      try {
        localStorage.setItem(
          LocalStorageKey.BBATON_ADULT_VERIFICATION_SIGNAL,
          JSON.stringify({ type: 'complete', at: Date.now() }),
        )
      } catch {
        // ignore
      }

      window.close()
    },
    onError: (error) => {
      const message = getErrorMessage(error)
      setState({ type: 'error', message })
    },
  })

  useEffect(() => {
    if (didRunRef.current) {
      return
    }
    didRunRef.current = true

    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const oauthState = params.get('state')
    const error = params.get('error') ?? params.get('error_description')

    if (window.location.search) {
      window.history.replaceState(null, '', window.location.pathname)
    }

    if (!code || !oauthState) {
      const message = error
        ? '인증을 완료하지 못했어요. 다시 시도해 주세요.'
        : '인증 정보를 찾을 수 없어요. 다시 시도해 주세요.'

      setState({ type: 'error', message })
      return
    }

    completeMutation.mutate({ code, state: oauthState })
  }, [completeMutation])

  return (
    <main className="min-h-dvh grid place-items-center p-6 bg-zinc-950 text-zinc-100">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5 space-y-3">
        <div className="text-lg font-semibold">성인인증</div>

        {state.type === 'loading' && <p className="text-sm text-zinc-400">인증 결과를 확인하고 있어요…</p>}
        {state.type === 'success' && <p className="text-sm text-zinc-400">인증이 완료됐어요. 창이 자동으로 닫혀요.</p>}
        {state.type === 'error' && <p className="text-sm text-zinc-400">{state.message}</p>}

        <div className="pt-2">
          <button
            className="w-full inline-flex justify-center items-center rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm font-medium text-zinc-100 transition hover:bg-zinc-800 active:bg-zinc-900"
            onClick={() => window.close()}
            type="button"
          >
            창 닫기
          </button>
        </div>
      </div>
    </main>
  )
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ProblemDetailsError) {
    const summary = error.problem.detail ?? error.problem.title

    if (error.status === 409) {
      return `${summary} 기존 계정에서 연동을 해제한 뒤 다시 시도해 주세요.`
    }
    return summary
  }

  if (error instanceof Error) {
    if (!navigator.onLine) {
      return '네트워크 연결을 확인해 주세요.'
    }
  }

  return '인증에 실패했어요. 원래 화면에서 다시 시도해 주세요.'
}
