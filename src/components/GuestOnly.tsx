'use client'

import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { toast } from 'sonner'

export default function GuestOnly() {
  const getAccessToken = useAuthStore((state) => state.getAccessToken)
  const router = useRouter()

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>

    if (getAccessToken()) {
      toast.warning('이미 로그인되어 있습니다. 이전 페이지로 이동합니다.')

      timeoutId = setTimeout(() => {
        router.back()
      }, 3000)
    }

    return () => {
      clearTimeout(timeoutId)
    }
  }, [getAccessToken, router])

  return null
}
