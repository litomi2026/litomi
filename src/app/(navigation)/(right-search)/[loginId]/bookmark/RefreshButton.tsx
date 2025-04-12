'use client'

import { IconReload } from '@/components/icons/IconImageViewer'

type Props = {
  className?: string
}

export default function RefreshButton({ className }: Props) {
  return (
    <button aria-label="새로고침" onClick={() => window.location.reload()}>
      <IconReload className={className} />
    </button>
  )
}
