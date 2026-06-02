'use client'

import { LogIn, MoreHorizontal, Settings } from 'lucide-react'
import { useTranslations } from 'next-intl'

import LinkPending from '@/components/LinkPending'
import Squircle from '@/components/ui/Squircle'
import TooltipPopover from '@/components/ui/TooltipPopover'
import useCurrentPathWithSearch from '@/hook/useCurrentPathWithSearch'
import { Link, usePathname } from '@/i18n/navigation'
import { getAuthRedirectHref } from '@/lib/auth-redirect'
import useMeQuery from '@/query/useMeQuery'

import LogoutButton from './LogoutButton'
import SelectableLink from './SelectableLink'

export default function Profile() {
  const { data: me } = useMeQuery()
  const t = useTranslations('Profile.navigation')

  if (me === undefined) {
    return <ProfileSkeleton />
  }

  if (me === null) {
    return <GuestProfileActions settingsLabel={t('settings')} />
  }

  const { name, imageURL, nickname } = me

  return (
    <TooltipPopover
      buttonClassName="w-full pointer-events-none rounded-full transition sm:hover:bg-zinc-900 sm:active:bg-zinc-900 sm:pointer-events-auto"
      className="px-2 flex justify-center sm:py-2"
      position="top-right"
      type="popover"
    >
      <Link
        className="flex justify-center items-center gap-3 p-2 group rounded-full pointer-events-auto sm:pointer-events-none"
        href={`/@${name}`}
        onClick={(e) => e.stopPropagation()}
      >
        <Squircle backgroundClassName="fill-zinc-600" className="w-8 shrink-0 sm:w-10" src={imageURL}>
          {nickname.slice(0, 2)}
        </Squircle>
        <div className="hidden text-left grow min-w-0 gap-1 py-0.5 2xl:grid">
          <div className="leading-5 break-all line-clamp-1">{nickname}</div>
          <div className="overflow-hidden text-zinc-400 leading-5">@{name}</div>
        </div>
        <MoreHorizontal className="shrink-0 hidden size-11 p-3 2xl:block" />
      </Link>
      <div className="grid gap-1 p-4 -ml-2 min-w-40 mb-2 rounded-2xl border-2 border-zinc-700 transition bg-zinc-900">
        <Link
          className="group flex items-center gap-3 rounded-full p-2 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-800 active:scale-95 sm:px-3 sm:py-2"
          href="/settings"
        >
          <Settings className="w-5 transition" />
          <span className="min-w-0 hidden md:block">{t('settings')}</span>
        </Link>
        <LogoutButton />
      </div>
    </TooltipPopover>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="flex items-center justify-center w-fit m-auto p-2 rounded-full sm:my-0 sm:p-4 2xl:w-full">
      <Squircle backgroundClassName="fill-zinc-700" className="w-8 animate-fade-in shrink-0 sm:w-10" />
      <div className="ml-3 hidden w-full min-w-0 gap-1 py-0.5 2xl:grid">
        <div className="h-5 animate-fade-in rounded-full bg-zinc-700" />
        <div className="h-5 animate-fade-in rounded-full bg-zinc-700" />
      </div>
    </div>
  )
}

function GuestProfileActions({ settingsLabel }: { settingsLabel: string }) {
  const pathname = usePathname()
  const redirect = useCurrentPathWithSearch()
  const t = useTranslations('Auth.loginButton')
  const loginHref = getAuthRedirectHref('/auth/login', redirect)

  return (
    <>
      <div className="contents sm:hidden">
        <SelectableLink className="sm:p-2" href={loginHref} icon={<LogIn />}>
          {t('action')}
        </SelectableLink>
      </div>
      <div className="hidden w-full sm:grid 2xl:flex 2xl:items-center">
        <Link
          className="group order-2 p-5 flex items-center justify-center text-zinc-400 transition hover:text-foreground active:scale-90 2xl:order-1 2xl:flex-1 2xl:justify-start 2xl:gap-5"
          href={loginHref}
        >
          <LinkPending className="shrink-0 text-foreground">
            <LogIn className="size-6 shrink-0 text-foreground" />
          </LinkPending>
          <span className="hidden min-w-0 font-medium 2xl:block">{t('action')}</span>
        </Link>
        <Link
          aria-current={pathname === '/settings' ? 'page' : undefined}
          aria-label={settingsLabel}
          className="order-1 p-3 flex items-center justify-center text-zinc-400 transition hover:text-foreground active:scale-90 aria-[current=page]:bg-zinc-900 aria-[current=page]:text-foreground aria-[current=page]:[&_svg]:fill-current aria-[current=page]:[&_svg]:[fill-opacity:0.3] 2xl:order-2"
          href="/settings"
          title={settingsLabel}
        >
          <LinkPending className="shrink-0">
            <Settings className="size-6 shrink-0 transition" />
          </LinkPending>
        </Link>
      </div>
    </>
  )
}
