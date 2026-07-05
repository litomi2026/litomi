'use client'

import { Mic } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import { useRouter } from '@/i18n/navigation'
import { getErrorMessage } from '@/lib/error-message'
import useCreateArtistMutation from '../_query/useCreateArtistMutation'
import useStudioQuery from '../_query/useStudioQuery'
import ArtistProfileForm, { type ArtistProfileFormValues } from './ArtistProfileForm'

// /sobok/studio — 프로필이 있으면 내 스튜디오로, 없으면 온보딩 폼(오픈 셀프서비스).
export default function StudioHome() {
  const { data, isLoading } = useStudioQuery()
  const { mutate: createArtist, isPending, error } = useCreateArtistMutation()
  const t = useTranslations('Sobok.studio')
  const tErrors = useTranslations('Errors')
  const router = useRouter()
  const artist = data?.artist

  useEffect(() => {
    if (artist) {
      router.replace(`/sobok/studio/${artist.handle}`)
    }
  }, [artist, router])

  if (isLoading || artist) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background h-full">
        <div className="animate-pulse w-8 h-8 rounded-full bg-indigo-500/30" />
      </div>
    )
  }

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

  return (
    <div className="flex-1 overflow-y-auto bg-background h-full">
      <div className="flex flex-col items-center gap-6 px-6 py-12">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-500">
          <Mic className="h-7 w-7" />
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">{t('onboardingTitle')}</h1>
          <p className="mt-2 max-w-sm text-sm text-zinc-400">{t('onboardingDescription')}</p>
        </div>

        <ArtistProfileForm
          onSubmit={handleSubmit}
          isPending={isPending}
          error={getErrorMessage(tErrors, error)}
          submitLabel={t('onboardingSubmit')}
        />
      </div>
    </div>
  )
}
