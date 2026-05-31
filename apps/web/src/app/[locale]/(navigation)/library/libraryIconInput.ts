import { DEFAULT_LIBRARY_ICON } from '@litomi/domain/library/defaults'
import { isSingleEmoji } from '@litomi/domain/utils/emoji'
import { normalizeString } from '@litomi/std'
import { toast } from 'sonner'

let libraryEmojiListPromise: Promise<readonly string[]> | undefined

export async function getRandomLibraryIcon(excludedIcon?: string, random = Math.random): Promise<string> {
  const normalizedExcludedIcon = normalizeString(excludedIcon)
  const emojiList = await loadLibraryEmojiList()

  if (emojiList.length === 0) {
    return DEFAULT_LIBRARY_ICON
  }

  let iconIndex = Math.min(Math.floor(random() * emojiList.length), emojiList.length - 1)
  let icon = emojiList[iconIndex] ?? DEFAULT_LIBRARY_ICON

  if (normalizedExcludedIcon && emojiList.length > 1 && icon === normalizedExcludedIcon) {
    iconIndex = (iconIndex + 1) % emojiList.length
    icon = emojiList[iconIndex] ?? DEFAULT_LIBRARY_ICON
  }

  return icon
}

export function preloadLibraryEmojiList() {
  loadLibraryEmojiList()
}

export function validateLibraryIcon(value: string | undefined, invalidMessage: string): string | null {
  const icon = normalizeString(value)

  if (!icon || !isSingleEmoji(icon)) {
    toast.warning(invalidMessage)
    return null
  }

  return icon
}

async function loadLibraryEmojiList(): Promise<readonly string[]> {
  libraryEmojiListPromise ??= import('@litomi/domain/generated/emojis').then(({ EMOJI_LIST }) => EMOJI_LIST)

  return libraryEmojiListPromise
}
