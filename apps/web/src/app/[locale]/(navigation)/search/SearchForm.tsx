'use client'

import { MAX_SEARCH_QUERY_LENGTH } from '@litomi/domain/search/policy'
import { Toggle } from '@litomi/ui'
import { Clock, Loader2, Trash2, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ReadonlyURLSearchParams } from 'next/navigation'
import { SubmitEvent, useEffect, useRef, useState, useTransition } from 'react'
import { twMerge } from 'tailwind-merge'

import SearchParamsSync from '@/components/router/SearchParamsSync'
import { usePathname, useRouter } from '@/i18n/navigation'

import { SearchParam } from './constants'
import SuggestionDropdown from './SuggestionDropdown'
import useRecentSearches from './useRecentSearches'
import useSearchSuggestions from './useSearchSuggestions'
import useSuggestionSelection from './useSuggestionSelection'
import { getWordAtCursor, translateKoreanToEnglish } from './utils'

type Props = {
  className?: string
}

const SEARCH_SUGGESTIONS_ID = 'search-suggestions'

export default function SearchForm({ className = '' }: Props) {
  const [keyword, setKeyword] = useState('')
  const [cursorPosition, setCursorPosition] = useState(0)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const beforeDeletedCharacter = useRef('')
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations('Search.form')
  const [isSearching, startSearching] = useTransition()
  const currentWordInfo = getWordAtCursor(keyword, cursorPosition)

  const { recentSearches, isAutoSaveEnabled, saveRecentSearch, clearRecentSearches, setAutoSaveEnabled } =
    useRecentSearches()

  const { searchSuggestions, isLoading, isFetching } = useSearchSuggestions({
    keyword: currentWordInfo.word.replace(/^-/, ''),
  })

  const dropdownEntries = [
    ...(keyword === ''
      ? recentSearches.map((search) => ({
          icon: <Clock className="size-3 shrink-0 text-zinc-500" />,
          label: search.query,
          source: 'recent' as const,
          value: search.query,
        }))
      : []),
    ...searchSuggestions.map((suggestion) => ({
      ...suggestion,
      source: 'suggestion' as const,
    })),
  ]

  type SearchDropdownEntry = (typeof dropdownEntries)[number]

  const { activeDescendantId, navigateSelection, resetSelection, selectedIndex } = useSuggestionSelection({
    isOpen: showSuggestions,
    itemCount: dropdownEntries.length,
    listboxId: SEARCH_SUGGESTIONS_ID,
  })

  function handleClearRecentSearches() {
    clearRecentSearches()
    resetSelection()
    inputRef.current?.focus()
  }

  function selectDropdownEntry({ source, value }: SearchDropdownEntry) {
    const isRecent = source === 'recent'
    const newCursorPosition = isRecent ? value.length : currentWordInfo.start + value.length

    const newKeyword = isRecent
      ? value
      : keyword.slice(0, currentWordInfo.start) + value + keyword.slice(currentWordInfo.end)

    setKeyword(newKeyword)
    setCursorPosition(newCursorPosition)
    setShowSuggestions(false)
    resetSelection()
    inputRef.current?.focus()

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.selectionStart = inputRef.current.selectionEnd = newCursorPosition
      }
    }, 0)
  }

  function renderSuggestionRightContent({ source, value }: SearchDropdownEntry) {
    if (source === 'recent' || !value.endsWith(':')) {
      return null
    }

    return <span className="rounded-full bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-300">{t('prefix')}</span>
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Backspace') {
      beforeDeletedCharacter.current = ''
    }

    // NOTE: Backspace 키를 누르면 현재 단어를 선택하기
    if (e.key === 'Backspace' && inputRef.current) {
      const input = inputRef.current
      const { selectionStart, selectionEnd, value } = input

      if (selectionStart !== selectionEnd || !selectionStart || selectionStart <= 0) {
        beforeDeletedCharacter.current = ''
        return
      }

      const charBeforeCursor = value[selectionStart - 1]
      const charAtCursor = value[selectionStart]

      if (charBeforeCursor === ' ' || (charAtCursor && charAtCursor !== ' ')) {
        beforeDeletedCharacter.current = charBeforeCursor
        return
      }

      // Only select word if the previously deleted character was a space
      if (beforeDeletedCharacter.current !== ' ') {
        beforeDeletedCharacter.current = charBeforeCursor
        return
      }

      let wordStart = selectionStart - 1
      for (let i = 0; i < 100 && wordStart > 0 && value[wordStart - 1] !== ' '; i++) {
        wordStart--
      }

      const wordLength = selectionStart - wordStart

      if (wordLength < 3) {
        beforeDeletedCharacter.current = charBeforeCursor
        return
      }

      e.preventDefault()
      input.setSelectionRange(wordStart, selectionStart)
      beforeDeletedCharacter.current = ''
      return
    }

    if (!showSuggestions || dropdownEntries.length === 0) {
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
        if (selectedIndex >= 0 && selectedIndex < dropdownEntries.length) {
          e.preventDefault()
          selectDropdownEntry(dropdownEntries[selectedIndex])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        resetSelection()
        break
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    const position = e.target.selectionStart || 0

    setKeyword(value)
    setCursorPosition(position)
    setShowSuggestions(true)
    resetSelection()
  }

  function handleSelect(e: React.SyntheticEvent<HTMLInputElement>) {
    const target = e.target as HTMLInputElement
    setCursorPosition(target.selectionStart || 0)
  }

  function handleFocus() {
    setShowSuggestions(true)
    resetSelection()

    if (inputRef.current) {
      setCursorPosition(inputRef.current.selectionStart || 0)
    }
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    if (!suggestionsRef.current?.contains(e.relatedTarget)) {
      setTimeout(() => {
        resetSelection()
      }, 300)
    }
  }

  function handleClear() {
    setKeyword('')
    setCursorPosition(0)
    resetSelection()
    beforeDeletedCharacter.current = ''
    inputRef.current?.focus()
  }

  function onSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    setShowSuggestions(false)

    const params = new URLSearchParams(window.location.search)
    const newQuery = translateKoreanToEnglish(keyword).trim()

    if (newQuery) {
      params.set(SearchParam.QUERY, newQuery)
      if (isAutoSaveEnabled) {
        saveRecentSearch(newQuery)
      }
    } else {
      params.delete(SearchParam.QUERY)
    }

    startSearching(() => {
      router.push(`${pathname}?${params}`)
    })
  }

  function handleSearchParamUpdate(searchParams: ReadonlyURLSearchParams) {
    const query = searchParams.get(SearchParam.QUERY) ?? ''
    setKeyword(query)
    setCursorPosition(query.length)
  }

  // NOTE: "/" 키보드 단축키로 검색 입력창에 포커스
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey
      )
        return

      if (e.key === '/') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleGlobalKeyDown)
    return () => document.removeEventListener('keydown', handleGlobalKeyDown)
  }, [])

  // NOTE: 외부 영역 클릭 시 검색어 제안 창 닫기
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  return (
    <div className={`relative ${className}`}>
      <SearchParamsSync onUpdate={handleSearchParamUpdate} />
      <form
        className={twMerge(
          'flex items-center gap-1 rounded-2xl border border-zinc-700 bg-zinc-900/92 text-zinc-400 shadow-sm transition',
          'hover:border-zinc-600 hover:bg-zinc-900 focus-within:border-zinc-500 focus-within:bg-zinc-900',
        )}
        onSubmit={onSubmit}
      >
        <div className="relative flex-1">
          <input
            aria-activedescendant={activeDescendantId}
            aria-autocomplete="list"
            aria-controls={SEARCH_SUGGESTIONS_ID}
            aria-expanded={showSuggestions}
            autoCapitalize="off"
            autoComplete="off"
            className={twMerge(
              'bg-transparent px-3.5 py-2 pr-10 text-foreground min-w-0 w-full placeholder-zinc-500/95 leading-5 focus:outline-none',
              '[&::-webkit-search-cancel-button]:hidden [&::-webkit-search-cancel-button]:appearance-none',
              '[&::-ms-clear]:hidden [&::-ms-clear]:w-0 [&::-ms-clear]:h-0',
            )}
            maxLength={MAX_SEARCH_QUERY_LENGTH}
            name={SearchParam.QUERY}
            onBlur={handleBlur}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            onSelect={handleSelect}
            placeholder={t('placeholder')}
            ref={inputRef}
            role="combobox"
            type="search"
            value={keyword}
          />
          {keyword && (
            <button
              aria-label={t('clear')}
              className={twMerge(
                'absolute right-1 top-1/2 -translate-y-1/2 rounded-full p-1.5 shrink-0 transition text-zinc-500',
                'hover:bg-zinc-800/70 hover:text-foreground active:text-zinc-300',
              )}
              onClick={handleClear}
              type="button"
            >
              <X className="size-5" />
            </button>
          )}
        </div>
        <button
          aria-label={t('submit')}
          className={twMerge(
            'flex items-center justify-center rounded-[0.95rem] bg-foreground px-3.5 py-2 shrink-0 text-sm font-bold text-background',
            'shadow-sm transition disabled:opacity-60 active:scale-[0.98] hover:opacity-90',
            'focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:ring-inset',
          )}
          disabled={isSearching}
          type="submit"
        >
          {isSearching ? (
            <Loader2 className="size-5 shrink-0 mx-0.5 animate-spin" />
          ) : (
            <span className="block min-w-6">{t('submitLabel')}</span>
          )}
        </button>
      </form>
      <SuggestionDropdown
        dropdownRef={suggestionsRef}
        header={
          keyword === '' && (
            <div className="border-b border-zinc-800">
              <div className="flex items-center justify-between px-4 py-1">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <Clock className="size-3" />
                  <span>{t('recentSearches')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {recentSearches.length > 0 && (
                    <button
                      aria-label={t('clearRecentSearches')}
                      className={twMerge(
                        '-my-1 flex size-8 shrink-0 items-center justify-center rounded-md text-zinc-500 transition',
                        'hover:text-red-300 active:text-red-200',
                        'focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:ring-inset',
                      )}
                      onClick={handleClearRecentSearches}
                      title={t('clearRecentSearches')}
                      type="button"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-xs text-zinc-500">{t('autoSave')}</span>
                    <Toggle
                      aria-label={t('autoSaveLabel')}
                      checked={isAutoSaveEnabled}
                      className="w-10 peer-checked:bg-brand/80"
                      onToggle={setAutoSaveEnabled}
                    />
                  </label>
                </div>
              </div>
              {recentSearches.length === 0 && (
                <div className="p-2.5 text-center text-sm text-zinc-500">
                  {isAutoSaveEnabled ? t('emptyRecentEnabled') : t('emptyRecentDisabled')}
                </div>
              )}
            </div>
          )
        }
        id={SEARCH_SUGGESTIONS_ID}
        isFetching={isFetching}
        isLoading={isLoading}
        items={dropdownEntries}
        onSelect={selectDropdownEntry}
        renderRightContent={renderSuggestionRightContent}
        searchTerm={currentWordInfo.word}
        selectedIndex={selectedIndex}
        showSuggestions={showSuggestions}
      />
    </div>
  )
}
