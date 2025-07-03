import { cookies } from 'next/headers'

import type { BaseLayoutProps } from '@/types/nextjs'

import ViewToggle from '@/components/ViewSlider'
import { ViewCookie } from '@/utils/param'

import ScrollReset from './ScrollReset'
import SearchForm from './SearchForm'

export default async function Layout({ children }: BaseLayoutProps) {
  const cookieStore = await cookies()
  const view = cookieStore.get('view')?.value as ViewCookie

  return (
    <main className="flex flex-col gap-2 grow p-2">
      <ScrollReset />
      <h1 className="sr-only">만화 검색</h1>
      <h2 className="text-lg text-center text-yellow-300 font-bold">준비 중입니다</h2>
      <div className="flex justify-center flex-wrap gap-2 whitespace-nowrap text-sm sm:justify-end md:text-base">
        <SearchForm className="grow" /> <ViewToggle initialView={view} />
      </div>
      {children}
    </main>
  )
}
