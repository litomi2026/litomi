'use client'

import { X } from 'lucide-react'
import dynamic from 'next/dynamic'
import { ReadonlyURLSearchParams, usePathname, useRouter } from 'next/navigation'
import { FormEvent, memo, Suspense, useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'

import IconSpinner from '@/components/icons/IconSpinner'
import { MAX_SEARCH_QUERY_LENGTH } from '@/constants/policy'

import { type SearchSuggestion } from './constants'
import UpdateFromSearchParams from './UpdateFromSearchParams'
import useSearchSuggestions from './useSearchSuggestions'
import { getWordAtCursor, translateKoreanToEnglish } from './utils'

// NOTE: 드롭다운은 사용자가 검색어를 입력할 때만 표시되므로 초기 bundle 크기를 줄이기 위해 dynamic import 사용
const SearchSuggestionDropdown = dynamic(() => import('./SearchSuggestionDropdown'))

type Props = {
  className?: string
}

export default memo(SearchForm)

function SearchForm({ className = '' }: Readonly<Props>) {
  const router = useRouter()
  const pathname = usePathname()
  const [keyword, setKeyword] = useState('')
  const [cursorPosition, setCursorPosition] = useState(0)
  const [isSearching, startSearching] = useTransition()
  const [_, startClosing] = useTransition()
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const currentWordInfo = useMemo(() => getWordAtCursor(keyword, cursorPosition), [keyword, cursorPosition])

  const { selectedIndex, setSelectedIndex, searchSuggestions, showHeader, resetSelection, navigateSelection } =
    useSearchSuggestions({ keyword: currentWordInfo.word.replace(/^-/g, '') })

  const selectSuggestion = useCallback(
    (suggestion: SearchSuggestion) => {
      const before = keyword.slice(0, currentWordInfo.start)
      const after = keyword.slice(currentWordInfo.end)
      const newKeyword = before + suggestion.value + after
      const newCursorPosition = currentWordInfo.start + suggestion.value.length

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
    },
    [keyword, currentWordInfo, setShowSuggestions, resetSelection],
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || searchSuggestions.length === 0) {
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
        if (selectedIndex >= 0) {
          e.preventDefault()
          selectSuggestion(searchSuggestions[selectedIndex])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        resetSelection()
        break
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const position = e.target.selectionStart || 0

    setKeyword(value)
    setCursorPosition(position)
    setShowSuggestions(currentWordInfo.word.length >= 0)
    resetSelection()
  }

  const handleSelect = (e: React.SyntheticEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement
    setCursorPosition(target.selectionStart || 0)
  }

  const handleFocus = () => {
    setShowSuggestions(true)
    resetSelection()

    if (inputRef.current) {
      setCursorPosition(inputRef.current.selectionStart || 0)
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!suggestionsRef.current?.contains(e.relatedTarget)) {
      startClosing(() => {
        setShowSuggestions(false)
        resetSelection()
      })
    }
  }

  const handleClear = () => {
    setKeyword('')
    setCursorPosition(0)
    setShowSuggestions(false)
    resetSelection()
    inputRef.current?.focus()
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    setShowSuggestions(false)

    const params = new URLSearchParams(window.location.search)

    if (keyword.trim()) {
      const convertedQuery = keyword.trim()
      const translatedKeyword = translateKoreanToEnglish(convertedQuery)
      params.set('query', translatedKeyword || convertedQuery)
    } else {
      params.delete('query')
    }

    startSearching(() => {
      router.push(`${pathname}?${params}`)
    })
  }

  const handleSearchParamUpdate = useCallback((searchParams: ReadonlyURLSearchParams) => {
    const query = searchParams.get('query') ?? ''
    setKeyword(query)
    setCursorPosition(query.length)
  }, [])

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
  }, [setShowSuggestions])

  return (
    <div className={`relative ${className}`}>
      <UpdateFromSearchParams onUpdate={handleSearchParamUpdate} />
      <form
        className="flex bg-zinc-900 border-2 border-zinc-700 rounded-xl text-zinc-400
          overflow-hidden transition duration-200
          hover:border-zinc-500 focus-within:border-zinc-400 focus-within:shadow-lg focus-within:shadow-zinc-400/30"
        onSubmit={onSubmit}
      >
        <div className="relative flex-1">
          <input
            aria-autocomplete="list"
            aria-controls="search-suggestions"
            aria-label="검색어 입력"
            autoCapitalize="off"
            autoComplete="off"
            className="bg-transparent px-3 py-2 pr-8 text-foreground min-w-0 w-full placeholder-zinc-500 text-base
            focus:outline-none
            [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-cancel-button]:appearance-none
            [&::-ms-clear]:hidden [&::-ms-clear]:w-0 [&::-ms-clear]:h-0"
            maxLength={MAX_SEARCH_QUERY_LENGTH}
            name="query"
            onBlur={handleBlur}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            onSelect={handleSelect}
            placeholder="/ 키를 눌러 검색하기"
            ref={inputRef}
            type="search"
            value={keyword}
          />
          {keyword && (
            <button
              aria-label="검색어 지우기"
              className="absolute right-0 top-0 bottom-0 p-2 shrink-0 transition duration-200 text-zinc-500 
              hover:text-zinc-300 active:text-zinc-400"
              onClick={handleClear}
              type="button"
            >
              <X className="size-5" />
            </button>
          )}
        </div>
        <button
          aria-label="검색하기"
          className="flex items-center justify-center p-2 px-4 shrink-0 font-medium rounded-l-none transition duration-200
          aria-disabled:opacity-60 bg-zinc-800 text-zinc-200 
          active:bg-zinc-800 hover:bg-zinc-700 hover:text-white
          focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-inset"
          disabled={isSearching}
          type="submit"
        >
          {isSearching ? <IconSpinner className="w-5 mx-1" /> : <span className="block min-w-7">검색</span>}
        </button>
      </form>
      {showSuggestions && searchSuggestions.length > 0 && (
        <Suspense>
          <div ref={suggestionsRef}>
            <SearchSuggestionDropdown
              className="max-w-full sm:right-auto"
              onMouseEnter={setSelectedIndex}
              onSelect={selectSuggestion}
              selectedIndex={selectedIndex}
              showHeader={showHeader}
              suggestions={searchSuggestions}
            />
          </div>
        </Suspense>
      )}
    </div>
  )
}
