import { Loader2 } from 'lucide-react'

import { useReaderMessages } from '#reader/context'
import type { ReaderLayout, ReaderPage, ReaderPageRenderer } from '#reader/model/readerLayout'

export type Props<TPage extends ReaderPage> = {
  isLowDataMode: boolean
  onClick: () => void
  readerLayout: ReaderLayout<TPage>
  renderPage: ReaderPageRenderer<TPage>
}

export function ScrollReaderViewLoading({ onClick }: Pick<Props<ReaderPage>, 'onClick'>) {
  const messages = useReaderMessages()

  return (
    <output className="flex items-center justify-center h-dvh animate-fade-in" onClick={onClick}>
      <Loader2 aria-hidden="true" className="size-8 animate-spin" />
      <span className="sr-only">{messages.loadingImages}</span>
    </output>
  )
}
