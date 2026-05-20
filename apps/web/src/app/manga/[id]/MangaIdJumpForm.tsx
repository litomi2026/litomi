'use client'

import { ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { type FormEvent, useId } from 'react'

type Props = {
  currentMangaId: number
  autoFocus?: boolean
  className?: string
  formId?: string
  onNavigate?: () => void
}

export default function MangaIdJumpForm({
  autoFocus,
  className = '',
  currentMangaId,
  formId,
  onNavigate,
}: Props) {
  const inputId = useId()
  const router = useRouter()

  function handleInput(event: FormEvent<HTMLInputElement>) {
    event.currentTarget.value = event.currentTarget.value.replace(/\D/g, '')
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const nextMangaId = String(formData.get('mangaId') ?? '')
    const parsedMangaId = Number(nextMangaId)

    if (!Number.isSafeInteger(parsedMangaId) || parsedMangaId < 1 || parsedMangaId === currentMangaId) {
      return
    }

    router.push(`/manga/${parsedMangaId}`)
    event.currentTarget.reset()
    onNavigate?.()
  }

  return (
    <form
      aria-label="작품 번호로 이동"
      className={`items-center gap-1 rounded-full bg-zinc-900/70 p-1 ring-1 ring-zinc-700/80 ${className}`}
      id={formId}
      onSubmit={handleSubmit}
    >
      <label className="sr-only" htmlFor={inputId}>
        작품 번호
      </label>
      <input
        autoComplete="off"
        autoFocus={autoFocus}
        className="h-8 min-w-0 flex-1 rounded-full bg-transparent px-2 text-sm tabular-nums text-foreground placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500/70"
        id={inputId}
        inputMode="numeric"
        maxLength={9}
        name="mangaId"
        onInput={handleInput}
        pattern="[1-9][0-9]*"
        placeholder={`${currentMangaId}`}
        required
        title="작품 번호"
        type="text"
      />
      <button
        aria-label="작품 번호로 이동"
        className="rounded-full p-1.5 transition hover:bg-zinc-800 active:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/70"
        type="submit"
      >
        <ArrowRight className="size-5" />
      </button>
    </form>
  )
}
