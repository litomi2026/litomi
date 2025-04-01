'use client'

import ShuffleButton from '@/components/ShuffleButton'
import SourceToggleLink from '@/components/SourceToggleLink'

type Props = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: Props) {
  return (
    <main className="grid gap-2">
      <div className="flex justify-end gap-2">
        <SourceToggleLink currentSource="hi" />
        <ShuffleButton action="random" className="w-fit" href="/mangas/random/hi" iconClassName="w-5" />
      </div>
      <h1>오류가 발생했어요</h1>
      <p>{error.message}</p>
      <button className="" onClick={() => reset()}>
        다시 시도하기
      </button>
    </main>
  )
}
