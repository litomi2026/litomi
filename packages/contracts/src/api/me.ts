import { PASSWORD_PATTERN } from '@litomi/domain/constants/policy'
import { z } from 'zod'

const passwordSchema = z
  .string()
  .min(8, { error: '비밀번호는 최소 8자 이상이어야 해요' })
  .max(64, { error: '비밀번호는 최대 64자까지 입력할 수 있어요' })
  .regex(new RegExp(PASSWORD_PATTERN), { error: '비밀번호는 알파벳과 숫자를 하나 이상 포함해야 해요' })

const nameSchema = z
  .string()
  .min(2, { error: '이름은 최소 2자 이상이어야 해요' })
  .max(32, { error: '이름은 최대 32자까지 입력할 수 있어요' })
  .regex(/^[a-zA-Z][a-zA-Z0-9-._~]*$/, { error: '이름은 알파벳, 숫자 - . _ ~ 로만 구성해야 해요' })

const nicknameSchema = z
  .string()
  .min(2, { error: '닉네임은 최소 2자 이상이어야 해요' })
  .max(32, { error: '닉네임은 최대 32자까지 입력할 수 있어요' })

const imageURLSchema = z
  .url('프로필 이미지 주소가 URL 형식이 아니에요')
  .max(256, '프로필 이미지 URL은 최대 256자까지 입력할 수 있어요')
  .refine((value) => {
    try {
      const { protocol } = new URL(value)
      return protocol === 'http:' || protocol === 'https:'
    } catch {
      return false
    }
  }, '프로필 이미지 URL은 http 또는 https만 사용할 수 있어요')

export const AdultVerificationStatus = {
  ADULT: 'adult',
  NOT_ADULT: 'not_adult',
  UNVERIFIED: 'unverified',
} as const

export const adultVerificationStatusSchema = z.enum([
  AdultVerificationStatus.ADULT,
  AdultVerificationStatus.NOT_ADULT,
  AdultVerificationStatus.UNVERIFIED,
])

export type AdultVerificationStatus = z.infer<typeof adultVerificationStatusSchema>

export const userSettingsSchema = z.object({
  historySyncEnabled: z.boolean(),
  adultVerifiedAdVisible: z.boolean(),
  defaultCensorshipEnabled: z.boolean(),
  autoDeletionDay: z.number().int().min(0).max(1500),
})

export type UserSettings = z.infer<typeof userSettingsSchema>

export const getV1MeResponseSchema = z.object({
  id: z.number(),
  loginId: z.string(),
  name: z.string(),
  nickname: z.string(),
  imageURL: z.string().nullable(),
  adultVerification: z.object({
    required: z.boolean(),
    status: adultVerificationStatusSchema,
  }),
  settings: userSettingsSchema,
})

export type GETV1MeResponse = z.infer<typeof getV1MeResponseSchema>

export const patchV1MeBodySchema = z
  .object({
    name: nameSchema.optional(),
    nickname: nicknameSchema.optional(),
    imageURL: imageURLSchema.nullable().optional(),
  })
  .refine((value) => Object.values(value).some((item) => item !== undefined), {
    message: '변경할 정보를 입력해 주세요',
  })

export type PATCHV1MeBody = z.infer<typeof patchV1MeBodySchema>

export const patchV1MeResponseSchema = z.object({
  message: z.string(),
  name: z.string(),
  nickname: z.string(),
  imageURL: z.string().nullable(),
})

export type PATCHV1MeResponse = z.infer<typeof patchV1MeResponseSchema>

export const deleteV1MeBodySchema = z.object({
  password: passwordSchema,
  token: z.string().length(6).regex(/^\d+$/).optional(),
})

export type DELETEV1MeBody = z.infer<typeof deleteV1MeBodySchema>

export const deleteV1MeResponseSchema = z.object({
  loginId: z.string(),
  message: z.string(),
})

export type DELETEV1MeResponse = z.infer<typeof deleteV1MeResponseSchema>

export const patchV1MeSettingsBodySchema = z
  .object({
    historySyncEnabled: z.boolean().optional(),
    adultVerifiedAdVisible: z.boolean().optional(),
    defaultCensorshipEnabled: z.boolean().optional(),
    autoDeletionDay: z.number().int().min(0).max(1500).optional(),
  })
  .refine((value) => Object.values(value).some((item) => item !== undefined), {
    message: '변경할 설정을 선택해 주세요',
  })

export type PATCHV1MeSettingsBody = z.infer<typeof patchV1MeSettingsBodySchema>

export const postV1MeExportBodySchema = z.object({
  password: passwordSchema,
  includeHistory: z.boolean(),
  includeBookmarks: z.boolean(),
  includeRatings: z.boolean(),
  includeLibraries: z.boolean(),
  includeCensorships: z.boolean(),
})

export type POSTV1MeExportBody = z.infer<typeof postV1MeExportBodySchema>

