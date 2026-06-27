import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { type ReactNode, type RefObject, useEffect } from 'react'
import { twMerge } from 'tailwind-merge'

export type SuggestionItem = {
  value: string
  label: string
  icon?: ReactNode
}

type Props<T extends SuggestionItem = SuggestionItem> = {
  className?: string
  header?: ReactNode
  id: string
  showSuggestions: boolean
  items: T[]
  selectedIndex: number
  isLoading?: boolean
  isFetching?: boolean
  searchTerm?: string
  onSelect: (item: T, index: number) => void
  renderRightContent?: (item: T, index: number) => ReactNode
  dropdownRef?: RefObject<HTMLDivElement | null>
}

export default function SuggestionDropdown<T extends SuggestionItem = SuggestionItem>({
  showSuggestions,
  header,
  id,
  className,
  items,
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
        'absolute z-20 mt-1 w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/97 shadow backdrop-blur-xs transition',
        'aria-hidden:opacity-0 aria-hidden:pointer-events-none',
        className,
      )}
      ref={dropdownRef}
    >
      <div className="max-h-64 overflow-y-auto relative">
        {header}
        {isLoading && items.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-5 text-zinc-400 animate-spin" />
          </div>
        )}
        <ul
          aria-busy={isFetching}
          className="list-none p-0 transition aria-busy:opacity-60 text-sm font-medium"
          id={id}
          role="listbox"
        >
          {items.map((item, index) => (
            <li
              aria-selected={selectedIndex === index}
              className="flex min-w-0 cursor-pointer items-center gap-1.5 overflow-x-auto p-4 py-2.5 text-left transition hover:bg-zinc-800/70 aria-selected:bg-zinc-800 scrollbar-hidden"
              id={`${id}-option-${index}`}
              key={`${item.value}-${index}`}
              onClick={() => onSelect(item, index)}
              role="option"
            >
              {item.icon}
              {item.value.endsWith(':') ? (
                <>
                  <span>{renderHighlightedText(item.value, searchTerm)}</span>
                  <span className="text-zinc-400 text-xs font-normal">{item.label}</span>
                </>
              ) : (
                <>
                  <span>{renderHighlightedText(item.value, searchTerm)}</span>
                  {item.label !== item.value && (
                    <span className="text-zinc-400 text-xs font-normal">
                      {renderHighlightedText(item.label, searchTerm)}
                    </span>
                  )}
                </>
              )}
              {renderRightContent?.(item, index)}
            </li>
          ))}
        </ul>
        {items.length === 0 && searchTerm && !isLoading && (
          <div className="text-center py-4 text-zinc-500 text-sm">{t('noResults')}</div>
        )}
      </div>
      {items.length > 1 && (
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
  const index = searchTerm ? text.toLowerCase().indexOf(searchTerm.toLowerCase()) : -1

  if (index === -1) {
    return <span>{text}</span>
  }

  const beforeMatch = text.slice(0, index)
  const matchedText = text.slice(index, index + searchTerm.length)
  const afterMatch = text.slice(index + searchTerm.length)

  return (
    <>
      <span>{beforeMatch}</span>
      <span className="text-brand">{matchedText}</span>
      <span>{afterMatch}</span>
    </>
  )
}
