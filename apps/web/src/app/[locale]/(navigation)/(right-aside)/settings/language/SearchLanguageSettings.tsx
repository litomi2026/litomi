'use client'

import { SEARCH_LANGUAGE_ALL } from '@litomi/domain/search/language'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
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

export default function SearchLanguageSettings({ initialSearchLanguage, isAuthenticated }: Props) {
  const [{ savedLanguage, selectedLanguage }, setLanguageState] = useState(() => {
    const language = isAuthenticated ? initialSearchLanguage : readStoredSearchLanguage()
    return { savedLanguage: language, selectedLanguage: language }
  })

  const patchMySettingsMutation = usePatchMySettingsMutation()
  const languageOptions = useSearchLanguageOptions()
  const t = useTranslations('Settings.searchLanguage')

  const isSaveDisabled = selectedLanguage === savedLanguage || patchMySettingsMutation.isPending
  const options = [{ value: SEARCH_LANGUAGE_ALL, label: t('allLanguages') }, ...languageOptions]

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()

    function handleSaved() {
      setLanguageState({ savedLanguage: selectedLanguage, selectedLanguage })
      toast.success(t('savedToast'))
    }

    if (isAuthenticated) {
      patchMySettingsMutation.mutate({ searchLanguage: selectedLanguage }, { onSuccess: handleSaved })
    } else {
      writeStoredSearchLanguage(selectedLanguage)
      handleSaved()
    }
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <div className="grid gap-1">
        <label className="text-sm font-medium text-zinc-300" htmlFor="search-language">
          <CustomSelect
            id="search-language"
            onChange={(value) => setLanguageState((current) => ({ ...current, selectedLanguage: value }))}
            options={options}
            value={selectedLanguage}
          />
        </label>
        <p className="text-xs text-zinc-500">
          {selectedLanguage === SEARCH_LANGUAGE_ALL ? t('allSelectedHelp') : t('selectedHelp')}
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
        {t('save')}
      </button>
    </form>
  )
}
