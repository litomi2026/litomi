'use client'

import { ChevronDown } from 'lucide-react'
import type { ReactNode, Ref } from 'react'
import { useImperativeHandle, useRef, useState } from 'react'
import type { IndexLocationWithAlign, VirtuosoHandle } from 'react-virtuoso'
import { Virtuoso } from 'react-virtuoso'
import { twMerge } from 'tailwind-merge'

const START_INDEX = 1_000_000

const INITIAL_LOCATION: IndexLocationWithAlign = {
  align: 'end',
  index: 'LAST',
}

interface ChatListHeaderContext {
  banner: ReactNode
  isLoadingOlder: boolean
}

const CHAT_COMPONENTS = {
  Header: ({ context }: { context: ChatListHeaderContext }) => (
    <div className="pt-4">
      {context.isLoadingOlder ? <div className="py-2 text-center text-xs text-zinc-400">불러오는 중...</div> : null}
      {context.banner}
    </div>
  ),
}

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
  const itemsRef = useRef(items)
  const itemKeyRef = useRef(itemKey)

  if (items.length > 0) {
    const currentFirstKey = itemKey(items[0])

    if (firstKeyRef.current === null) {
      firstKeyRef.current = currentFirstKey
    } else if (currentFirstKey !== firstKeyRef.current) {
      const prependedCount = items.findIndex((item) => itemKey(item) === firstKeyRef.current)

      if (prependedCount > 0) {
        firstItemIndexRef.current -= prependedCount
      } else if (prependedCount === -1) {
        firstItemIndexRef.current = START_INDEX
      }

      firstKeyRef.current = currentFirstKey
    }
  }

  itemsRef.current = items
  itemKeyRef.current = itemKey

  useImperativeHandle(
    ref,
    () => ({
      scrollToBottom: (behavior = 'smooth') => {
        virtuosoRef.current?.scrollToIndex({ align: 'end', behavior, index: 'LAST' })
      },
      scrollToKey: (key, options) => {
        const index = itemsRef.current.findIndex((item) => itemKeyRef.current(item) === key)

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

  if (items.length === 0) {
    return <div className="relative min-h-0 flex-1 flex items-center justify-center">{emptyState}</div>
  }

  const lastKey = itemKey(items[items.length - 1])

  return (
    <div className="relative min-h-0 flex-1">
      <Virtuoso<TItem, ChatListHeaderContext>
        atBottomStateChange={setAtBottom}
        className={twMerge('custom-scrollbar', className)}
        components={CHAT_COMPONENTS}
        computeItemKey={(_index, item) => itemKey(item)}
        context={{ banner, isLoadingOlder }}
        data={items}
        firstItemIndex={firstItemIndexRef.current}
        followOutput={(isAtBottom) => (isAtBottom ? 'smooth' : false)}
        increaseViewportBy={{ bottom: 600, top: 600 }}
        initialTopMostItemIndex={INITIAL_LOCATION}
        itemContent={(_index, item) => (
          <div className={twMerge('px-4', itemKey(item) === lastKey ? bottomInsetClassName : gapClassName)}>
            {renderItem(item)}
          </div>
        )}
        ref={virtuosoRef}
        startReached={() => {
          if (hasOlder && !isLoadingOlder) {
            onLoadOlder?.()
          }
        }}
      />
      {!atBottom && (
        <button
          aria-label="맨 아래로"
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
