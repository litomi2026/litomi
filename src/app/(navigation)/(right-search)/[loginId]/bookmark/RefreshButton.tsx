'use client'

import { IconReload } from '@/components/icons/IconImageViewer'
import { useRouter } from 'next/navigation'

type Props = {
  className?: string
}

export default function RefreshButton({ className }: Props) {
  const router = useRouter()
  return (
    <button aria-label="새로고침" onClick={() => router.refresh()}>
      <IconReload className={className} />
    </button>
  )
}
