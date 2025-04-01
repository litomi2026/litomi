'use client'

type Props = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: Props) {
  return (
    <main className="grid gap-2 text-center py-10">
      <h1>오류가 발생했어요</h1>
      <p>{error.message}</p>
      <button className="" onClick={() => reset()}>
        다시 시도하기
      </button>
    </main>
  )
}
