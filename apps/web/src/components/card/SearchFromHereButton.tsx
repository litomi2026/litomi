'use client'

import { Loader2, Search } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useTransition } from 'react'

import { SearchParam as SearchPageSearchParam } from '@/app/[locale]/(navigation)/search/constants'
import { useRouter } from '@/i18n/navigation'

type Props = {
  className?: string
  isDefaultSort: boolean
  mangaId: number
}

export default function SearchFromHereButton({ className = '', isDefaultSort, mangaId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const t = useTranslations('Common.mangaCard.searchFromHere')
  const isDisabled = !isDefaultSort || isPending

  function handleSearchFromHere() {
    const params = new URLSearchParams(window.location.search)
    params.set(SearchPageSearchParam.NEXT_ID, (mangaId + 1).toString())

    startTransition(() => {
      router.push(`/search?${params}`)
    })
  }

  return (
    <button
      className={`flex justify-center items-center gap-1 ${className}`}
      disabled={isDisabled}
      onClick={handleSearchFromHere}
      title={isDefaultSort ? t('title') : t('disabledTitle')}
      type="button"
    >
      {isPending ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4 shrink-0" />}
      <span className="text-sm font-medium whitespace-nowrap">
        <span>{t('prefix')}</span>
        <span className="hidden sm:inline">{t('suffix')}</span>
      </span>
    </button>
  )
}
