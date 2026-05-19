import { PASSWORD_PATTERN } from '@litomi/domain/constants/policy'
import { z } from 'zod'

const passwordSchema = z
  .string()
  .min(8, { error: '비밀번호는 최소 8자 이상이어야 해요' })
  .max(64, { error: '비밀번호는 최대 64자까지 입력할 수 있어요' })
  .regex(new RegExp(PASSWORD_PATTERN), { error: '비밀번호는 알파벳과 숫자를 하나 이상 포함해야 해요' })

export const postV1BBatonAttemptResponseSchema = z.object({
  authorizeUrl: z.string(),
  expiresIn: z.number(),
})

export type POSTV1BBatonAttemptResponse = z.infer<typeof postV1BBatonAttemptResponseSchema>

export const postV1BBatonCompleteBodySchema = z.object({
  code: z.string().min(1).max(2048),
  state: z.string().regex(/^[0-9a-f]{64}$/),
})

export type POSTV1BBatonCompleteBody = z.infer<typeof postV1BBatonCompleteBodySchema>

export const postV1BBatonUnlinkBodySchema = z.object({
  password: passwordSchema,
  token: z.string().length(6).regex(/^\d+$/).optional(),
})

export type POSTV1BBatonUnlinkBody = z.infer<typeof postV1BBatonUnlinkBodySchema>

export const postV1BBatonUnlinkResponseSchema = z.object({
  ok: z.literal(true),
})

export type POSTV1BBatonUnlinkResponse = z.infer<typeof postV1BBatonUnlinkResponseSchema>
