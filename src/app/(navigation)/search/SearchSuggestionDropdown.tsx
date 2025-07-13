import { memo, useEffect, useRef, useState } from 'react'

import type { SearchFilter } from './constants'

type Props = {
  suggestions: SearchFilter[]
  selectedIndex: number
  showHeader: boolean
  onSelect: (filter: SearchFilter) => void
  onMouseEnter: (index: number) => void
}

export default memo(SearchSuggestionDropdown)

function SearchSuggestionDropdown({ suggestions, selectedIndex, showHeader, onSelect, onMouseEnter }: Readonly<Props>) {
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [dropUp, setDropUp] = useState(false)

  // NOTE: 화면 크기에 따라 dropdown 크기와 위치를 조정함
  useEffect(() => {
    if (!dropdownRef.current) return

    const checkPosition = () => {
      const rect = dropdownRef.current?.getBoundingClientRect()
      if (!rect) return

      const viewportHeight = window.innerHeight
      const spaceBelow = viewportHeight - rect.top
      const spaceAbove = rect.top
      const shouldDropUp = spaceBelow < 300 && spaceAbove > spaceBelow
      setDropUp(shouldDropUp)
    }

    checkPosition()
    window.addEventListener('resize', checkPosition)
    window.addEventListener('scroll', checkPosition)

    return () => {
      window.removeEventListener('resize', checkPosition)
      window.removeEventListener('scroll', checkPosition)
    }
  }, [suggestions])

  // NOTE: 선택된 필터가 화면에 보이도록 자동으로 스크롤함
  useEffect(() => {
    if (selectedIndex >= 0) {
      const selectedElement = dropdownRef.current?.querySelector(`li:nth-child(${selectedIndex + 1}) button`)
      selectedElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [selectedIndex])

  return (
    <div
      className={`absolute left-0 right-0 overflow-hidden 
        bg-zinc-900 border-2 border-zinc-700 rounded-lg shadow-xl z-20
        sm:max-w-2xl sm:right-auto
        ${dropUp ? 'bottom-full mb-1' : 'top-full mt-1'}`}
      id="search-suggestions"
      ref={dropdownRef}
    >
      {showHeader && (
        <div className="sticky top-0 px-3 py-2 text-xs text-zinc-500 border-b border-zinc-800 bg-zinc-900 sm:px-4">
          사용 가능한 필터:
        </div>
      )}
      <ul className="overflow-y-auto max-h-[calc(80vh-6rem)] overscroll-contain">
        {suggestions.map((suggestion, index) => (
          <li key={suggestion.label}>
            <button
              className={`
                w-full px-3 py-2 text-left flex items-center justify-between gap-2
                transition text-sm sm:text-base sm:px-4
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
              <span className="font-mono flex-shrink-0">{suggestion.label}</span>
              <span className="text-xs text-zinc-500 truncate sm:text-sm">{suggestion.description}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="sticky bottom-0 px-3 py-2 text-xs text-zinc-500 border-t border-zinc-800 bg-zinc-900 sm:px-4">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <span className="whitespace-nowrap">
            <kbd className="px-1 py-0.5 text-xs bg-zinc-800 border border-zinc-700 rounded">↑↓</kbd> 이동
          </span>
          <span className="whitespace-nowrap">
            <kbd className="px-1 py-0.5 text-xs bg-zinc-800 border border-zinc-700 rounded">Enter</kbd> 선택
          </span>
          <span className="whitespace-nowrap">
            <kbd className="px-1 py-0.5 text-xs bg-zinc-800 border border-zinc-700 rounded">Esc</kbd> 닫기
          </span>
        </div>
      </div>
    </div>
  )
}
