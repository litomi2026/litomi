'use client'

import { MessageCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import ThreadList from './ThreadList'

export default function ChatHome() {
  const t = useTranslations('Sobok')

  return (
    <>
      <div className="flex h-full flex-col lg:hidden">
        <div className="shrink-0 px-5 pb-3 pt-6">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('chatList.title')}</h1>
        </div>
        <ThreadList />
      </div>

      <div className="hidden h-full flex-col items-center justify-center gap-3 px-8 text-center lg:flex">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-foreground/5 text-zinc-400">
          <MessageCircle className="h-6 w-6" />
        </div>
        <p className="text-sm font-medium text-foreground">{t('emptyPane.title')}</p>
        <p className="text-xs text-zinc-500">{t('emptyPane.description')}</p>
      </div>
    </>
  )
}
