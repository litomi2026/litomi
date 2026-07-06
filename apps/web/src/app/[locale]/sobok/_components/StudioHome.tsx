'use client'

import { Mic } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import { useRouter } from '@/i18n/navigation'
import { getErrorMessage } from '@/lib/error-message'
import useCreateArtistMutation from '../_query/useCreateArtistMutation'
import useStudioQuery from '../_query/useStudioQuery'
import ArtistProfileForm, { type ArtistProfileFormValues } from './ArtistProfileForm'
import PageHeader, { HeaderBackLink } from './ui/PageHeader'

// /sobok/studio — 프로필이 있으면 내 스튜디오로, 없으면 온보딩 폼(오픈 셀프서비스).
export default function StudioHome() {
  const { data, isLoading } = useStudioQuery()
  const { mutate: createArtist, isPending, error } = useCreateArtistMutation()
  const t = useTranslations('Sobok.studio')
  const tNav = useTranslations('Sobok.nav')
  const tErrors = useTranslations('Errors')
  const router = useRouter()
  const artist = data?.artist

  function handleSubmit(values: ArtistProfileFormValues) {
    const variables = {
      handle: values.handle,
      displayName: values.displayName,
      description: values.description,
      emoji: values.emoji,
      priceAmount: values.priceAmount,
      agreeContentPolicy: values.agreeContentPolicy as true,
    }

    createArtist(variables, {
      onSuccess: ({ artist: created }) => {
        router.replace(`/sobok/studio/${created.handle}`)
      },
    })
  }

  useEffect(() => {
    if (artist) {
      router.replace(`/sobok/studio/${artist.handle}`)
    }
  }, [artist, router])

  // 디스패처 구간: 온보딩(비아티스트)인지 내 스튜디오 리다이렉트(아티스트)인지 확정되기 전엔
  // 어느 쪽 콘텐츠도 그리지 않는다 — 아티스트에게 온보딩 폼이 스치는 것을 막는다. FanShell이
  // 같은 쿼리를 미리 캐시해 두므로 보통 이 상태는 보이지 않는다.
  if (isLoading || artist) {
    return (
      <div className="flex h-full flex-col bg-background">
        <PageHeader
          back={<HeaderBackLink href="/sobok" />}
          title={<h2 className="text-lg font-bold text-foreground">{tNav('studio')}</h2>}
        />
        <div className="flex flex-1 items-center justify-center">
          <div className="animate-skeleton-appear">
            <div className="h-8 w-8 animate-pulse rounded-full bg-indigo-500/30" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <PageHeader
        back={<HeaderBackLink href="/sobok" />}
        title={<h2 className="text-lg font-bold text-foreground">{tNav('studio')}</h2>}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 px-6 py-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-500">
            <Mic className="h-7 w-7" />
          </div>

          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">{t('onboardingTitle')}</h1>
            <p className="mt-2 max-w-sm text-sm text-zinc-400">{t('onboardingDescription')}</p>
          </div>

          <ArtistProfileForm
            mode="create"
            onSubmit={handleSubmit}
            isPending={isPending}
            error={getErrorMessage(tErrors, error)}
            submitLabel={t('onboardingSubmit')}
          />
        </div>
      </div>
    </div>
  )
}
