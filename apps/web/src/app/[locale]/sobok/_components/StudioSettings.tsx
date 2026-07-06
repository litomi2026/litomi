'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { getErrorMessage } from '@/lib/error-message'
import useStudioQuery from '../_query/useStudioQuery'
import useUpdateArtistMutation from '../_query/useUpdateArtistMutation'
import ArtistProfileForm, { type ArtistProfileFormValues } from './ArtistProfileForm'

// The 설정 tab content — chrome belongs to StudioShell, ownership to StudioOwnerGuard.
export default function StudioSettings({ handle }: { handle: string }) {
  const { data } = useStudioQuery()
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

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto flex w-full max-w-xl flex-col items-center px-6 py-8">
        {/* The form structure is static — render it disabled while values load, then remount
            (key) so the defaultValues fill in. */}
        <ArtistProfileForm
          key={artist ? 'ready' : 'loading'}
          mode="edit"
          initial={artist}
          disabled={!artist}
          onSubmit={handleSubmit}
          isPending={isPending}
          error={getErrorMessage(tErrors, error)}
          submitLabel={t('saveSubmit')}
        />
      </div>
    </div>
  )
}
