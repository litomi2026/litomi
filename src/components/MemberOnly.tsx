'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { toast } from 'sonner'

import useMeQuery from '@/query/useMeQuery'

export default function MemberOnly() {
  const { data: me } = useMeQuery()
  const router = useRouter()

  useEffect(() => {
    if (me) return

    toast.warning('로그인 후 이용해주세요. 3초 후 이전 페이지로 이동할께요.')

    const timer = setTimeout(() => {
      router.back()
    }, 3000)

    return () => {
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  return null
}
