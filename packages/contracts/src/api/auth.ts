import { BACKUP_CODE_PATTERN, LOGIN_ID_PATTERN, PASSWORD_PATTERN } from '@litomi/domain/constants/policy'
import { z } from 'zod'

const loginIdSchema = z
  .string()
  .min(2, { error: '아이디는 최소 2자 이상이어야 해요' })
  .max(32, { error: '아이디는 최대 32자까지 입력할 수 있어요' })
  .regex(new RegExp(LOGIN_ID_PATTERN), { error: '아이디는 알파벳, 숫자, _ 로만 구성해야 해요' })

const passwordSchema = z
  .string()
  .min(8, { error: '비밀번호는 최소 8자 이상이어야 해요' })
  .max(64, { error: '비밀번호는 최대 64자까지 입력할 수 있어요' })
  .regex(new RegExp(PASSWORD_PATTERN), { error: '비밀번호는 알파벳과 숫자를 하나 이상 포함해야 해요' })

const nicknameSchema = z
  .string()
  .min(2, { error: '닉네임은 최소 2자 이상이어야 해요' })
  .max(32, { error: '닉네임은 최대 32자까지 입력할 수 있어요' })

export const postV1AuthLoginRequestSchema = z.object({
  loginId: loginIdSchema,
  password: passwordSchema,
  remember: z.boolean().default(false),
  turnstileToken: z.string().min(1).max(2048),
  codeChallenge: z.string().min(43).max(255),
  fingerprint: z.string().min(1).max(255),
})

export type POSTV1AuthLoginRequest = z.infer<typeof postV1AuthLoginRequestSchema>

export const postV1AuthLoginAuthenticatedResponseSchema = z.object({
  nextStep: z.literal('authenticated'),
  id: z.number(),
  loginId: z.string(),
  name: z.string(),
  lastLoginAt: z.date().nullable(),
  lastLogoutAt: z.date().nullable(),
})

export type POSTV1AuthLoginAuthenticatedResponse = z.infer<typeof postV1AuthLoginAuthenticatedResponseSchema>

export const postV1AuthLoginTwoFactorResponseSchema = z.object({
  nextStep: z.literal('two_factor_required'),
  authorizationCode: z.string(),
})

export type POSTV1AuthLoginTwoFactorResponse = z.infer<typeof postV1AuthLoginTwoFactorResponseSchema>

export const postV1AuthLoginResponseSchema = z.union([
  postV1AuthLoginAuthenticatedResponseSchema,
  postV1AuthLoginTwoFactorResponseSchema,
])

export type POSTV1AuthLoginResponse = z.infer<typeof postV1AuthLoginResponseSchema>

export const postV1AuthLogin2FARequestSchema = z.object({
  authorizationCode: z.string().min(1).max(255),
  codeVerifier: z.string().min(43).max(255),
  fingerprint: z.string().min(1).max(255),
  remember: z.boolean().default(false),
  token: z.union([z.string().length(6).regex(/^\d+$/), z.string().length(9).regex(new RegExp(BACKUP_CODE_PATTERN))]),
  trustBrowser: z.boolean().default(false),
})

export type POSTV1AuthLogin2FARequest = z.infer<typeof postV1AuthLogin2FARequestSchema>

export const postV1AuthLogin2FAResponseSchema = z.object({
  id: z.number(),
  loginId: z.string(),
  name: z.string(),
  lastLoginAt: z.date().nullable(),
  lastLogoutAt: z.date().nullable(),
  isBackupCode: z.boolean(),
  backupCodeCount: z.number(),
})

export type POSTV1AuthLogin2FAResponse = z.infer<typeof postV1AuthLogin2FAResponseSchema>

export const postV1AuthLogoutResponseSchema = z.object({
  loginId: z.string().nullable(),
})

export type POSTV1AuthLogoutResponse = z.infer<typeof postV1AuthLogoutResponseSchema>