export type POSTV1MeExportResponse = Record<string, unknown>

export const patchV1MePasswordBodySchema = z.object({
  currentPassword: z.string().min(1, '현재 비밀번호를 입력해 주세요'),
  newPassword: passwordSchema,
  token: z.string().length(6).regex(/^\d+$/).optional(),
})

export type PATCHV1MePasswordBody = z.infer<typeof patchV1MePasswordBodySchema>

export const patchV1MePasswordResponseSchema = z.object({
  clearedCurrentSession: z.literal(true),
  message: z.string(),
})

export type PATCHV1MePasswordResponse = z.infer<typeof patchV1MePasswordResponseSchema>

export const deleteV1MeSessionResponseSchema = z.object({
  clearedCurrentSession: z.boolean(),
  message: z.string(),
})

export type DELETEV1MeSessionResponse = z.infer<typeof deleteV1MeSessionResponseSchema>

export const deleteV1MeSessionParamSchema = z.object({
  id: z.uuid(),
})

export type DELETEV1MeSessionParam = z.infer<typeof deleteV1MeSessionParamSchema>

export const deleteV1MeTrustedBrowserParamSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export type DELETEV1MeTrustedBrowserParam = z.infer<typeof deleteV1MeTrustedBrowserParamSchema>

export const deleteV1MeTrustedBrowserResponseSchema = z.object({
  id: z.number(),
  message: z.string(),
})

export type DELETEV1MeTrustedBrowserResponse = z.infer<typeof deleteV1MeTrustedBrowserResponseSchema>

export const deleteV1MeTrustedBrowserAllResponseSchema = z.object({
  message: z.string(),
})

export type DELETEV1MeTrustedBrowserAllResponse = z.infer<typeof deleteV1MeTrustedBrowserAllResponseSchema>

export const deleteV1MePasskeyParamSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export type DELETEV1MePasskeyParam = z.infer<typeof deleteV1MePasskeyParamSchema>

export const deleteV1MePasskeyResponseSchema = z.object({
  id: z.number(),
  message: z.string(),
})

export type DELETEV1MePasskeyResponse = z.infer<typeof deleteV1MePasskeyResponseSchema>

const pushSubscriptionSchema = z.object({
  endpoint: z.url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
})

export const postV1MePushSubscriptionBodySchema = z.object({
  subscription: pushSubscriptionSchema,
  userAgent: z.string().optional(),
})

export type POSTV1MePushSubscriptionBody = z.infer<typeof postV1MePushSubscriptionBodySchema>

export const postV1MePushSubscriptionResponseSchema = z.object({
  id: z.number(),
  message: z.string(),
})

export type POSTV1MePushSubscriptionResponse = z.infer<typeof postV1MePushSubscriptionResponseSchema>

export const deleteV1MePushSubscriptionBodySchema = z.object({
  endpoint: z.url(),
})

export type DELETEV1MePushSubscriptionBody = z.infer<typeof deleteV1MePushSubscriptionBodySchema>

export const deleteV1MePushSubscriptionResponseSchema = z.object({
  message: z.string(),
})

export type DELETEV1MePushSubscriptionResponse = z.infer<typeof deleteV1MePushSubscriptionResponseSchema>

export const deleteV1MePushSubscriptionIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export type DELETEV1MePushSubscriptionIdParam = z.infer<typeof deleteV1MePushSubscriptionIdParamSchema>

export const deleteV1MePushSubscriptionIdResponseSchema = z.object({
  id: z.number(),
  message: z.string(),
})

export type DELETEV1MePushSubscriptionIdResponse = z.infer<typeof deleteV1MePushSubscriptionIdResponseSchema>

export const postV1MePushTestBodySchema = z.object({
  endpoint: z.url(),
  message: z.string().min(1),
})

export type POSTV1MePushTestBody = z.infer<typeof postV1MePushTestBodySchema>

export const postV1MePushTestResponseSchema = z.object({
  message: z.string(),
})

export type POSTV1MePushTestResponse = z.infer<typeof postV1MePushTestResponseSchema>

export const patchV1MePushSettingsBodySchema = z.object({
  quietEnabled: z.boolean(),
  quietStart: z.number().int().min(0).max(23),
  quietEnd: z.number().int().min(0).max(23),
  batchEnabled: z.boolean(),
  maxDaily: z.number().int().min(1).max(999),
})

export type PATCHV1MePushSettingsBody = z.infer<typeof patchV1MePushSettingsBodySchema>

export const patchV1MePushSettingsResponseSchema = z.object({
  message: z.string(),
})

export type PATCHV1MePushSettingsResponse = z.infer<typeof patchV1MePushSettingsResponseSchema>

export const getV1MeFollowingResponseSchema = z.object({
  userIds: z.array(z.number()),
})

export type GETV1MeFollowingResponse = z.infer<typeof getV1MeFollowingResponseSchema>
