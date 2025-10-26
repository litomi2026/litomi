import { ReactNode, RefObject, useEffect } from 'react'

import IconSpinner from '@/components/icons/IconSpinner'

export type SuggestionItem = {
  value: string
  label: string
  icon?: ReactNode
}

type Props<T extends SuggestionItem = SuggestionItem> = {
  className?: string
  header?: ReactNode
  showSuggestions: boolean
  suggestions: T[]
  selectedIndex: number
  isLoading?: boolean
  isFetching?: boolean
  searchTerm?: string
  onSelect: (suggestion: T) => void
  renderRightContent?: (suggestion: T) => ReactNode
  dropdownRef?: RefObject<HTMLDivElement | null>
}

export default function SuggestionDropdown<T extends SuggestionItem = SuggestionItem>({
  showSuggestions,
  header,
  className,
  suggestions,
  selectedIndex,
  isLoading,
  isFetching,
  searchTerm = '',
  onSelect,
  renderRightContent,
  dropdownRef,
}: Props<T>) {
  // NOTE: 선택된 항목이 화면에 보이도록 자동으로 스크롤함
  useEffect(() => {
    if (selectedIndex >= 0 && dropdownRef?.current) {
      const selectedElement = dropdownRef.current.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement

      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex, dropdownRef])

  return (
    <div
      aria-hidden={!showSuggestions}
      className={`absolute z-20 w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg overflow-hidden transition
      aria-hidden:opacity-0 aria-hidden:pointer-events-none ${className}`}
      ref={dropdownRef}
    >
      <div className="max-h-64 overflow-y-auto relative">
        {header}
        {isLoading && suggestions.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <IconSpinner className="w-5 text-zinc-400" />
          </div>
        )}
        <div aria-busy={isFetching} className="transition aria-busy:opacity-60 text-sm font-medium">
          {suggestions.map((suggestion, index) => (
            <button
              aria-current={selectedIndex === index}
              className="w-full p-4 py-2.5 text-left hover:bg-zinc-700/50 transition flex items-center justify-between gap-1.5 overflow-x-auto scrollbar-hidden aria-current:bg-zinc-700/70"
              data-index={index}
              key={suggestion.value}
              onClick={() => onSelect(suggestion)}
              type="button"
            >
              {suggestion.icon}
              {suggestion.value.endsWith(':') ? (
                <>
                  <span>{renderHighlightedText(suggestion.value, searchTerm)}</span>
                  <span className="text-zinc-400 text-xs font-normal">{suggestion.label}</span>
                </>
              ) : (
                <>
                  <span>{renderHighlightedText(suggestion.value, searchTerm)}</span>
                  {suggestion.label !== suggestion.value && (
                    <span className="text-zinc-400 text-xs font-normal">
                      {renderHighlightedText(suggestion.label, searchTerm)}
                    </span>
                  )}
                </>
              )}
              {renderRightContent?.(suggestion)}
            </button>
          ))}
        </div>
        {suggestions.length === 0 && searchTerm && !isLoading && (
          <div className="text-center py-4 text-zinc-500 text-sm">검색 결과가 없습니다</div>
        )}
      </div>
      {suggestions.length > 1 && (
        <div className="sticky bottom-0 px-3 py-2 text-xs text-zinc-500 border-t border-zinc-800 bg-zinc-900/95 backdrop-blur-sm">
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            <span className="whitespace-nowrap">
              <kbd className="px-1 py-0.5 text-xs bg-zinc-800 border border-zinc-700 rounded">↑↓</kbd> 이동
            </span>
            <span className="whitespace-nowrap">
              <kbd className="px-1 py-0.5 text-xs bg-zinc-800 border border-zinc-700 rounded">Enter</kbd> 선택
            </span>
            <span className="whitespace-nowrap">
              <kbd className="px-1 py-0.5 text-xs bg-zinc-800 border border-zinc-700 rounded">Esc</kbd> 취소
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

function renderHighlightedText(text: string, searchTerm: string) {
  if (!searchTerm) {
    return text
  }

  const lowerText = text.toLowerCase()
  const lowerSearchTerm = searchTerm.toLowerCase()
  const index = lowerText.indexOf(lowerSearchTerm)

  if (index === -1) {
    return text
  }

  const beforeMatch = text.slice(0, index)
  const matchedText = text.slice(index, index + searchTerm.length)
  const afterMatch = text.slice(index + searchTerm.length)

  return (
    <>
      {beforeMatch}
      <span className="text-brand-end">{matchedText}</span>
      {afterMatch}
    </>
  )
}
