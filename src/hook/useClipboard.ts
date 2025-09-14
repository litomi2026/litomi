import { useState } from 'react'
import { toast } from 'sonner'

export default function useClipboard(timeout = 2000) {
  const [copied, setCopied] = useState(false)

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), timeout)
      toast.success('클립보드에 복사되었어요')
    } catch {
      toast.error('복사에 실패했어요')
    }
  }

  return { copy, copied }
}
