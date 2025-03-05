import type { BasePageProps } from '@/types/nextjs'

import { SHORT_NAME } from '@/constants'
import Image from 'next/image'
import Link from 'next/link'

export default async function Page({ params, searchParams }: BasePageProps) {
  return (
    <main className="flex justify-center items-center h-dvh">
      <div className="grid gap-2">
        <div className="flex justify-center items-center gap-2">
          <Image alt="로고" height={24} src="/logo.svg" width={24} />
          <h1 className="font-bold text-2xl">{SHORT_NAME}</h1>
        </div>
        <h2 className="font-medium text-xl">본 웹사이트는 만 19세 이상의 사용자만을 대상으로 합니다.</h2>
      </div>
    </main>
  )
}
