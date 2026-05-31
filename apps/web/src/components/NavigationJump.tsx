'use client'

import { ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRef } from 'react'

import { useRouter } from '@/i18n/navigation'

type Props = {
  totalPages: number
  hrefPrefix?: string
  hrefSuffix?: string
}

export default function NavigationJump({ totalPages, hrefPrefix = '', hrefSuffix = '' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const t = useTranslations('Common.pagination')

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const page = Number(inputRef.current?.value)

    if (!Number.isSafeInteger(page) || page < 1 || page > totalPages) {
      return
    }

    router.push(`${hrefPrefix}${page}${hrefSuffix}`)
  }

  function handleInput(event: React.InputEvent<HTMLInputElement>) {
    event.currentTarget.value = event.currentTarget.value.replace(/\D/g, '')
  }

  return (
    <form className="flex gap-2 relative sm:hidden" onSubmit={handleSubmit}>
      <label className="sr-only" htmlFor="page-input">
        {t('jumpInputLabel')}
      </label>
      <input
        className="w-14 p-1 border border-zinc-200 rounded focus:outline-none focus:ring-1 focus:ring-zinc-300"
        id="page-input"
        inputMode="numeric"
        name="page"
        onInput={handleInput}
        pattern="[1-9][0-9]*"
        placeholder={`${totalPages}`}
        ref={inputRef}
        required
        type="text"
      />
      <button
        aria-label={t('jumpAction')}
        className="whitespace-nowrap p-2 bg-zinc-800 text-foreground rounded hover:bg-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-300"
        type="submit"
      >
        <ArrowRight />
      </button>
    </form>
  )
}
