import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ReactNode, RefObject, useEffect } from 'react'
import { twMerge } from 'tailwind-merge'

export type SuggestionItem = {
  value: string
  label: string
  action?: ReactNode
  icon?: ReactNode
}

type Props<T extends SuggestionItem = SuggestionItem> = {
  className?: string
  header?: ReactNode
  id: string
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
  id,
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
  const t = useTranslations('Search.suggestionDropdown')

  // NOTE: 선택된 항목이 화면에 보이도록 자동으로 스크롤함
  useEffect(() => {
    if (selectedIndex >= 0 && dropdownRef?.current) {
      const selectedElement = dropdownRef.current.querySelector('[role="option"][aria-selected="true"]') as HTMLElement

      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex, dropdownRef])

  return (
    <div
      aria-hidden={!showSuggestions}
      className={twMerge(
        'absolute z-20 mt-1 w-full overflow-hidden rounded-[1.25rem] border border-zinc-800 bg-zinc-900/98 shadow-xl transition',
        'aria-hidden:opacity-0 aria-hidden:pointer-events-none',
        className,
      )}
      ref={dropdownRef}
    >
      <div className="max-h-64 overflow-y-auto relative">
        {header}
        {isLoading && suggestions.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-5 text-zinc-400 animate-spin" />
          </div>
        )}
        <div
          aria-busy={isFetching}
          className="transition aria-busy:opacity-60 text-sm font-medium"
          id={id}
          role="listbox"
        >
          {suggestions.map((suggestion, index) => (
            <div className="flex w-full items-stretch" key={`${suggestion.value}-${index}`}>
              <button
                aria-selected={selectedIndex === index}
                className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto p-4 py-2.5 text-left transition hover:bg-zinc-800/70 aria-selected:bg-zinc-800 scrollbar-hidden"
                id={`${id}-option-${index}`}
                onClick={() => onSelect(suggestion)}
                role="option"
                tabIndex={-1}
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
              {suggestion.action}
            </div>
          ))}
        </div>
        {suggestions.length === 0 && searchTerm && !isLoading && (
          <div className="text-center py-4 text-zinc-500 text-sm">{t('noResults')}</div>
        )}
      </div>
      {suggestions.length > 1 && (
        <div className="sticky bottom-0 border-t border-zinc-800 bg-zinc-900/95 px-3 py-2 text-xs text-zinc-500 backdrop-blur-sm">
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            <span className="whitespace-nowrap">
              <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1 py-0.5 text-xs">↑↓</kbd> {t('move')}
            </span>
            <span className="whitespace-nowrap">
              <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1 py-0.5 text-xs">Enter</kbd> {t('select')}
            </span>
            <span className="whitespace-nowrap">
              <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1 py-0.5 text-xs">Esc</kbd> {t('cancel')}
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
      <span className="text-brand">{matchedText}</span>
      {afterMatch}
    </>
  )
}
