'use client'

import { Image, LayoutGrid } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import UpdateFromSearchParams from '@/app/(navigation)/search/UpdateFromSearchParams'
import { View } from '@/utils/param'

const VIEW_OPTIONS = [
  { value: View.CARD, label: '카드', Icon: LayoutGrid },
  { value: View.IMAGE, label: '그림', Icon: Image },
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
    <div className="relative inline-flex bg-zinc-900 border border-zinc-700 p-0.5 rounded-xl text-sm text-zinc-400 overflow-hidden">
      <UpdateFromSearchParams onUpdate={handleSearchParamUpdate} />
      {currentView && (
        <div
          className="absolute inset-1 right-1/2 bg-zinc-800 rounded-lg border border-zinc-700 transition pointer-events-none"
          style={{ transform: `translateX(${VIEW_OPTIONS.findIndex(({ value }) => value === currentView) * 100}%)` }}
        />
      )}
      {VIEW_OPTIONS.map(({ value, label, Icon }) => (
        <button
          aria-current={currentView === value}
          aria-label={label}
          className="relative z-10 flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded aria-current:font-bold aria-current:text-foreground"
          disabled={!currentView}
          key={value}
          onClick={() => select(value)}
          title={label}
          type="button"
        >
          <Icon aria-hidden className="hidden md:block lg:hidden size-4" />
          <span className="md:hidden lg:inline">{label}</span>
        </button>
      ))}
    </div>
  )
}
