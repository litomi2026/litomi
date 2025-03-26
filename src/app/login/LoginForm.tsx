'use client'

import { LocalStorageKey, SessionStorageKey } from '@/constants/storage'
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'

import getUser from './action'

const initialState = {
  data: {
    accessToken: '',
    refreshToken: '',
  },
}

export default function LoginForm() {
  const [{ error, data, formData }, formAction, pending] = useActionState(getUser, initialState)
  const setAccessToken = useAuthStore((state) => state.setAccessToken)
  const router = useRouter()

  useEffect(() => {
    if (error) {
      toast.error(error.id?.[0] ?? error.password?.[0])
    }
  }, [error])

  useEffect(() => {
    if (!data) return

    const { accessToken, refreshToken } = data
    if (!accessToken || !refreshToken) return

    toast.success('로그인되었습니다.')
    localStorage.setItem(LocalStorageKey.REFRESH_TOKEN, refreshToken)
    setAccessToken(accessToken)
    const loginRedirection = sessionStorage.getItem(SessionStorageKey.LOGIN_REDIRECTION) ?? '/'
    sessionStorage.removeItem(SessionStorageKey.LOGIN_REDIRECTION)
    router.replace(loginRedirection)
  }, [data, router, setAccessToken])

  return (
    <form
      action={formAction}
      className="grid gap-6 
        [&_label]:block [&_label]:text-sm [&_label]:font-medium [&_label]:text-zinc-300
        [&_input]:mt-1.5 [&_input]:w-full [&_input]:rounded-md [&_input]:bg-zinc-800 [&_input]:border [&_input]:border-zinc-600 
        [&_input]:px-3 [&_input]:py-2 [&_input]:placeholder-zinc-500 [&_input]:focus:outline-none [&_input]:focus:ring-2 [&_input]:focus:ring-zinc-500 
        [&_input]:focus:border-transparent [&_input]:disabled:bg-zinc-700 [&_input]:disabled:border-zinc-500 [&_input]:disabled:cursor-not-allowed"
    >
      <div className="grid gap-4">
        <div>
          <label htmlFor="id">아이디</label>
          <input
            defaultValue={String(formData?.get('id') ?? '')}
            disabled={pending}
            id="id"
            maxLength={32}
            minLength={2}
            name="id"
            pattern="^[a-zA-Z][a-zA-Z0-9-._~]+$"
            placeholder="아이디를 입력하세요"
            required
          />
        </div>
        <div>
          <label htmlFor="password">비밀번호</label>
          <input
            defaultValue={String(formData?.get('password') ?? '')}
            disabled={pending}
            id="password"
            maxLength={64}
            minLength={8}
            name="password"
            pattern="^(?=.*[A-Za-z])(?=.*\d).+$"
            placeholder="비밀번호를 입력하세요"
            required
            type="password"
          />
        </div>
      </div>
      <button
        className="group border-2 border-brand-gradient font-medium rounded-xl disabled:border-zinc-500 disabled:pointer-events-none disabled:text-zinc-500 focus:outline-none focus:ring-3 focus:ring-zinc-500"
        disabled={pending}
        type="submit"
      >
        <div className="p-2 bg-zinc-900 rounded-xl hover:bg-zinc-800 transition active:bg-zinc-900 group-disabled:bg-zinc-800 group-disabled:cursor-not-allowed">
          로그인
        </div>
      </button>
    </form>
  )
}
