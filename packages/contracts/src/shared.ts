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

export const loginIdSchema = z
  .string()
  .min(2, { error: '아이디는 최소 2자 이상이어야 해요' })
  .max(32, { error: '아이디는 최대 32자까지 입력할 수 있어요' })
  .regex(new RegExp(LOGIN_ID_PATTERN), { error: '아이디는 알파벳, 숫자, _ 로만 구성해야 해요' })

export const passwordSchema = z
  .string()
  .min(8, { error: '비밀번호는 최소 8자 이상이어야 해요' })
  .max(64, { error: '비밀번호는 최대 64자까지 입력할 수 있어요' })
  .regex(new RegExp(PASSWORD_PATTERN), { error: '비밀번호는 알파벳과 숫자를 하나 이상 포함해야 해요' })

export const nicknameSchema = z
  .string()
  .min(2, { error: '닉네임은 최소 2자 이상이어야 해요' })
  .max(32, { error: '닉네임은 최대 32자까지 입력할 수 있어요' })

// --- Two-factor authentication ------------------------------------------------

export const twoFactorTokenSchema = z.string().length(6).regex(/^\d+$/)

export const twoFactorBackupCodeSchema = z.string().length(9).regex(new RegExp(BACKUP_CODE_PATTERN))

// --- Anti-abuse tokens --------------------------------------------------------

export const turnstileTokenSchema = z.string().min(1).max(2048)
