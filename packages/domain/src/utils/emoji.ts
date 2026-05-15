import { MAX_LIBRARY_ICON_LENGTH } from '@litomi/domain/constants/policy'

const emojiWithVariationSelectorRegex = /\p{Emoji}\uFE0F/u
const emojiPresentationRegex = /\p{Emoji_Presentation}/u
const extendedPictographicRegex = /\p{Extended_Pictographic}/u
const keycapEmojiRegex = /^[0-9#*]\uFE0F?\u20E3$/u
const regionalIndicatorPairRegex = /^\p{Regional_Indicator}{2}$/u
const standaloneEmojiComponentRegex = /^(\p{Emoji_Modifier}|\p{Regional_Indicator})$/u

const graphemeSegmenter =
  typeof Intl.Segmenter === 'function' ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null

export function isSingleEmoji(value: string): boolean {
  if (value.length === 0 || value.length > MAX_LIBRARY_ICON_LENGTH) {
    return false
  }

  const graphemes = getGraphemes(value)

  if (graphemes.length !== 1) {
    return false
  }

  const [emoji] = graphemes

  if (!emoji || standaloneEmojiComponentRegex.test(emoji)) {
    return false
  }

  return (
    keycapEmojiRegex.test(emoji) ||
    regionalIndicatorPairRegex.test(emoji) ||
    emojiWithVariationSelectorRegex.test(emoji) ||
    emojiPresentationRegex.test(emoji) ||
    extendedPictographicRegex.test(emoji)
  )
}

function getGraphemes(value: string): string[] {
  if (!graphemeSegmenter) {
    return Array.from(value)
  }

  return Array.from(graphemeSegmenter.segment(value), ({ segment }) => segment)
}
