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
    <main className="flex flex-col grow">
      <ScrollReset />
      <h1 className="sr-only">만화 검색</h1>
      <div className="sticky top-0 z-10 bg-background border-b-2 border-zinc-800 px-2 py-2 shadow-sm">
        <div className="flex justify-center flex-wrap gap-2 whitespace-nowrap text-sm sm:justify-end md:text-base">
          <SearchForm className="grow" /> <ViewToggle initialView={view} />
        </div>
      </div>
      <div className="flex-1 p-2">{children}</div>
    </main>
  )
}
