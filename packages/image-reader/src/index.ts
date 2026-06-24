'use client'

export type {
  ReaderPage,
  ReaderPageProgressMode,
  ReaderPageRenderContext,
  ReaderPageRenderer,
  ReaderPageSpreadMode,
} from '#reader/model/readerLayout'
export type { ReaderLocale, ReaderMessageOverrides, ReaderMessages } from '#reader/model/readerMessages'
export { getReaderMessages, readerMessageCatalog } from '#reader/model/readerMessages'

export type {
  ReaderNotice,
  ReaderNoticeAction,
  ReaderNoticeCode,
  ReaderNoticeHandle,
  ReaderNoticeHandler,
  ReaderNoticeSeverity,
} from '#reader/model/readerNotice'
export type { ReaderProps } from '#reader/Reader'
export { default, default as Reader } from '#reader/Reader'
export type { ReadingProgress, ReadingProgressSaveOptions } from '#reader/reading-progress/ReadingProgressTracker'
