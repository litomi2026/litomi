'use client'

import { ChevronLeft } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import { Link, useRouter } from '@/i18n/navigation'
import { getErrorMessage } from '@/lib/error-message'
import useStudioQuery from '../_query/useStudioQuery'
import useUpdateArtistMutation from '../_query/useUpdateArtistMutation'
import ArtistProfileForm, { type ArtistProfileFormValues } from './ArtistProfileForm'

export default function StudioSettings({ handle }: { handle: string }) {
  const { data, isLoading } = useStudioQuery()
  const { mutate: updateArtist, isPending, error } = useUpdateArtistMutation(handle)
  const t = useTranslations('Sobok.studio')
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
      isActive: values.isActive,
    }

    updateArtist(variables, {
      onSuccess: ({ artist: updated }) => {
        router.replace(`/sobok/studio/${updated.handle}`)
      },
    })
  }

  // 내 스튜디오가 아니면(프로필 없음/핸들 불일치) 올바른 곳으로 보낸다.
  useEffect(() => {
    if (isLoading || !data) {
      return
    }

    if (!artist) {
      router.replace('/sobok/studio')
    } else if (artist.handle !== handle) {
      router.replace(`/sobok/studio/${artist.handle}/settings`)
    }
  }, [isLoading, data, artist, handle, router])

  if (isLoading || !artist || artist.handle !== handle) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background h-full">
        <div className="animate-pulse w-8 h-8 rounded-full bg-indigo-500/30" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="h-14 shrink-0 flex items-center px-2 border-b border-foreground/10 bg-background/80">
        <Link href={`/sobok/studio/${handle}`} className="p-2 text-zinc-400 hover:text-foreground transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h2 className="font-bold text-lg text-foreground ml-2">{t('settingsTitle')}</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center px-6 py-8">
          <ArtistProfileForm
            initial={artist}
            onSubmit={handleSubmit}
            isPending={isPending}
            error={getErrorMessage(tErrors, error)}
            submitLabel={t('saveSubmit')}
          />
        </div>
      </div>
    </div>
  )
}
