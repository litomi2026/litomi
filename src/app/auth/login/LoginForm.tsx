'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { useActionState, useEffect, useRef } from 'react'
import { toast } from 'sonner'

import IconX from '@/components/icons/IconX'
import Loading from '@/components/ui/Loading'
import { loginIdPattern, passwordPattern } from '@/constants/pattern'
import { QueryKeys } from '@/constants/query'
import { SearchParamKey } from '@/constants/storage'
import amplitude from '@/lib/amplitude/lazy'
import { resetMeQuery } from '@/query/useMeQuery'
import { sanitizeRedirect } from '@/utils'

import login from './action'

const initialState = {} as Awaited<ReturnType<typeof login>>

export default function LoginForm() {
  const [{ error, success, formData, data }, formAction, pending] = useActionState(login, initialState)
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const { loginId, userId, lastLoginAt, lastLogoutAt } = data ?? {}

  function resetId() {
    const loginIdInput = formRef.current?.loginId as HTMLInputElement
    if (!loginIdInput) return
    loginIdInput.value = ''
  }

  function resetPassword() {
    const passwordInput = formRef.current?.password as HTMLInputElement
    passwordInput.value = ''
  }

  useEffect(() => {
    if (error) {
      toast.error(Object.values(error).flatMap((value) => value.errors)[0])
    }
  }, [error])

  useEffect(() => {
    if (!success) {
      return
    }

    toast.success(`${loginId} 계정으로 로그인했어요`)

    if (userId) {
      amplitude.setUserId(userId)
      amplitude.track('login', { loginId, lastLoginAt, lastLogoutAt })
    }

    ;(async () => {
      resetMeQuery()
      await queryClient.invalidateQueries({ queryKey: QueryKeys.me, type: 'all' })
      const redirect = searchParams.get(SearchParamKey.REDIRECT)
      const sanitizedURL = sanitizeRedirect(redirect) || '/'
      router.replace(sanitizedURL.replace(/^\/@\//, `/@${loginId}/`))
    })()
  }, [loginId, queryClient, router, searchParams, success, userId, lastLoginAt, lastLogoutAt])

  return (
    <form
      action={formAction}
      className="grid gap-5 
        [&_label]:block [&_label]:mb-1.5 [&_label]:text-sm [&_label]:font-medium [&_label]:text-zinc-300 [&_label]:leading-7
        [&_input]:w-full [&_input]:rounded-md [&_input]:bg-zinc-800 [&_input]:border [&_input]:border-zinc-600 
        [&_input]:px-3 [&_input]:py-2 [&_input]:placeholder-zinc-500 [&_input]:focus:outline-none [&_input]:focus:ring-2 [&_input]:focus:ring-zinc-500 
        [&_input]:focus:border-transparent [&_input]:disabled:bg-zinc-700 [&_input]:disabled:text-zinc-400 [&_input]:disabled:border-zinc-500 [&_input]:disabled:cursor-not-allowed
        [&_input]:aria-invalid:border-red-700 [&_input]:aria-invalid:focus:ring-red-700 [&_input]:aria-invalid:placeholder-red-700"
      ref={formRef}
    >
      <div
        className="grid gap-4 [&_button]:absolute [&_button]:top-1/2 [&_button]:right-2 [&_button]:-translate-y-1/2
          [&_button]:rounded-full [&_button]:p-1 [&_button]:bg-zinc-700 [&_button]:text-zinc-400 [&_button]:hover:bg-zinc-600"
      >
        <div>
          <label htmlFor="loginId">아이디</label>
          <div className="relative">
            <input
              aria-invalid={(error?.loginId?.errors?.length ?? 0) > 0}
              autoFocus
              defaultValue={loginId}
              disabled={pending}
              id="loginId"
              maxLength={32}
              minLength={2}
              name="loginId"
              pattern={loginIdPattern}
              placeholder="아이디를 입력하세요"
              required
            />
            <button onClick={resetId} tabIndex={-1} type="button">
              <IconX className="w-3.5" />
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="password">비밀번호</label>
          <div className="relative">
            <input
              aria-invalid={(error?.password?.errors?.length ?? 0) > 0}
              defaultValue={formData?.get('password')?.toString() ?? ''}
              disabled={pending}
              id="password"
              maxLength={64}
              minLength={8}
              name="password"
              pattern={passwordPattern}
              placeholder="비밀번호를 입력하세요"
              required
              type="password"
            />
            <button onClick={resetPassword} tabIndex={-1} type="button">
              <IconX className="w-3.5" />
            </button>
          </div>
        </div>
        <label className="!flex w-fit ml-auto items-center gap-2 cursor-pointer">
          <input
            className="hidden peer"
            defaultChecked={Boolean(formData?.get('remember'))}
            disabled={pending}
            id="remember"
            name="remember"
            type="checkbox"
          />
          <span className="text-sm text-zinc-400 select-none transition peer-checked:text-foreground">
            로그인 상태 유지
          </span>
          <div className="relative transition duration-300 peer-checked:[&>span]:translate-x-full peer-checked:[&>div]:bg-brand-gradient peer-active:[&>div]:ring-2">
            <div className="w-10 h-6 bg-zinc-600 ring-zinc-500 rounded-full transition duration-300" />
            <span className="absolute left-1 top-1 w-4 h-4 bg-foreground border border-zinc-300 rounded-full transform transition duration-300" />
          </div>
        </label>
      </div>
      <button
        className="group border-2 border-brand-gradient font-medium rounded-xl focus:outline-none focus:ring-3 focus:ring-zinc-500
        disabled:border-zinc-500 disabled:pointer-events-none disabled:text-zinc-500"
        disabled={pending}
        type="submit"
      >
        <div
          className="p-2 flex justify-center bg-zinc-900 rounded-xl hover:bg-zinc-800 transition active:bg-zinc-900 
          group-disabled:bg-zinc-800 group-disabled:cursor-not-allowed"
        >
          {pending ? <Loading className="text-zinc-500 w-12 p-2" /> : '로그인'}
        </div>
      </button>
    </form>
  )
}

export function LoginFormSkeleton() {
  return <div className="h-[278px] rounded-xl bg-zinc-700 animate-fade-in" />
}
