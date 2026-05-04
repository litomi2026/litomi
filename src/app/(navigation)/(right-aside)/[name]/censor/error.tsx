'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { toast } from 'sonner'

import { ErrorProps } from '@/types/nextjs'

export default function Error({ error, reset }: ErrorProps) {
  const router = useRouter()

  useEffect(() => {
    if (error.message) {
      toast.error('검열 설정을 불러오는 중 오류가 발생했습니다.')
    }
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <h2 className="text-xl font-semibold">오류가 발생했습니다</h2>
      <p className="text-zinc-500">검열 설정을 불러올 수 없습니다.</p>
      <div className="flex gap-2">
        <button className="px-4 py-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition" onClick={() => reset()}>
          다시 시도
        </button>
        <button className="px-4 py-2 bg-zinc-900 rounded-lg hover:bg-zinc-800 transition" onClick={() => router.back()}>
          뒤로 가기
        </button>
      </div>
    </div>
  )
}
