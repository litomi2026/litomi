'use client'

import type { ReadonlyURLSearchParams } from 'next/navigation'

import { getViewFromSearchParams, setViewToSearchParams, View } from '@litomi/std'
import { useState } from 'react'

import SearchParamsSync from '@/components/router/SearchParamsSync'
import ViewToggle from '@/components/ViewToggle'

type Props = {
  className?: string
}

export default function SearchViewToggle({ className }: Props) {
  const [view, setView] = useState(View.CARD)

  function handleSearchParamsUpdate(searchParams: ReadonlyURLSearchParams) {
    setView(getViewFromSearchParams(searchParams))
  }

  function handleViewChange(nextView: View) {
    setView(nextView)

    const url = new URL(window.location.href)
    setViewToSearchParams(url.searchParams, nextView)

    const href = url.toString()
    if (href !== window.location.href) {
      window.history.replaceState(null, '', href)
    }
  }

  return (
    <>
      <SearchParamsSync onUpdate={handleSearchParamsUpdate} />
      <ViewToggle className={className} onViewChange={handleViewChange} view={view} />
    </>
  )
}
