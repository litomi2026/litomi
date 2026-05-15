'use client'

export type { ReaderPage, ReaderPageRenderContext, ReaderPageRenderer } from '#reader/model/readerLayout'
export { DEFAULT_READER_LOCALE, getReaderMessages, readerMessageCatalog } from '#reader/model/readerMessages'
export type { ReaderLocale, ReaderMessageOverrides, ReaderMessages } from '#reader/model/readerMessages'

export type {
  ReaderNotice,
  ReaderNoticeAction,
  ReaderNoticeCode,
  ReaderNoticeHandle,
  ReaderNoticeHandler,
  ReaderNoticeSeverity,
} from '#reader/model/readerNotice'

export { default, default as Reader } from '#reader/Reader'
export type { ReaderProps } from '#reader/Reader'
export type { ReadingProgress, ReadingProgressSaveOptions } from '#reader/reading-progress/ReadingProgressTracker'
