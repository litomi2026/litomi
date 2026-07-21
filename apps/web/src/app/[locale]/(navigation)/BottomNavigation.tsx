'use client'

import { LibraryBig, Search } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { twMerge } from 'tailwind-merge'

import { revealNavigationAutoHide, useNavigationAutoHideState } from '@/components/auto-hide/navigationAutoHide'
import IconBell from '@/components/icons/IconBell'
import IconHome from '@/components/icons/IconHome'

import NotificationCount from './NotificationCount'
import Profile from './Profile'
import SelectableLink from './SelectableLink'

export default function BottomNavigation() {
  const t = useTranslations('Navigation.sidebar')
  const isNavigationHidden = useNavigationAutoHideState()

  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-[max(var(--safe-area-bottom),0.75rem)] z-50 sm:hidden">
      <div
        className={twMerge(
          'pointer-events-auto mx-auto grid w-full max-w-md grid-cols-[4fr_1fr] items-center px-2',
          'rounded-3xl border border-foreground/15 bg-background/80 shadow-lg backdrop-blur',
          'origin-bottom transition duration-300',
          'data-[auto-hide=true]:scale-95 data-[auto-hide=true]:opacity-30',
        )}
        data-auto-hide={isNavigationHidden || undefined}
        onClick={revealNavigationAutoHide}
      >
        <nav aria-label={t('label')} className="grid grid-cols-4 select-none">
          <SelectableLink href="/new" icon={<IconHome />} selectedIconStyle="fill">
            {t('home')}
          </SelectableLink>
          <SelectableLink href="/search" icon={<Search />}>
            {t('search')}
          </SelectableLink>
          <SelectableLink href="/library" icon={<LibraryBig />} selectedIconStyle="fill">
            {t('library')}
          </SelectableLink>
          <div className="relative">
            <SelectableLink className="h-full" href="/notification" icon={<IconBell />} selectedIconStyle="fill">
              {t('notification')}
            </SelectableLink>
            <NotificationCount />
          </div>
        </nav>
        <Profile />
      </div>
    </div>
  )
}
