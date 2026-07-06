'use client'

import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { useRouter } from '@/i18n/navigation'
import useArtistQuery from '../_query/useArtistQuery'

// Everything under /sobok/studio/[handle] is owner-only, but the server enforces that on every
// endpoint — so this only watches the artist resource and redirects non-owners, without
// blocking render. The shell chrome stays instant and each page owns its single loading state.
export default function StudioOwnerGuard({ handle, children }: { handle: string; children: ReactNode }) {
  const { data, isError } = useArtistQuery(handle)
  const router = useRouter()

  useEffect(() => {
    if (data && !data.isOwner) {
      router.replace(`/sobok/@${handle}`)
    } else if (isError) {
      router.replace('/sobok/studio')
    }
  }, [data, isError, handle, router])

  return <>{children}</>
}
