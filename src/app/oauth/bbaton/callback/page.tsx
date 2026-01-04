'use client'

import { useMutation } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'

import { env } from '@/env/client'
import { fetchWithErrorHandling, ProblemDetailsError } from '@/utils/react-query-error'

const { NEXT_PUBLIC_BACKEND_URL } = env

type CallbackState = { type: 'error'; message: string } | { type: 'loading' } | { type: 'success' }

export default function BBatonCallbackPage() {
  const [state, setState] = useState<CallbackState>({ type: 'loading' })
  const didRunRef = useRef(false)

  const completeMutation = useMutation<void, unknown, { code: string }>({
    mutationFn: async ({ code }) => {
      const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/bbaton/complete`

      await fetchWithErrorHandling<void>(url, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
    },
    onSuccess: () => {
      setState({ type: 'success' })
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
    const error = params.get('error') ?? params.get('error_description')

    if (window.location.search) {
      window.history.replaceState(null, '', window.location.pathname)
    }

    if (!code) {
      const message = error
        ? '인증을 완료하지 못했어요. 다시 시도해 주세요.'
        : '인증 코드를 찾을 수 없어요. 다시 시도해 주세요.'

      setState({ type: 'error', message })
      return
    }

    completeMutation.mutate({ code })
  }, [completeMutation])

  return (
    <main className="min-h-dvh grid place-items-center p-6 bg-zinc-950 text-zinc-100">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5 space-y-3">
        <div className="text-lg font-semibold">성인 인증</div>

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
    if (error.status === 409) {
      return `${error.message} 기존 계정에서 연동을 해제한 뒤 다시 시도해 주세요.`
    }
    return error.message
  }

  if (error instanceof Error) {
    if (!navigator.onLine) {
      return '네트워크 연결을 확인해 주세요.'
    }
  }

  return '인증에 실패했어요. 원래 화면에서 다시 시도해 주세요.'
}
