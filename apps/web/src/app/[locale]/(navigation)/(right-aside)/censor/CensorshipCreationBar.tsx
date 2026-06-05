'use client'

import type { POSTV1CensorshipCreateResponse } from '@litomi/contracts'

import { CensorshipKey, CensorshipLevel } from '@litomi/domain/censorship/model'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Info, Loader2, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { twMerge } from 'tailwind-merge'

import SuggestionDropdown from '@/app/[locale]/(navigation)/search/SuggestionDropdown'
import useAdultAccessGuard from '@/hook/useAdultAccessGuard'
import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'

import { CENSORSHIP_CATEGORIES, DEFAULT_CENSORSHIP_VALUES } from './constants'
import useCensorshipSuggestions, { type CensorshipSuggestion } from './useCensorshipSuggestions'

export default function CensorshipCreationBar() {
  const t = useTranslations('Censorship')
  const [showHelp, setShowHelp] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [cursorPosition, setCursorPosition] = useState(0)
  const formRef = useRef<HTMLFormElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()
  const { guardAdultAccess } = useAdultAccessGuard()

  const addMutation = useMutation({
    mutationFn: async (items: { key: CensorshipKey; value: string; level: CensorshipLevel }[]) => {
      const url = '/api/v1/censorship'

      const { data } = await fetchAPIData<POSTV1CensorshipCreateResponse>(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ items }),
      })

      return data.ids
    },

    onSuccess: (ids) => {
      toast.success(t('creationBar.addSuccessToast', { count: ids.length }))
      setInputValue('')
      setCursorPosition(0)
      setShowSuggestions(false)
      resetSelection()
      inputRef.current?.blur()
      queryClient.invalidateQueries({ queryKey: QueryKeys.censorship })
    },
  })

  const {
    suggestions,
    selectedIndex,
    resetSelection,
    navigateSelection,
    selectSuggestion,
    currentWord,
    debouncedWord,
    isLoading,
    isFetching,
  } = useCensorshipSuggestions({
    inputValue,
    cursorPosition,
  })

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!guardAdultAccess()) {
      return
    }

    if (!inputValue.trim()) {
      toast.warning(t('creationBar.emptyInputToast'))
      return
    }

    const items = inputValue
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)

    if (items.length === 0) {
      toast.warning(t('creationBar.emptyInputToast'))
      return
    }

    const payload = items.map((item) => {
      const { key, value } = detectTypeAndValue(item)
      return { key, value, level: CensorshipLevel.LIGHT }
    })

    addMutation.mutate(payload)
  }

  function updateCursorPosition() {
    if (inputRef.current) {
      setCursorPosition(inputRef.current.selectionStart || 0)
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    const position = e.target.selectionStart || 0

    setInputValue(value)
    setCursorPosition(position)
    setShowSuggestions(true)
    resetSelection()
  }

  function handleFocus() {
    setShowSuggestions(true)
    resetSelection()
    updateCursorPosition()
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    if (!suggestionsRef.current?.contains(e.relatedTarget)) {
      setTimeout(() => {
        setShowSuggestions(false)
        resetSelection()
      }, 200)
    }
  }

  function handleSelectSuggestion(suggestion: CensorshipSuggestion) {
    const newValue = selectSuggestion(suggestion)
    const newCursorPos = currentWord.start + suggestion.value.length

    setInputValue(newValue)
    setCursorPosition(newCursorPos)
    setShowSuggestions(false)
    resetSelection()
    inputRef.current?.focus()

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.selectionStart = inputRef.current.selectionEnd = newCursorPos
      }
    }, 0)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault()
        formRef.current?.requestSubmit()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        navigateSelection('down')
        break
      case 'ArrowUp':
        e.preventDefault()
        navigateSelection('up')
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0) {
          handleSelectSuggestion(suggestions[selectedIndex])
        } else {
          formRef.current?.requestSubmit()
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        resetSelection()
        break
      case 'Tab':
        if (selectedIndex >= 0) {
          e.preventDefault()
          handleSelectSuggestion(suggestions[selectedIndex])
        }
        break
    }
  }

  return (
    <div className="space-y-2 relative">
      <form className="relative" onSubmit={handleSubmit} ref={formRef}>
        <input
          autoCapitalize="off"
          autoComplete="off"
          className={twMerge(
            'h-11 w-full rounded-lg border border-zinc-800 bg-zinc-950/45 pl-3 pr-24 outline-none transition',
            'placeholder:text-zinc-500 focus:border-zinc-600 focus:bg-zinc-950/65 focus:ring-2 focus:ring-brand/15 disabled:cursor-not-allowed disabled:opacity-50',
          )}
          disabled={addMutation.isPending}
          name="censorships"
          onBlur={handleBlur}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          onSelect={updateCursorPosition}
          placeholder={t('creationBar.inputPlaceholder')}
          ref={inputRef}
          type="text"
          value={inputValue}
        />
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <button
            className="rounded-md p-2 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-300"
            onClick={() => setShowHelp((value) => !value)}
            title={t('creationBar.helpButtonTitle')}
            type="button"
          >
            <Info className="size-4 shrink-0" />
          </button>
          <button
            className="rounded-md px-2.5 py-1.5 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800 disabled:bg-transparent disabled:text-zinc-600"
            disabled={addMutation.isPending}
            title={t('creationBar.submitButtonTitle')}
            type="submit"
          >
            {addMutation.isPending ? <Loader2 className="size-4 shrink-0 animate-spin" /> : t('creationBar.submit')}
          </button>
        </div>
      </form>
      <SuggestionDropdown
        dropdownRef={suggestionsRef}
        isFetching={isFetching}
        isLoading={isLoading}
        onSelect={handleSelectSuggestion}
        renderRightContent={({ value }) =>
          value.endsWith(':') ? (
            <span className="text-xs text-zinc-400 bg-zinc-700/50 px-1.5 py-0.5 rounded">
              {t('creationBar.prefixBadge')}
            </span>
          ) : DEFAULT_CENSORSHIP_VALUES.some((item) => item.value === value) ? (
            <span className="text-xs text-orange-500 mt-0.5">{t('creationBar.defaultTagBadge')}</span>
          ) : null
        }
        searchTerm={debouncedWord}
        selectedIndex={selectedIndex}
        showSuggestions={showSuggestions}
        suggestions={suggestions}
      />
      {showHelp ? (
        <div className={`overflow-hidden`}>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/45 p-3 text-sm space-y-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-zinc-300">{t('creationBar.helpTitle')}</h3>
              <button
                className="p-1 rounded hover:bg-zinc-700/50 transition"
                onClick={() => setShowHelp(false)}
                type="button"
              >
                <X className="size-3 shrink-0" />
              </button>
            </div>
            <div className="space-y-2 text-zinc-400">
              <div>
                <p className="font-medium text-zinc-300 mb-1">{t('creationBar.basicFormatTitle')}</p>
                <p>
                  • {t('creationBar.tagExampleLabel')}: <code className="text-zinc-300">scat</code>
                </p>
                <p>
                  • {t('creationBar.multipleExampleLabel')}: <code className="text-zinc-300">scat, gore, guro</code>
                </p>
              </div>
              <div>
                <p className="font-medium text-zinc-300 mb-1">{t('creationBar.specificTypeTitle')}</p>
                <p>
                  • {t('common.keys.artist')}: <code className="text-zinc-300">artist:name</code>
                </p>
                <p>
                  • {t('common.keys.group')}: <code className="text-zinc-300">group:zenmai_kourogi</code>
                </p>
                <p>
                  • {t('common.keys.series')}: <code className="text-zinc-300">series:title</code>
                </p>
                <p>
                  • {t('common.keys.character')}: <code className="text-zinc-300">character:name</code>
                </p>
                <p>
                  • {t('common.keys.language')}: <code className="text-zinc-300">language:chinese</code>
                </p>
                <p>
                  • {t('common.keys.type')}: <code className="text-zinc-300">type:western</code>,{' '}
                  <code className="text-zinc-300">type:misc</code>
                </p>
              </div>
              <div>
                <p className="font-medium text-zinc-300 mb-1">{t('creationBar.tagCategoryTitle')}</p>
                <p>
                  • {t('creationBar.femaleTagLabel')}: <code className="text-zinc-300">female:furry</code>
                </p>
                <p>
                  • {t('creationBar.maleTagLabel')}: <code className="text-zinc-300">male:males_only</code>
                </p>
                <p>
                  • {t('creationBar.mixedTagLabel')}: <code className="text-zinc-300">mixed:incest</code>
                </p>
                <p>
                  • {t('creationBar.otherTagLabel')}: <code className="text-zinc-300">other:ai_generated</code>
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <p className="px-1 text-xs leading-5 text-zinc-500 sm:line-clamp-1 sm:break-all">{t('creationBar.hint')}</p>
      )}
    </div>
  )
}

function detectTypeAndValue(text: string): { key: CensorshipKey; value: string } {
  const trimmed = text.trim()

  for (const { prefix, key } of CENSORSHIP_CATEGORIES) {
    if (trimmed.toLowerCase().startsWith(prefix)) {
      return {
        key,
        value: trimmed.slice(prefix.length).trim(),
      }
    }
  }

  return {
    key: CensorshipKey.TAG,
    value: trimmed,
  }
}
