'use client'

import { LOCALE_LANGUAGE_TAGS } from '@litomi/domain/locale'
import { ChevronDown } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import type { ReactNode, Ref } from 'react'
import { useImperativeHandle, useRef, useState } from 'react'
import type { VirtuosoHandle } from 'react-virtuoso'
import { Virtuoso } from 'react-virtuoso'
import { twMerge } from 'tailwind-merge'
import { dayKey, formatDateSeparator } from '../_lib/chat'

const START_INDEX = 1_000_000

export interface ChatMessageListHandle {
  scrollToBottom: (behavior?: 'auto' | 'smooth') => void
  scrollToKey: (
    key: string,
    options?: {
      align?: 'center' | 'end' | 'start'
      behavior?: 'auto' | 'smooth'
    },
  ) => void
}

interface ChatMessageListProps<TItem> {
  banner?: ReactNode
  bottomInsetClassName?: string
  className?: string
  /** When provided, a date chip is inserted before the first message of each local day. */
  dateOf?: (item: TItem) => number
  emptyState?: ReactNode
  gapClassName?: string
  hasOlder?: boolean
  isLoadingOlder?: boolean
  itemKey: (item: TItem) => string
  items: readonly TItem[]
  onLoadOlder?: () => void
  ref?: Ref<ChatMessageListHandle>
  renderItem: (item: TItem) => ReactNode
  scrollButtonClassName?: string
}

export default function ChatMessageList<TItem>({
  banner,
  bottomInsetClassName = '',
  className,
  dateOf,
  emptyState,
  gapClassName = 'pb-4',
  hasOlder = false,
  isLoadingOlder = false,
  itemKey,
  items,
  onLoadOlder,
  ref,
  renderItem,
  scrollButtonClassName = 'bottom-4 right-4',
}: ChatMessageListProps<TItem>) {
  const [atBottom, setAtBottom] = useState(true)
  const virtuosoRef = useRef<VirtuosoHandle>(null)
  const firstKeyRef = useRef<string | null>(null)
  const firstItemIndexRef = useRef(START_INDEX)
  const t = useTranslations('Sobok.messageList')
  const locale = useLocale()

  const rows = buildRows(items, itemKey, dateOf, (ts) =>
    formatDateSeparator(ts, LOCALE_LANGUAGE_TAGS[locale], {
      today: t('today'),
      yesterday: t('yesterday'),
    }),
  )

  const rowsRef = useRef(rows)
  rowsRef.current = rows

  if (rows.length > 0) {
    const currentFirstKey = rows[0].key

    if (firstKeyRef.current === null) {
      firstKeyRef.current = currentFirstKey
    } else if (currentFirstKey !== firstKeyRef.current) {
      const prependedCount = rows.findIndex((row) => row.key === firstKeyRef.current)

      if (prependedCount > 0) {
        firstItemIndexRef.current -= prependedCount
      } else if (prependedCount === -1) {
        firstItemIndexRef.current = START_INDEX
      }

      firstKeyRef.current = currentFirstKey
    }
  }

  useImperativeHandle(
    ref,
    () => ({
      scrollToBottom: (behavior = 'smooth') => {
        virtuosoRef.current?.scrollToIndex({ align: 'end', behavior, index: 'LAST' })
      },
      scrollToKey: (key, options) => {
        const index = rowsRef.current.findIndex((row) => row.kind === 'item' && row.key === key)

        if (index >= 0) {
          virtuosoRef.current?.scrollToIndex({
            align: options?.align ?? 'center',
            behavior: options?.behavior ?? 'smooth',
            index,
          })
        }
      },
    }),
    [],
  )

  if (rows.length === 0) {
    return <div className="relative min-h-0 flex-1 flex items-center justify-center">{emptyState}</div>
  }

  return (
    <div className="relative min-h-0 flex-1">
      <Virtuoso<Row<TItem>, ChatListHeaderContext>
        atBottomStateChange={setAtBottom}
        className={twMerge('custom-scrollbar', className)}
        components={CHAT_COMPONENTS}
        computeItemKey={(_index, row) => row.key}
        context={{ banner, isLoadingOlder }}
        data={rows}
        firstItemIndex={firstItemIndexRef.current}
        followOutput={(isAtBottom) => (isAtBottom ? 'smooth' : false)}
        increaseViewportBy={{
          bottom: 600,
          top: 600,
        }}
        initialTopMostItemIndex={{
          align: 'end',
          index: 'LAST',
        }}
        itemContent={(_index, row) => {
          if (row.kind === 'separator') {
            return <DateSeparator label={row.label} />
          }

          const isBottomItem = row.key === rows[rows.length - 1].key
          return (
            <div
              className={twMerge('mx-auto w-full max-w-2xl px-4', isBottomItem ? bottomInsetClassName : gapClassName)}
            >
              {renderItem(row.item)}
            </div>
          )
        }}
        ref={virtuosoRef}
        startReached={() => {
          if (hasOlder && !isLoadingOlder) {
            onLoadOlder?.()
          }
        }}
      />
      {!atBottom && (
        <button
          aria-label={t('scrollToBottom')}
          className={twMerge(
            'absolute z-10 flex h-10 w-10 items-center justify-center rounded-full border border-foreground/10 bg-zinc-800 text-foreground shadow-lg transition-colors hover:bg-zinc-700',
            scrollButtonClassName,
          )}
          onClick={() =>
            virtuosoRef.current?.scrollToIndex({
              align: 'end',
              behavior: 'smooth',
              index: 'LAST',
            })
          }
          type="button"
        >
          <ChevronDown className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}

function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex justify-center px-4 py-3">
      <span className="rounded-full bg-foreground/10 px-3 py-1 text-xs font-medium text-zinc-400">{label}</span>
    </div>
  )
}

interface ChatListHeaderContext {
  banner: ReactNode
  isLoadingOlder: boolean
}

function ChatListHeader({ context }: { context: ChatListHeaderContext }) {
  const t = useTranslations('Sobok.messageList')

  return (
    <div className="mx-auto w-full max-w-2xl pt-4">
      {context.isLoadingOlder && <div className="py-2 text-center text-xs text-zinc-400">{t('loadingOlder')}</div>}
      {context.banner}
    </div>
  )
}

const CHAT_COMPONENTS = {
  Header: ChatListHeader,
}

// A rendered row is either a message (caller-supplied) or a date separator interleaved by this list.
type Row<TItem> = { kind: 'item'; key: string; item: TItem } | { kind: 'separator'; key: string; label: string }

// Interleave a date chip before the first message of each local day. Separators carry a stable
// `date:<dayKey>` key so the reverse-scroll anchor keeps working across prepends.
function buildRows<TItem>(
  items: readonly TItem[],
  itemKey: (item: TItem) => string,
  dateOf: ((item: TItem) => number) | undefined,
  formatDateLabel: (ts: number) => string,
): Row<TItem>[] {
  if (!dateOf) {
    return items.map((item) => ({ item, key: itemKey(item), kind: 'item' }))
  }

  const rows: Row<TItem>[] = []
  let previousDay: string | null = null

  for (const item of items) {
    const timestamp = dateOf(item)
    const day = dayKey(timestamp)

    if (day !== previousDay) {
      rows.push({ key: `date:${day}`, kind: 'separator', label: formatDateLabel(timestamp) })
      previousDay = day
    }

    rows.push({ item, key: itemKey(item), kind: 'item' })
  }

  return rows
}
