import { BACKUP_CODE_PATTERN, LOGIN_ID_PATTERN, PASSWORD_PATTERN } from '@litomi/domain/auth/policy'
import { MAX_MANGA_ID } from '@litomi/domain/manga/policy'
import { z } from 'zod'

// --- Path params --------------------------------------------------------------

/** A numeric resource id path param (`/resource/:id`). */
export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export const mangaIdSchema = z.coerce.number().int().positive().max(MAX_MANGA_ID)

/** A manga id path param (`/manga/:id`, `/bookmark/:id`). */
export const mangaIdParamSchema = z.object({
  id: mangaIdSchema,
})

// --- Auth field validators ----------------------------------------------------

export const loginIdSchema = z.string().min(2).max(32).regex(new RegExp(LOGIN_ID_PATTERN))

export const passwordSchema = z.string().min(8).max(64).regex(new RegExp(PASSWORD_PATTERN))

export const nicknameSchema = z.string().min(2).max(32)

// --- Two-factor authentication ------------------------------------------------

export const twoFactorTokenSchema = z.string().length(6).regex(/^\d+$/)

export const twoFactorBackupCodeSchema = z.string().length(9).regex(new RegExp(BACKUP_CODE_PATTERN))

// --- Anti-abuse tokens --------------------------------------------------------

export const turnstileTokenSchema = z.string().min(1).max(2048)
