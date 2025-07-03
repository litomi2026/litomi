import { memo } from 'react'

import type { SearchFilter } from './searchConstants'

type Props = {
  suggestions: SearchFilter[]
  selectedIndex: number
  showHeader: boolean
  onSelect: (filter: SearchFilter) => void
  onMouseEnter: (index: number) => void
}

export default memo(SearchSuggestionDropdown)

function SearchSuggestionDropdown({ suggestions, selectedIndex, showHeader, onSelect, onMouseEnter }: Props) {
  return (
    <div
      className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border-2 border-zinc-700 rounded-lg shadow-xl z-20"
      id="search-suggestions"
    >
      {showHeader && <div className="px-4 py-2 text-xs text-zinc-500 border-b border-zinc-800">사용 가능한 필터:</div>}
      <ul className="py-1">
        {suggestions.map((suggestion, index) => (
          <li key={suggestion.label}>
            <button
              className={`
                w-full px-4 py-2 text-left flex items-center justify-between
                transition-colors
                ${
                  index === selectedIndex
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                }
              `}
              onClick={() => onSelect(suggestion)}
              onMouseEnter={() => onMouseEnter(index)}
              type="button"
            >
              <span className="font-mono">{suggestion.label}</span>
              <span className="text-sm text-zinc-500">{suggestion.description}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="px-4 py-2 text-xs text-zinc-500 border-t border-zinc-800">
        <kbd className="px-1 py-0.5 text-xs bg-zinc-800 border border-zinc-700 rounded">↑↓</kbd> 이동
        <kbd className="px-1 py-0.5 ml-2 text-xs bg-zinc-800 border border-zinc-700 rounded">Enter</kbd> 선택
        <kbd className="px-1 py-0.5 ml-2 text-xs bg-zinc-800 border border-zinc-700 rounded">Esc</kbd> 닫기
      </div>
    </div>
  )
}
