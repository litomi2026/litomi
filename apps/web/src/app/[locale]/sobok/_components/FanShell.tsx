'use client'

import { CreditCard, MessageCircle, Mic } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ComponentProps, ComponentType, ReactNode } from 'react'
import { Link, usePathname } from '@/i18n/navigation'
import useStudioQuery from '../_query/useStudioQuery'
import ThreadList from './ThreadList'

interface NavItem {
  href: ComponentProps<typeof Link>['href']
  icon: ComponentType<{ className?: string }>
  label: string
  active: boolean
}

function useNavItems(): NavItem[] {
  const { data: studioData } = useStudioQuery()
  const pathname = usePathname()
  const t = useTranslations('Sobok.nav')
  const myStudioHandle = studioData?.artist?.handle

  return [
    {
      href: '/sobok',
      icon: MessageCircle,
      label: t('chats'),
      active: pathname === '/sobok',
    },
    {
      href: '/sobok/billing',
      icon: CreditCard,
      label: t('billing'),
      active: pathname === '/sobok/billing',
    },
    {
      href: myStudioHandle ? `/sobok/studio/${myStudioHandle}` : '/sobok/studio',
      icon: Mic,
      label: t('studio'),
      active: pathname.startsWith('/sobok/studio'),
    },
  ]
}

// Mobile bottom tabs — hidden inside a room so the composer owns the bottom edge.
function TabBar() {
  const items = useNavItems()

  return (
    <nav className="flex shrink-0 border-t border-foreground/10 bg-background pb-[max(var(--safe-area-bottom),0.25rem)] lg:hidden">
      {items.map(({ href, icon: Icon, label, active }) => (
        <Link
          aria-current={active ? 'page' : undefined}
          className="flex flex-1 flex-col items-center gap-0.5 pb-1 pt-2 text-[10px] font-medium text-zinc-400 transition-colors hover:text-foreground aria-[current=page]:text-indigo-500 aria-[current=page]:hover:text-indigo-500"
          href={href}
          key={label}
        >
          <Icon className="h-5 w-5" />
          {label}
        </Link>
      ))}
    </nav>
  )
}

// Desktop sidebar footer — the chat list itself covers the "chats" destination.
function SidebarRail() {
  const items = useNavItems().filter((item) => item.href !== '/sobok')

  return (
    <nav className="flex shrink-0 items-center gap-1 border-t border-foreground/10 p-2">
      {items.map(({ href, icon: Icon, label, active }) => (
        <Link
          aria-current={active ? 'page' : undefined}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-foreground/5 hover:text-foreground aria-[current=page]:text-indigo-500 aria-[current=page]:hover:bg-transparent aria-[current=page]:hover:text-indigo-500"
          href={href}
          key={label}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </nav>
  )
}

// Fan-zone app shell: two-pane messenger on lg+ (threads sidebar + content pane), single
// column with bottom tabs on mobile. The chrome lives here so navigation never re-mounts it.
export default function FanShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const t = useTranslations('Sobok.chatList')
  const isRoom = decodeURIComponent(pathname).startsWith('/sobok/@')

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-88 shrink-0 flex-col border-r border-foreground/10 lg:flex">
          <div className="shrink-0 px-5 pb-3 pt-6">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('title')}</h1>
          </div>
          <ThreadList />
          <SidebarRail />
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
      {!isRoom && <TabBar />}
    </div>
  )
}
