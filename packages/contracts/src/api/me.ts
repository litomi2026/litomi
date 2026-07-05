import { isSearchLanguage } from '@litomi/domain/search/language'
import { normalizeValue } from '@litomi/domain/utils/normalize-value'
import type { RegistrationResponseJSON } from '@simplewebauthn/server'
import { z } from 'zod'

import { INVALID_PARAM } from '../problem'
import { passwordSchema, twoFactorBackupCodeSchema, twoFactorTokenSchema } from '../shared'

const nameSchema = z
  .string()
  .min(2)
  .max(32)
  .regex(/^[a-zA-Z][a-zA-Z0-9-._~]*$/)

const nicknameSchema = z.string().min(2).max(32)

const searchLanguageSchema = z
  .string()
  .trim()
  .min(1)
  .transform(normalizeValue)
  .refine(isSearchLanguage, { params: { code: INVALID_PARAM.INVALID_SEARCH_LANGUAGE } })

export const imageURLSchema = z
  .url()
  .max(256)
  .refine(
    (value) => {
      try {
        const { protocol } = new URL(value)
        return protocol === 'http:' || protocol === 'https:'
      } catch {
        return false
      }
    },
    { params: { code: INVALID_PARAM.INVALID_PROTOCOL } },
  )

export enum AdultVerificationStatus {
  ADULT = 'adult',
  NOT_ADULT = 'not-adult',
  UNVERIFIED = 'unverified',
}

export interface UserSettings {
  historySyncEnabled: boolean
  adultVerifiedAdVisible: boolean
  defaultCensorshipEnabled: boolean
  searchLanguage: string
  autoDeletionDay: number
}

export interface GETV1MeResponse {
  id: number
  loginId: string
  name: string
  nickname: string
  imageURL: string | null
  adultVerification: {
    required: boolean
    status: AdultVerificationStatus
  }
  settings: UserSettings
}

export const patchV1MeBodySchema = z
  .object({
    name: nameSchema.optional(),
    nickname: nicknameSchema.optional(),
    imageURL: imageURLSchema.nullable().optional(),
  })
  .refine((value) => Object.values(value).some((item) => item !== undefined))

export type PATCHV1MeBody = z.infer<typeof patchV1MeBodySchema>

export interface PATCHV1MeResponse {
  name: string
  nickname: string
  imageURL: string | null
}

export const deleteV1MeBodySchema = z.object({
  password: passwordSchema,
  token: twoFactorTokenSchema.optional(),
})

export type DELETEV1MeBody = z.infer<typeof deleteV1MeBodySchema>

export interface DELETEV1MeResponse {
  loginId: string
}

export const patchV1MeSettingsBodySchema = z
  .object({
    historySyncEnabled: z.boolean().optional(),
    adultVerifiedAdVisible: z.boolean().optional(),
    defaultCensorshipEnabled: z.boolean().optional(),
    searchLanguage: searchLanguageSchema.optional(),
    autoDeletionDay: z.number().int().min(0).max(1500).optional(),
  })
  .refine((value) => Object.values(value).some((item) => item !== undefined))

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
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
  token: twoFactorTokenSchema.optional(),
})

export type PATCHV1MePasswordBody = z.infer<typeof patchV1MePasswordBodySchema>

export interface PATCHV1MePasswordResponse {
  clearedCurrentSession: true
}

export interface DELETEV1MeSessionResponse {
  clearedCurrentSession: boolean
}

export const deleteV1MeSessionParamSchema = z.object({
  id: z.uuid(),
})

export interface DELETEV1MeTrustedBrowserResponse {
  id: number
}

export interface POSTV1MeTwoFactorSetupResponse {
  expiresAt: string
  qrCode: string
  secret: string
}

const twoFactorTokenBodySchema = z.object({
  token: twoFactorTokenSchema,
})

export const postV1MeTwoFactorVerifyBodySchema = twoFactorTokenBodySchema

export type POSTV1MeTwoFactorVerifyBody = z.infer<typeof postV1MeTwoFactorVerifyBodySchema>

export interface POSTV1MeTwoFactorVerifyResponse {
  backupCodes: string[]
}

export const deleteV1MeTwoFactorBodySchema = z.object({
  token: z.union([twoFactorTokenSchema, twoFactorBackupCodeSchema]),
})

export type DELETEV1MeTwoFactorBody = z.infer<typeof deleteV1MeTwoFactorBodySchema>

export const postV1MeTwoFactorBackupCodesBodySchema = twoFactorTokenBodySchema

export type POSTV1MeTwoFactorBackupCodesBody = z.infer<typeof postV1MeTwoFactorBackupCodesBodySchema>

export interface POSTV1MeTwoFactorBackupCodesResponse {
  backupCodes: string[]
}

export const patchV1MePasskeyBodySchema = z.object({
  name: z.string().trim().min(1).max(32),
})

export type PATCHV1MePasskeyBody = z.infer<typeof patchV1MePasskeyBodySchema>

export interface PATCHV1MePasskeyResponse {
  id: number
  name: string
}

export interface DELETEV1MePasskeyResponse {
  id: number
}

interface PublicKeyCredentialCreationOptionsJSON {
  rp: { id?: string; name: string }
  user: { id: string; name: string; displayName: string }
  challenge: string
  pubKeyCredParams: { alg: number; type: 'public-key' }[]
}

export interface POSTV1MePasskeyOptionsResponse {
  options: PublicKeyCredentialCreationOptionsJSON
}

const passkeyRegistrationResponseSchema = z
  .object({
    id: z.string(),
    rawId: z.string(),
    response: z.object({
      attestationObject: z.string(),
      clientDataJSON: z.string(),
      transports: z.array(z.string()).optional(),
      publicKeyAlgorithm: z.number().optional(),
      publicKey: z.string().optional(),
      authenticatorData: z.string().optional(),
    }),
    type: z.literal('public-key'),
    clientExtensionResults: z.record(z.string(), z.unknown()).default({}),
    authenticatorAttachment: z.string().optional(),
  })
  .transform((value) => value as RegistrationResponseJSON)

export const postV1MePasskeyVerifyBodySchema = z.object({
  registration: passkeyRegistrationResponseSchema,
})

export type POSTV1MePasskeyVerifyBody = z.infer<typeof postV1MePasskeyVerifyBodySchema>

export interface POSTV1MePasskeyVerifyResponse {
  id: number
  credentialId: string
  name: string
}

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

export interface POSTV1MePushSubscriptionResponse {
  id: number
}

export const deleteV1MePushSubscriptionBodySchema = z.object({
  endpoint: z.url(),
})

export type DELETEV1MePushSubscriptionBody = z.infer<typeof deleteV1MePushSubscriptionBodySchema>

export interface DELETEV1MePushSubscriptionIdResponse {
  id: number
}

export const postV1MePushTestBodySchema = z.object({
  endpoint: z.url(),
  message: z.string().min(1),
})

export type POSTV1MePushTestBody = z.infer<typeof postV1MePushTestBodySchema>

export const patchV1MePushSettingsBodySchema = z.object({
  quietEnabled: z.boolean(),
  quietStart: z.number().int().min(0).max(23),
  quietEnd: z.number().int().min(0).max(23),
  batchEnabled: z.boolean(),
  maxDaily: z.number().int().min(1).max(999),
})

export type PATCHV1MePushSettingsBody = z.infer<typeof patchV1MePushSettingsBodySchema>

export interface GETV1MeFollowingResponse {
  userIds: number[]
}