export const postV1AuthSignupRequestSchema = z
  .object({
    loginId: loginIdSchema,
    password: passwordSchema,
    passwordConfirm: z.string(),
    nickname: z.union([nicknameSchema, z.literal('')]).optional(),
    turnstileToken: z.string().min(1).max(2048),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    error: '비밀번호와 비밀번호 확인 값이 일치하지 않아요',
    path: ['passwordConfirm'],
  })
  .refine((data) => data.loginId !== data.password, {
    error: '아이디와 비밀번호는 같을 수 없어요',
    path: ['password'],
  })

export type POSTV1AuthSignupRequest = z.infer<typeof postV1AuthSignupRequestSchema>

export const postV1AuthSignupResponseSchema = z.object({
  userId: z.number(),
  loginId: z.string(),
  name: z.string(),
  nickname: z.string(),
})

export type POSTV1AuthSignupResponse = z.infer<typeof postV1AuthSignupResponseSchema>

const authenticatorTransportSchema = z.enum(['ble', 'cable', 'hybrid', 'internal', 'nfc', 'smart-card', 'usb'])
const publicKeyCredentialHintSchema = z.enum(['hybrid', 'security-key', 'client-device'])
const userVerificationRequirementSchema = z.enum(['discouraged', 'preferred', 'required'])

const authenticationExtensionsClientInputsSchema = z.object({
  appid: z.string().optional(),
  credProps: z.boolean().optional(),
  hmacCreateSecret: z.boolean().optional(),
  minPinLength: z.boolean().optional(),
})

const publicKeyCredentialDescriptorSchema = z.object({
  id: z.string(),
  type: z.literal('public-key'),
  transports: z.array(authenticatorTransportSchema).optional(),
})

const publicKeyCredentialRequestOptionsSchema = z.object({
  challenge: z.string(),
  timeout: z.number().optional(),
  rpId: z.string().optional(),
  allowCredentials: z.array(publicKeyCredentialDescriptorSchema).optional(),
  userVerification: userVerificationRequirementSchema.optional(),
  hints: z.array(publicKeyCredentialHintSchema).optional(),
  extensions: authenticationExtensionsClientInputsSchema.optional(),
})

export const postV1AuthPasskeyOptionsResponseSchema = z.object({
  options: publicKeyCredentialRequestOptionsSchema,
  turnstileRequired: z.boolean(),
})

export type POSTV1AuthPasskeyOptionsResponse = z.infer<typeof postV1AuthPasskeyOptionsResponseSchema>

const passkeyClientExtensionResultsSchema = z.object({
  appid: z.boolean().optional(),
  credProps: z.object({ rk: z.boolean().optional() }).optional(),
  hmacCreateSecret: z.boolean().optional(),
})

const passkeyAuthenticationResponseSchema = z.object({
  id: z.string(),
  rawId: z.string(),
  response: z.object({
    authenticatorData: z.string(),
    clientDataJSON: z.string(),
    signature: z.string(),
    userHandle: z.string().optional(),
  }),
  type: z.literal('public-key'),
  authenticatorAttachment: z.enum(['cross-platform', 'platform']).optional(),
  clientExtensionResults: passkeyClientExtensionResultsSchema,
})

export const postV1AuthPasskeyVerifyRequestSchema = z.object({
  authentication: passkeyAuthenticationResponseSchema,
  remember: z.boolean().default(false),
  turnstileToken: z.string().nullable().optional(),
})

export type POSTV1AuthPasskeyVerifyRequest = z.infer<typeof postV1AuthPasskeyVerifyRequestSchema>

export const postV1AuthPasskeyVerifyResponseSchema = z.object({
  id: z.number(),
  loginId: z.string(),
  name: z.string(),
  lastLoginAt: z.date().nullable(),
  lastLogoutAt: z.date().nullable(),
})

export type POSTV1AuthPasskeyVerifyResponse = z.infer<typeof postV1AuthPasskeyVerifyResponseSchema>
