import { getTranslations } from 'next-intl/server'

import BackButton from '@/components/BackButton'

export default async function Layout({ children }: LayoutProps<'/[locale]/post/[id]'>) {
  const t = await getTranslations('Community.post')

  return (
    <>
      <div className="sticky top-0 z-10 flex items-center justify-between gap-2 px-2 pb-2 pt-[calc(0.5rem+var(--safe-area-top))] backdrop-blur whitespace-nowrap bg-background/80 border-background border-b-2 sm:p-2">
        <div className="flex items-center gap-8">
          <BackButton
            className="hover:bg-zinc-500/50 focus-visible:outline-zinc-500 rounded-full p-2 transition"
            fallbackUrl="/posts/recommend"
          />
          <h2 className="text-xl font-bold">{t('title')}</h2>
        </div>
        <button className="rounded-full border-2 border-zinc-600 px-4 py-1 text-sm font-bold mx-2">{t('reply')}</button>
      </div>
      {children}
      <PostDetailBottomSpacer />
    </>
  )
}

function PostDetailBottomSpacer() {
  return <div aria-hidden className="h-dvh shrink-0" />
}
