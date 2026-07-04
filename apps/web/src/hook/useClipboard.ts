import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'

export default function useClipboard(timeout = 2000) {
  const [copied, setCopied] = useState(false)
  const t = useTranslations('Common.clipboard')

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), timeout)
      toast.success(t('copied'))
    } catch {
      toast.error(t('copyFailed'))
    }
  }

  return { copy, copied }
}
