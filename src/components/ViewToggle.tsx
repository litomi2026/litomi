'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import UpdateFromSearchParams from '@/app/(navigation)/search/UpdateFromSearchParams'
import { View } from '@/utils/param'

const VIEW_OPTIONS = [
  { value: View.CARD, label: '카드' },
  { value: View.IMAGE, label: '그림' },
] as const

export default function ViewToggle() {
  const router = useRouter()
  const [currentView, setCurrentView] = useState('')

  function select(view: View) {
    if (view === currentView) {
      return
    }

    const searchParams = new URLSearchParams(window.location.search)

    if (view === View.IMAGE) {
      searchParams.set('view', View.IMAGE)
    } else {
      searchParams.delete('view')
    }

    router.replace(`/search?${searchParams}`)
  }

  function handleSearchParamUpdate(searchParams: URLSearchParams) {
    setCurrentView(searchParams.get('view') ?? View.CARD)
  }

  return (
    <div className="relative flex bg-zinc-900 border-2 p-1 rounded-xl text-zinc-400">
      <UpdateFromSearchParams onUpdate={handleSearchParamUpdate} />
      {currentView && (
        <div
          className="absolute inset-1 right-1/2 bg-zinc-800 rounded-lg border-2 border-zinc-700 transition pointer-events-none"
          style={{ transform: `translateX(${VIEW_OPTIONS.findIndex(({ value }) => value === currentView) * 100}%)` }}
        />
      )}
      {VIEW_OPTIONS.map(({ value, label }) => (
        <button
          aria-current={currentView === value}
          className="relative z-10 flex-1 px-3 py-1 rounded aria-current:font-bold aria-current:text-foreground"
          disabled={!currentView}
          key={value}
          onClick={() => select(value)}
          type="button"
        >
          {label}
        </button>
      ))}
    </div>
  )
}
