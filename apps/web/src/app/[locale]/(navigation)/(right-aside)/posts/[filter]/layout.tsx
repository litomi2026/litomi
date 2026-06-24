import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { twMerge } from 'tailwind-merge'

import PostCreationForm from '@/components/post/PostCreationForm'
import { Link } from '@/i18n/navigation'
import { getLocaleFromParams } from '@/i18n/server'

import NavigationWithMobileMenu from './NavigationWithMobileMenu'
import { PostFilterParams, postFilterSchema } from './schema'

export default async function Layout({ params, children }: LayoutProps<'/[locale]/posts/[filter]'>) {
  const validation = postFilterSchema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'Community.posts' })
  const { filter } = validation.data
  const isrecommend = filter === PostFilterParams.RECOMMEND
  const isFollowing = filter === PostFilterParams.FOLLOWING
  const barClassName = 'absolute bottom-0 left-1/2 -translate-x-1/2 h-1 rounded w-14 aria-selected:bg-zinc-300'

  return (
    <>
      <NavigationWithMobileMenu
        className={twMerge(
          'fixed top-0 left-0 right-0 z-10 border-b backdrop-blur bg-background/90',
          'sm:sticky sm:pt-safe sm:min-h-(--safe-area-top)',
        )}
      >
        <div
          className={twMerge(
            'grid grid-cols-2 items-center text-center text-zinc-400 [&_a]:p-4 [&_a]:transition [&_a]:relative [&_a]:aria-selected:font-bold [&_a]:aria-selected:text-foreground',
            'sm:[&_a]:hover:bg-foreground/10',
          )}
        >
          <Link aria-selected={isrecommend} href="recommend">
            {t('recommend')}
            <div aria-selected={isrecommend} className={barClassName} />
          </Link>
          <Link aria-selected={isFollowing} href="following">
            {t('following')}
            <div aria-selected={isFollowing} className={barClassName} />
          </Link>
        </div>
      </NavigationWithMobileMenu>
      <PostsMobileHeaderSpacer />
      <h2 className="sr-only">{t('listTitle')}</h2>
      <PostCreationForm className="flex p-4 border-b" placeholder={t('creationPlaceholder')} />
      {children}
    </>
  )
}

function PostsMobileHeaderSpacer() {
  return <div aria-hidden className="h-[calc(6.5rem+var(--safe-area-top))] sm:hidden" />
}
