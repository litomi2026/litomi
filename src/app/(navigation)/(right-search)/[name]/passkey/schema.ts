import { z } from 'zod/v4'

export const getAuthenticationOptionsSchema = z.object({ loginId: z.string() })

export const verifyAuthenticationSchema = z.object({
  id: z.string(),
  rawId: z.string(),
  response: z.object({
    authenticatorData: z.string(),
    clientDataJSON: z.string(),
    signature: z.string(),
    userHandle: z.string().optional(),
  }),
  type: z.literal('public-key'),
  clientExtensionResults: z.record(z.string(), z.unknown()).optional().default({}),
})

export const verifyRegistrationSchema = z.object({
  id: z.string(),
  rawId: z.string(),
  response: z.object({
    attestationObject: z.string(),
    clientDataJSON: z.string(),
    transports: z.array(z.enum(['ble', 'hybrid', 'internal', 'nfc', 'usb'])).optional(),
    publicKeyAlgorithm: z.number().optional(),
    publicKey: z.string().optional(),
    authenticatorData: z.string().optional(),
  }),
  type: z.literal('public-key'),
  clientExtensionResults: z.object({}).optional().default({}),
  authenticatorAttachment: z.enum(['platform', 'cross-platform']).optional(),
})

export const deleteCredentialSchema = z.object({
  'credential-id': z.coerce.number().int().positive(),
})
