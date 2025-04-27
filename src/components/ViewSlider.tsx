'use client'

import { ViewParam } from '@/utils/param'
import Cookies from 'js-cookie'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const VIEWS: [ViewParam, string][] = [
  [ViewParam.CARD, '카드'],
  [ViewParam.IMAGE, '그림'],
]

type Props = {
  initialView?: ViewParam
}

export default function ViewToggle({ initialView }: Props) {
  const router = useRouter()
  const [currentView, setCurrentView] = useState<ViewParam>(initialView ?? ViewParam.CARD)

  useEffect(() => {
    if (!initialView) {
      setCurrentView((Cookies.get('view') as ViewParam) ?? ViewParam.CARD)
    }
  }, [initialView])

  const select = (v: ViewParam) => {
    if (v === currentView) return
    Cookies.set('view', v, { expires: 365, path: '/', sameSite: 'lax' })
    setCurrentView(v)
    router.refresh()
  }

  return (
    <div className="relative flex bg-zinc-900 border-2 p-1 rounded-xl text-zinc-400">
      <div
        className="absolute inset-1 right-1/2 bg-zinc-800 rounded-lg border-2 border-zinc-700 transition pointer-events-none"
        style={{ transform: `translateX(${VIEWS.findIndex(([view]) => view === currentView) * 100}%)` }}
      />
      {VIEWS.map(([view, label]) => (
        <button
          aria-current={currentView === view}
          className="relative z-10 flex-1 px-3 py-1 rounded
                     aria-current:font-bold aria-current:text-foreground"
          key={view}
          onClick={() => select(view)}
          type="button"
        >
          {label}
        </button>
      ))}
    </div>
  )
}
