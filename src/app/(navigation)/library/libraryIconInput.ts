import { toast } from 'sonner'

import { isSingleEmoji } from '@/utils/emoji'
import { normalizeString } from '@/utils/string'

export function getValidLibraryIcon(value: string): string | null {
  const icon = normalizeString(value)

  if (!icon || !isSingleEmoji(icon)) {
    toast.warning('이모지를 하나만 입력해 주세요')
    return null
  }

  return icon
}
