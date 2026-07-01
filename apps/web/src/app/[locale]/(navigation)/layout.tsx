import { Bookmark, FileText, Flame, LibraryBig, PiggyBank, Search, Tag } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { twMerge } from 'tailwind-merge'

import AutoHideHeader from '@/components/auto-hide/AutoHideHeader'
import IconBell from '@/components/icons/IconBell'
import IconHome from '@/components/icons/IconHome'
import IconLogo from '@/components/icons/LogoLitomi'
import SeasonalEffects from '@/components/seasonal/SeasonalEffects'
import { Link } from '@/i18n/navigation'
import { getLocaleFromParams } from '@/i18n/server'

import { DEFAULT_METRIC, DEFAULT_PERIOD } from './(ranking)/common'
import MoreNavigationPopover from './MoreNavigationPopover'
import { DesktopNavigationSpacer } from './NavigationSpacers'
import NotificationCount from './NotificationCount'
import Profile from './Profile'
import ProfileLink from './ProfileLink'
import SelectableLink from './SelectableLink'

export default async function Layout({ children, params }: LayoutProps<'/[locale]'>) {
  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'Navigation.sidebar' })

  return (
    <div className="flex flex-col min-h-full mx-auto px-safe max-w-screen-2xl sm:flex-row">
      <SeasonalEffects />
      <AutoHideHeader
        className={twMerge(
          'fixed bottom-0 left-0 right-0 z-50 m-auto px-safe pb-safe grid grid-cols-[4fr_1fr] border-t bg-background/80 backdrop-blur transition',
          'sm:inset-auto sm:flex sm:h-full sm:w-20 sm:flex-col sm:justify-between sm:gap-1 sm:border-r sm:border-t-0 sm:px-0 sm:py-safe sm:data-[auto-hide=true]:opacity-100',
          '2xl:w-3xs',
        )}
      >
        <nav className="grid grid-cols-4 select-none whitespace-nowrap overflow-y-auto scrollbar-hidden sm:grid-cols-none sm:gap-2 xl:text-xl xl:leading-6 2xl:p-2">
          <Link className="p-3 w-fit mx-auto hidden sm:block 2xl:m-0" href="/" prefetch={false}>
            <IconLogo className="w-8" priority />
          </Link>
          <SelectableLink href="/new/1" icon={<IconHome />} selectedIconStyle="fill">
            {t('home')}
          </SelectableLink>
          <SelectableLink href="/search" icon={<Search />}>
            {t('search')}
          </SelectableLink>
          <SelectableLink
            className="hidden sm:block"
            href={`/ranking/${DEFAULT_METRIC}/${DEFAULT_PERIOD}`}
            icon={<Flame />}
            selectedIconStyle="fill"
          >
            {t('ranking')}
          </SelectableLink>
          <SelectableLink href="/library" icon={<LibraryBig />} selectedIconStyle="fill">
            {t('library')}
          </SelectableLink>
          <SelectableLink
            className="hidden sm:block"
            href="/library/bookmark"
            icon={<Bookmark />}
            selectedIconStyle="fill"
          >
            {t('bookmark')}
          </SelectableLink>
          <SelectableLink
            className="hidden sm:block"
            href="/posts/recommend"
            hrefMatch="/post"
            icon={<FileText />}
            selectedIconStyle="fill-soft"
          >
            {t('posts')}
          </SelectableLink>
          <SelectableLink
            className="hidden sm:block"
            href="/tag/female"
            hrefMatch="/tag"
            icon={<Tag />}
            selectedIconStyle="fill-soft"
          >
            {t('tag')}
          </SelectableLink>
          <div className="relative">
            <SelectableLink className="h-full" href="/notification" icon={<IconBell />} selectedIconStyle="fill">
              {t('notification')}
            </SelectableLink>
            <NotificationCount />
          </div>
          <SelectableLink
            className="hidden sm:block"
            href="/libo"
            hrefMatch="/libo"
            icon={<PiggyBank />}
            selectedIconStyle="fill-soft"
          >
            {t('libo')}
          </SelectableLink>
          <ProfileLink className="hidden sm:block" />
          <MoreNavigationPopover className="hidden sm:flex justify-center" />
        </nav>
        <Profile />
      </AutoHideHeader>
      <DesktopNavigationSpacer />
      {children}
    </div>
  )
}
