import { z } from 'zod'

import { MAX_LIBRARY_ICON_LENGTH } from '@/constants/policy'
import { isSingleEmoji } from '@/utils/emoji'
import { normalizeString } from '@/utils/string'

const singleEmojiMessage = '이모지는 하나만 입력할 수 있어요'

export const libraryIconSchema = z.preprocess(
  (value) => (typeof value === 'string' ? normalizeString(value) : value),
  z
    .string()
    .max(MAX_LIBRARY_ICON_LENGTH, singleEmojiMessage)
    .refine(isSingleEmoji, singleEmojiMessage)
    .nullable()
    .optional(),
)
