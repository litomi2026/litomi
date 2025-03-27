'use client'

import { SessionStorageKey } from '@/constants/storage'
import { useAuthStore } from '@/store/auth'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { toast } from 'sonner'

export default function MemberOnly() {
  const getAccessToken = useAuthStore((state) => state.getAccessToken)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>

    if (!getAccessToken()) {
      toast.warning('로그인이 필요합니다. 로그인 페이지로 이동합니다.')

      timeoutId = setTimeout(() => {
        sessionStorage.setItem(SessionStorageKey.LOGIN_REDIRECTION, pathname)
        router.push('/login')
      }, 3000)
    }

    return () => {
      clearTimeout(timeoutId)
    }
  }, [getAccessToken, pathname, router])

  return null
}
