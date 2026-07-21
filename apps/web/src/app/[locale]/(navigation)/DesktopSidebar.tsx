import type { PublicLocale } from '@litomi/domain/locale'
import { Bookmark, FileText, Flame, LibraryBig, PiggyBank, Search, Tag } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import IconBell from '@/components/icons/IconBell'
import IconHome from '@/components/icons/IconHome'
import IconLogo from '@/components/icons/LogoLitomi'
import { Link } from '@/i18n/navigation'

import { DEFAULT_METRIC, DEFAULT_PERIOD } from './(ranking)/common'
import MoreNavigationPopover from './MoreNavigationPopover'
import NotificationCount from './NotificationCount'
import Profile from './Profile'
import ProfileLink from './ProfileLink'
import SelectableLink from './SelectableLink'

type Props = {
  locale: PublicLocale
}

export default async function DesktopSidebar({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: 'Navigation.sidebar' })

  return (
    <div className="hidden fixed inset-auto z-50 m-auto h-full w-20 flex-col justify-between gap-1 border-r bg-background/80 py-safe backdrop-blur sm:flex 2xl:w-3xs">
      <nav
        aria-label={t('label')}
        className="grid gap-2 select-none whitespace-nowrap overflow-y-auto scrollbar-hidden xl:text-xl xl:leading-6 2xl:p-2"
      >
        <Link className="p-3 w-fit mx-auto block 2xl:m-0" href="/" prefetch={false}>
          <IconLogo className="w-8" priority />
        </Link>
        <SelectableLink href="/new" icon={<IconHome />} selectedIconStyle="fill">
          {t('home')}
        </SelectableLink>
        <SelectableLink href="/search" icon={<Search />}>
          {t('search')}
        </SelectableLink>
        <SelectableLink href={`/ranking/${DEFAULT_METRIC}/${DEFAULT_PERIOD}`} icon={<Flame />} selectedIconStyle="fill">
          {t('ranking')}
        </SelectableLink>
        <SelectableLink href="/library" icon={<LibraryBig />} selectedIconStyle="fill">
          {t('library')}
        </SelectableLink>
        <SelectableLink href="/library/bookmark" icon={<Bookmark />} selectedIconStyle="fill">
          {t('bookmark')}
        </SelectableLink>
        <SelectableLink href="/posts/recommend" hrefMatch="/post" icon={<FileText />} selectedIconStyle="fill-soft">
          {t('posts')}
        </SelectableLink>
        <SelectableLink href="/tag/female" hrefMatch="/tag" icon={<Tag />} selectedIconStyle="fill-soft">
          {t('tag')}
        </SelectableLink>
        <div className="relative">
          <SelectableLink className="h-full" href="/notification" icon={<IconBell />} selectedIconStyle="fill">
            {t('notification')}
          </SelectableLink>
          <NotificationCount />
        </div>
        <SelectableLink href="/libo" hrefMatch="/libo" icon={<PiggyBank />} selectedIconStyle="fill-soft">
          {t('libo')}
        </SelectableLink>
        <ProfileLink />
        <MoreNavigationPopover className="flex justify-center" />
      </nav>
      <Profile />
    </div>
  )
}
