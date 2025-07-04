'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { FormEvent, lazy, Suspense, useCallback, useEffect, useRef, useState, useTransition } from 'react'

import IconSpinner from '@/components/icons/IconSpinner'

import { SEARCH_FILTERS, type SearchFilter } from './searchConstants'
import useSearchSuggestions from './useSearchSuggestions'

// NOTE: 초기 bundle 크기를 줄이기 위해 lazy import 사용
const SearchSuggestionDropdown = lazy(() => import('./SearchSuggestionDropdown'))

type Props = {
  className?: string
}

export default function SearchForm({ className = '' }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const query = searchParams.get('query') ?? ''
  const [keyword, setKeyword] = useState(() => query)
  const [isPending, startTransition] = useTransition()

  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  const {
    showSuggestions,
    setShowSuggestions,
    selectedIndex,
    setSelectedIndex,
    filteredSuggestions,
    showHeader,
    resetSelection,
    navigateSelection,
  } = useSearchSuggestions(keyword)

  const selectSuggestion = useCallback(
    (filter: SearchFilter) => {
      const words = keyword.split(' ')
      words[words.length - 1] = filter.label
      const newKeyword = words.join(' ')
      setKeyword(newKeyword)
      setShowSuggestions(false)
      resetSelection()
      inputRef.current?.focus()

      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.selectionStart = inputRef.current.selectionEnd = newKeyword.length
        }
      }, 0)
    },
    [keyword, setShowSuggestions, resetSelection],
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || filteredSuggestions.length === 0) return

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
          selectSuggestion(filteredSuggestions[selectedIndex])
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
    setKeyword(value)

    const lastWord = value.split(' ').pop()?.toLowerCase() || ''
    const shouldShow =
      lastWord === '' ||
      SEARCH_FILTERS.some((filter) => filter.label.toLowerCase().startsWith(lastWord) && lastWord !== filter.label)
    setShowSuggestions(shouldShow)
    resetSelection()
  }

  const handleFocus = () => {
    setShowSuggestions(true)
    resetSelection()
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    setShowSuggestions(false)

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

  // NOTE: URL의 query 값이 변경되면 검색어도 업데이트함
  useEffect(() => {
    setKeyword(query)
  }, [query])

  return (
    <div className={`relative ${className}`}>
      <form
        className="flex bg-zinc-900 border-2 border-zinc-700 rounded-xl text-zinc-400 text-base
          overflow-hidden transition duration-200
          hover:border-zinc-500 focus-within:border-zinc-400 focus-within:shadow-lg focus-within:shadow-zinc-400/30"
        onSubmit={onSubmit}
      >
        <input
          aria-autocomplete="list"
          aria-controls="search-suggestions"
          aria-label="검색어 입력"
          className="
            flex-1 bg-transparent px-3 py-2 text-foreground
            placeholder-zinc-500
            focus:outline-none
          "
          name="query"
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder="검색어를 입력하세요"
          ref={inputRef}
          type="search"
          value={keyword}
        />
        <button
          aria-label="검색 실행"
          className="
            px-4 py-2 shrink-0 font-medium
            rounded-l-none transition duration-200
            bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-800
            text-zinc-200 hover:text-white
            aria-disabled:opacity-60
            focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-inset
            min-w-16 flex items-center justify-center
          "
          disabled={isPending}
          type="submit"
        >
          {isPending ? <IconSpinner className="w-5" /> : <span className="block">검색</span>}
        </button>
      </form>
      {showSuggestions && filteredSuggestions.length > 0 && (
        <Suspense fallback={null}>
          <div ref={suggestionsRef}>
            <SearchSuggestionDropdown
              onMouseEnter={setSelectedIndex}
              onSelect={selectSuggestion}
              selectedIndex={selectedIndex}
              showHeader={showHeader}
              suggestions={filteredSuggestions}
            />
          </div>
        </Suspense>
      )}
    </div>
  )
}
