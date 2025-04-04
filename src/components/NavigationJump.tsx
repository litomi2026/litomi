'use client'

import { useRouter } from 'next/navigation'
import { useRef } from 'react'

import IconArrow from './icons/IconArrow'

type Props = {
  totalPages: number
  hrefPrefix?: string
  hrefSuffix?: string
}

export default function NavigationJump({ totalPages, hrefPrefix = '', hrefSuffix = '' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const page = inputRef.current?.value
    if (!page) return
    router.push(`${hrefPrefix}${page}${hrefSuffix}`)
  }

  return (
    <form className="flex gap-2 relative sm:hidden" onSubmit={handleSubmit}>
      <label className="sr-only" htmlFor="page-input">
        이동할 페이지 번호
      </label>
      <input
        className="w-14 p-1 border border-zinc-200 rounded focus:outline-none focus:ring-1 focus:ring-zinc-300"
        id="page-input"
        max={totalPages}
        min="1"
        name="page"
        pattern="\d*"
        placeholder={`${totalPages}`}
        ref={inputRef}
        required
        type="number"
      />
      <button
        aria-label="특정 페이지로 이동"
        className="whitespace-nowrap bg-zinc-800 text-foreground rounded hover:bg-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-300"
        type="submit"
      >
        <IconArrow />
      </button>
    </form>
  )
}
