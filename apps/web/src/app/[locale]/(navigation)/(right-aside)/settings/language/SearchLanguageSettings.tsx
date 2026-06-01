'use client'

import type { PublicLocale } from '@litomi/domain/locale'

import { SEARCH_LANGUAGE_ALL } from '@litomi/domain/search/language'
import { Loader2 } from 'lucide-react'
import { useLocale } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'
import { twMerge } from 'tailwind-merge'

import CustomSelect from '@/components/ui/CustomSelect'
import usePatchMySettingsMutation from '@/query/usePatchMySettingsMutation'

import { readStoredSearchLanguage, writeStoredSearchLanguage } from '../../../search/searchLanguage'
import useSearchLanguageOptions from '../../../search/useSearchLanguageOptions'

type Props =
  | {
      isAuthenticated: false
      initialSearchLanguage?: never
    }
  | {
      isAuthenticated: true
      initialSearchLanguage: string
    }

const ALL_LANGUAGE_LABELS = {
  en: 'All languages',
  ja: 'すべての言語',
  ko: '모든 언어',
  'zh-CN': '所有语言',
} satisfies Record<PublicLocale, string>

export default function SearchLanguageSettings({ initialSearchLanguage, isAuthenticated }: Props) {
  const [{ savedLanguage, selectedLanguage }, setLanguageState] = useState(() => {
    const language = isAuthenticated ? initialSearchLanguage : readStoredSearchLanguage()
    return { savedLanguage: language, selectedLanguage: language }
  })

  const patchMySettingsMutation = usePatchMySettingsMutation()
  const languageOptions = useSearchLanguageOptions()
  const locale = useLocale()

  const isSaveDisabled = selectedLanguage === savedLanguage || patchMySettingsMutation.isPending
  const options = [{ value: SEARCH_LANGUAGE_ALL, label: ALL_LANGUAGE_LABELS[locale] }, ...languageOptions]

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isAuthenticated) {
      await patchMySettingsMutation.mutateAsync({ searchLanguage: selectedLanguage })
    } else {
      writeStoredSearchLanguage(selectedLanguage)
    }

    setLanguageState({ savedLanguage: selectedLanguage, selectedLanguage })
    toast.success('검색 언어 설정이 반영됐어요')
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <div className="grid gap-1">
        <label className="text-sm font-medium text-zinc-300" htmlFor="search-language">
          항상 검색할 작품 언어
        </label>
        <CustomSelect
          id="search-language"
          onChange={(value) => setLanguageState((current) => ({ ...current, selectedLanguage: value }))}
          options={options}
          value={selectedLanguage}
        />
        <p className="text-xs text-zinc-500">
          {selectedLanguage === SEARCH_LANGUAGE_ALL
            ? '새 검색은 언어 조건 없이 시작돼요'
            : '새 검색에 언어 조건이 없으면 검색어에 이 언어가 추가돼요'}
        </p>
      </div>
      <button
        className={twMerge(
          'px-4 py-2.5 mt-2 relative bg-brand font-medium text-background rounded-lg transition text-sm',
          'hover:bg-brand/90 disabled:opacity-50',
          'focus:outline-none focus:ring-2 focus:ring-brand/50 focus:ring-offset-2 focus:ring-offset-zinc-900',
          'w-full sm:w-auto sm:px-6',
        )}
        disabled={isSaveDisabled}
        type="submit"
      >
        {patchMySettingsMutation.isPending && (
          <Loader2 className="size-4 shrink-0 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" />
        )}
        저장
      </button>
    </form>
  )
}
