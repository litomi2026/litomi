'use client'

import { Mic } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import useCreateArtistMutation from '../_query/useCreateArtistMutation'
import useStudioQuery from '../_query/useStudioQuery'
import ArtistProfileForm, { type ArtistProfileFormValues } from './ArtistProfileForm'

// /sobok/studio — 프로필이 있으면 내 스튜디오로, 없으면 온보딩 폼(오픈 셀프서비스).
export default function StudioHome() {
  const { data, isLoading } = useStudioQuery()
  const { mutate: createArtist, isPending, error } = useCreateArtistMutation()
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
          <h1 className="text-2xl font-bold text-foreground">아티스트 시작하기</h1>
          <p className="mt-2 max-w-sm text-sm text-zinc-400">
            팬에게 메시지를 보내고 월 구독으로 수익을 만들어 보세요. 프로필은 언제든 수정할 수 있어요.
          </p>
        </div>

        <ArtistProfileForm
          onSubmit={handleSubmit}
          isPending={isPending}
          error={error instanceof Error ? error.message : null}
          submitLabel="아티스트 프로필 만들기"
        />
      </div>
    </div>
  )
}
