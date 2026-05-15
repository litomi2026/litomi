export type ReaderNotice = {
  code: ReaderNoticeCode
  id: string
  message: string
  severity: ReaderNoticeSeverity
  action?: ReaderNoticeAction
  durationMs?: number
}

export type ReaderNoticeAction = {
  label: string
  onClick: () => void
}

export type ReaderNoticeCode =
  | 'first-page'
  | 'last-page'
  | 'low-data-auto-save-data'
  | 'low-data-auto-slow-network'
  | 'resume-reading'
  | 'slideshow-ended'

export type ReaderNoticeHandle = {
  dismiss: () => void
}

export type ReaderNoticeHandler = (notice: ReaderNotice) => ReaderNoticeHandle | void

export type ReaderNoticeSeverity = 'info' | 'warning'
