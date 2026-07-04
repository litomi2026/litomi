import { z } from 'zod'

import {
  loginIdSchema,
  nicknameSchema,
  passwordSchema,
  turnstileTokenSchema,
  twoFactorBackupCodeSchema,
  twoFactorTokenSchema,
} from '../shared'

export const postV1AuthLoginRequestSchema = z.object({
  loginId: loginIdSchema,
  password: passwordSchema,
  remember: z.boolean().default(false),
  turnstileToken: turnstileTokenSchema,
  codeChallenge: z.string().min(43).max(255),
  fingerprint: z.string().min(1).max(255),
})

export type POSTV1AuthLoginRequest = z.infer<typeof postV1AuthLoginRequestSchema>

export interface POSTV1AuthLoginAuthenticatedResponse {
  nextStep: 'authenticated'
  id: number
  loginId: string
  name: string
  lastLoginAt: Date | null
  lastLogoutAt: Date | null
}

export interface POSTV1AuthLoginTwoFactorResponse {
  nextStep: 'two_factor_required'
  authorizationCode: string
}

export type POSTV1AuthLoginResponse = POSTV1AuthLoginAuthenticatedResponse | POSTV1AuthLoginTwoFactorResponse

export const postV1AuthLogin2FARequestSchema = z.object({
  authorizationCode: z.string().min(1).max(255),
  codeVerifier: z.string().min(43).max(255),
  fingerprint: z.string().min(1).max(255),
  remember: z.boolean().default(false),
  token: z.union([twoFactorTokenSchema, twoFactorBackupCodeSchema]),
  trustBrowser: z.boolean().default(false),
})

export type POSTV1AuthLogin2FARequest = z.infer<typeof postV1AuthLogin2FARequestSchema>

export interface POSTV1AuthLogin2FAResponse {
  id: number
  loginId: string
  name: string
  lastLoginAt: Date | null
  lastLogoutAt: Date | null
  isBackupCode: boolean
  backupCodeCount: number
}

export interface POSTV1AuthLogoutResponse {
  loginId: string | null
}

export const postV1AuthSignupRequestSchema = z
  .object({
    loginId: loginIdSchema,
    password: passwordSchema,
    passwordConfirm: z.string(),
    nickname: z.union([nicknameSchema, z.literal('')]).optional(),
    turnstileToken: turnstileTokenSchema,
  })
  .refine((data) => data.password === data.passwordConfirm, {
    params: { code: 'password-confirm-mismatch' },
    path: ['passwordConfirm'],
  })
  .refine((data) => data.loginId !== data.password, {
    params: { code: 'password-equals-login-id' },
    path: ['password'],
  })

export type POSTV1AuthSignupRequest = z.infer<typeof postV1AuthSignupRequestSchema>

export interface POSTV1AuthSignupResponse {
  userId: number
  loginId: string
  name: string
  nickname: string
}

// --- Passkey authentication (WebAuthn) ---------------------------------------

type AuthenticatorTransport = 'ble' | 'cable' | 'hybrid' | 'internal' | 'nfc' | 'smart-card' | 'usb'
type PublicKeyCredentialHint = 'hybrid' | 'security-key' | 'client-device'
type UserVerificationRequirement = 'discouraged' | 'preferred' | 'required'

interface AuthenticationExtensionsClientInputs {
  appid?: string
  credProps?: boolean
  hmacCreateSecret?: boolean
  minPinLength?: boolean
}

interface PublicKeyCredentialDescriptorJSON {
  id: string
  type: 'public-key'
  transports?: AuthenticatorTransport[]
}

interface PublicKeyCredentialRequestOptionsJSON {
  challenge: string
  timeout?: number
  rpId?: string
  allowCredentials?: PublicKeyCredentialDescriptorJSON[]
  userVerification?: UserVerificationRequirement
  hints?: PublicKeyCredentialHint[]
  extensions?: AuthenticationExtensionsClientInputs
}

export interface POSTV1AuthPasskeyOptionsResponse {
  options: PublicKeyCredentialRequestOptionsJSON
  turnstileRequired: boolean
}

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
  turnstileToken: turnstileTokenSchema.nullable().optional(),
})

export type POSTV1AuthPasskeyVerifyRequest = z.infer<typeof postV1AuthPasskeyVerifyRequestSchema>

export interface POSTV1AuthPasskeyVerifyResponse {
  id: number
  loginId: string
  name: string
  lastLoginAt: Date | null
  lastLogoutAt: Date | null
}
