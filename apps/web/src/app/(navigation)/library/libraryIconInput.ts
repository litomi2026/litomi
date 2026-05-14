import { DEFAULT_LIBRARY_ICON } from '@litomi/domain/constants/library'
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

export function getValidLibraryIcon(value: string | undefined): string | null {
  const icon = normalizeString(value)

  if (!icon || !isSingleEmoji(icon)) {
    toast.warning('이모지를 하나만 입력해 주세요')
    return null
  }

  return icon
}

export function preloadLibraryEmojiList() {
  loadLibraryEmojiList()
}

async function loadLibraryEmojiList(): Promise<readonly string[]> {
  libraryEmojiListPromise ??= import('@litomi/domain/generated/emojis').then(({ EMOJI_LIST }) => EMOJI_LIST)

  return libraryEmojiListPromise
}
