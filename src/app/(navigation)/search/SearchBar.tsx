'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { FormEvent, useState, useTransition } from 'react'

type Props = {
  className?: string
}

export default function SearchBar({ className = '' }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [keyword, setKeyword] = useState(() => searchParams.get('query') ?? '')
  const [isPending, startTransition] = useTransition()

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()

    const params = new URLSearchParams(searchParams.toString())

    if (keyword.trim()) {
      params.set('query', keyword.trim())
    } else {
      params.delete('query')
    }

    startTransition(() => {
      router.replace(`${pathname}?${params}`, { scroll: false })
    })
  }

  return (
    <form
      className={`relative flex bg-zinc-900 border-2 border-zinc-700 rounded-xl text-zinc-400 text-base
        overflow-hidden ${className}`}
      onSubmit={onSubmit}
    >
      <input
        className="
          flex-1 bg-transparent px-3 py-1 text-foreground
          placeholder-zinc-500
          focus:outline-none
        "
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="검색어를 입력하세요"
        type="search"
        value={keyword}
      />
      <button
        className="
          px-3 py-1 shrink-0
          rounded-l-none transition 
          bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-800
          aria-disabled:opacity-60
        "
        disabled={isPending}
        type="submit"
      >
        검색
      </button>
    </form>
  )
}
