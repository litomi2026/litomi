'use client'

import { useMutation } from '@tanstack/react-query'
import { ChevronDown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { FormEvent, useRef } from 'react'
import { toast } from 'sonner'

import { POSTV1BBatonUnlinkResponse } from '@/backend/api/v1/bbaton/unlink'
import { env } from '@/env/client'
import { fetchWithErrorHandling, ProblemDetailsError } from '@/utils/react-query-error'

import OneTimeCodeInput from '../two-factor/components/OneTimeCodeInput'

const { NEXT_PUBLIC_BACKEND_URL } = env

type Props = {
  isTwoFactorEnabled: boolean
}

export default function BBatonUnlinkSection({ isTwoFactorEnabled }: Props) {
  const router = useRouter()
  const unlinkFormRef = useRef<HTMLFormElement | null>(null)

  const unlinkMutation = useMutation<POSTV1BBatonUnlinkResponse, unknown, { password: string; token?: string }>({
    mutationFn: async ({ password, token }) => {
      const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/bbaton/unlink`

      const { data } = await fetchWithErrorHandling<POSTV1BBatonUnlinkResponse>(url, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, ...(token ? { token } : {}) }),
      })

      return data
    },
    onSuccess: () => {
      toast.success('연동이 해제됐어요')
      unlinkFormRef.current?.reset()
      router.refresh()
    },
    onError: (error) => {
      if (error instanceof ProblemDetailsError && error.status === 401) {
        router.refresh()
      }
    },
  })

  function handleUnlinkSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)
    const password = String(formData.get('password') ?? '')
    const token = formData.get('token')
    const tokenDigits = typeof token === 'string' ? token.replace(/[^0-9]/g, '') : ''
    const tokenValue = tokenDigits.length > 0 ? tokenDigits : undefined

    unlinkMutation.mutate({ password, token: tokenValue })
  }

  return (
    <div className="pt-2 border-t border-zinc-800/80">
      <details className="group">
        <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
          <div className="flex items-center justify-between gap-3 rounded-lg px-1.5 py-2 transition hover:bg-zinc-900/40 active:bg-zinc-900/60">
            <div className="text-sm font-medium text-red-300">연동 해제</div>
            <ChevronDown className="size-4 text-zinc-500 transition group-open:rotate-180" />
          </div>
        </summary>

        <div className="mt-2 rounded-xl border border-zinc-800 bg-zinc-900/20 p-4 space-y-3">
          <p className="text-sm text-zinc-400">
            연동을 해제하면 인증 정보가 삭제되고 <span className="text-zinc-300">미인증</span> 상태로 돌아가요. 성인
            콘텐츠 이용이 제한될 수 있어요.
          </p>

          <form className="grid gap-3" onSubmit={handleUnlinkSubmit} ref={unlinkFormRef}>
            <div className="grid gap-1.5">
              <label className="text-sm text-zinc-300" htmlFor="bbaton-unlink-password">
                현재 비밀번호
              </label>
              <input
                autoComplete="current-password"
                className="w-full rounded-md bg-zinc-800 border border-zinc-600 px-3 py-2 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent disabled:bg-zinc-700 disabled:text-zinc-400"
                disabled={unlinkMutation.isPending}
                id="bbaton-unlink-password"
                name="password"
                placeholder="비밀번호를 입력해 주세요"
                required
                type="password"
              />
            </div>

            {isTwoFactorEnabled && (
              <div className="grid gap-1.5">
                <label className="text-sm text-zinc-300" htmlFor="bbaton-unlink-token">
                  2단계 인증 코드
                </label>
                <OneTimeCodeInput
                  className="w-full rounded-md bg-zinc-800 border border-zinc-600 px-3 py-2 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent disabled:bg-zinc-700 disabled:text-zinc-400"
                  disabled={unlinkMutation.isPending}
                  id="bbaton-unlink-token"
                />
              </div>
            )}

            <button
              aria-disabled={unlinkMutation.isPending}
              className="w-full inline-flex justify-center rounded-lg border border-zinc-800 bg-transparent px-4 py-2.5 text-sm font-medium text-red-300 transition aria-disabled:opacity-60 hover:bg-red-950/20 active:bg-red-950/30"
              type="submit"
            >
              연동 해제하기
            </button>
          </form>
        </div>
      </details>
    </div>
  )
}
