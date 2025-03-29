'use client'

import IconX from '@/components/icons/IconX'
import Loading from '@/components/ui/Loading'
import { loginIdPattern, passwordPattern } from '@/constants/pattern'
import { SessionStorageKey } from '@/constants/storage'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect, useRef } from 'react'
import { toast } from 'sonner'

import login from './action'

const initialState = {
  success: false,
}

export default function LoginForm() {
  const [{ error, success, formData }, formAction, pending] = useActionState(login, initialState)
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)

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
      toast.error(error.loginId?.[0] ?? error.password?.[0])
    }
  }, [error])

  useEffect(() => {
    if (!success) return

    toast.success('로그인 성공')
    const loginRedirection = sessionStorage.getItem(SessionStorageKey.LOGIN_REDIRECTION) ?? '/'
    sessionStorage.removeItem(SessionStorageKey.LOGIN_REDIRECTION)
    router.replace(loginRedirection)
  }, [router, success])

  return (
    <form
      action={formAction}
      className="grid gap-6 
        [&_label]:block [&_label]:mb-1.5 [&_label]:text-sm [&_label]:font-medium [&_label]:text-zinc-300
        [&_input]:w-full [&_input]:rounded-md [&_input]:bg-zinc-800 [&_input]:border [&_input]:border-zinc-600 
        [&_input]:px-3 [&_input]:py-2 [&_input]:placeholder-zinc-500 [&_input]:focus:outline-none [&_input]:focus:ring-2 [&_input]:focus:ring-zinc-500 
        [&_input]:focus:border-transparent [&_input]:disabled:bg-zinc-700 [&_input]:disabled:border-zinc-500 [&_input]:disabled:cursor-not-allowed"
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
              autoFocus
              defaultValue={String(formData?.get('loginId') ?? '')}
              disabled={pending}
              id="loginId"
              maxLength={32}
              minLength={2}
              name="loginId"
              pattern={loginIdPattern}
              placeholder="아이디를 입력하세요"
              required
            />
            <button onClick={resetId} type="button">
              <IconX className="w-3.5" />
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="password">비밀번호</label>
          <div className="relative">
            <input
              defaultValue={String(formData?.get('password') ?? '')}
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
            <button onClick={resetPassword} type="button">
              <IconX className="w-3.5" />
            </button>
          </div>
        </div>
      </div>
      <button
        className="group border-2 border-brand-gradient font-medium rounded-xl disabled:border-zinc-500 disabled:pointer-events-none disabled:text-zinc-500 focus:outline-none focus:ring-3 focus:ring-zinc-500"
        disabled={pending}
        type="submit"
      >
        <div
          className="p-2 flex justify-center bg-zinc-900 rounded-xl hover:bg-zinc-800 transition active:bg-zinc-900 
          group-disabled:bg-zinc-800 group-disabled:cursor-not-allowed"
        >
          {pending ? <Loading className="text-zinc-500" /> : '로그인'}
        </div>
      </button>
    </form>
  )
}
