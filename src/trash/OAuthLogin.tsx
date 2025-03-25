'use client'

import { NEXT_PUBLIC_BACKEND_URL } from '@/constants/env'
import { LocalStorageKey, SessionStorageKey } from '@/constants/storage'
import { useAuthStore } from '@/store/auth'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export enum LoginSearchParams {
  CODE = 'code',
  PROVIDER = 'provider',
}

export default function Login() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = searchParams.get(LoginSearchParams.CODE)
  const provider = searchParams.get(LoginSearchParams.PROVIDER)
  const [reason, setReason] = useState('')
  const setAccessToken = useAuthStore((state) => state.setAccessToken)

  useEffect(() => {
    if (!code || !provider) return

    const loginPromise = new Promise((resolve, reject) =>
      (async () => {
        try {
          const response = await fetch(`${NEXT_PUBLIC_BACKEND_URL}/auth/${provider}?code=${code}`, {
            method: 'POST',
          })

          if (response.status === 403) {
            setReason(await response.text())
            reject('')
            return
          } else if (response.status >= 500) {
            reject('')
            return
          }

          const result = await response.json()
          localStorage.setItem(LocalStorageKey.REFRESH_TOKEN, result.refreshToken)
          setAccessToken(result.accessToken)
          resolve('')

          const loginRedirection = sessionStorage.getItem(SessionStorageKey.LOGIN_REDIRECTION) ?? '/'
          sessionStorage.removeItem(SessionStorageKey.LOGIN_REDIRECTION)
          router.replace(`${loginRedirection}?${new URLSearchParams(searchParams)}`)
        } catch (error) {
          reject(error)
        }
      })(),
    )

    toast.promise(loginPromise, {
      loading: '로그인 중이에요',
      success: '로그인했어요',
      error: '로그인에 실패했어요',
    })
  }, [code, provider, router, searchParams, setAccessToken])

  return reason ? <div className="text-sm text-red-600 sm:text-base">{reason}</div> : null
}
