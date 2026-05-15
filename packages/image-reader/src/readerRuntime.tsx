'use client'

import type { ReaderLocale, ReaderMessageOverrides, ReaderMessages } from '#reader/model/readerMessages'
import type { ReaderNoticeHandler } from '#reader/model/readerNotice'
import type { ReactNode } from 'react'

import { getReaderMessages } from '#reader/model/readerMessages'
import { createContext, useContext } from 'react'

type ReaderRuntimeProviderProps = {
  children: ReactNode
  locale: ReaderLocale
  messages?: ReaderMessageOverrides
  onNotice?: ReaderNoticeHandler
}

const missingReaderNoticeHandlerContext = Symbol('missing-reader-notice-handler-context')

const ReaderMessagesContext = createContext<ReaderMessages | null>(null)

const ReaderNoticeHandlerContext = createContext<
  ReaderNoticeHandler | typeof missingReaderNoticeHandlerContext | undefined
>(missingReaderNoticeHandlerContext)

export function ReaderRuntimeProvider({ children, locale, messages, onNotice }: ReaderRuntimeProviderProps) {
  const resolvedMessages = getReaderMessages(locale, messages)

  return (
    <ReaderMessagesContext.Provider value={resolvedMessages}>
      <ReaderNoticeHandlerContext.Provider value={onNotice}>{children}</ReaderNoticeHandlerContext.Provider>
    </ReaderMessagesContext.Provider>
  )
}

export function useReaderMessages() {
  const messages = useContext(ReaderMessagesContext)

  if (!messages) {
    throw new Error('ReaderRuntimeProvider is required to use reader messages.')
  }

  return messages
}

export function useReaderNoticeHandler() {
  const onNotice = useContext(ReaderNoticeHandlerContext)

  if (onNotice === missingReaderNoticeHandlerContext) {
    throw new Error('ReaderRuntimeProvider is required to use reader notices.')
  }

  return onNotice
}
