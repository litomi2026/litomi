import { CANONICAL_URL, LOCAL_URL } from '.'

export const AIVEN_CERTIFICATE = process.env.AIVEN_CERTIFICATE ?? ''
export const AIVEN_POSTGRES_URL = process.env.AIVEN_POSTGRES_URL ?? ''
export const AMPLITUDE_API_KEY = process.env.AMPLITUDE_API_KEY
export const GA_ID = process.env.GA_ID
export const GOOGLE_ADSENSE_ACCOUNT = process.env.GOOGLE_ADSENSE_ACCOUNT ?? ''
export const GTM_ID = process.env.GTM_ID
export const NEON_DATABASE_URL = process.env.NEON_DATABASE_URL ?? ''
export const NEON_DATABASE_URL_RO = process.env.NEON_DATABASE_URL_RO ?? ''
export const NEXT_PUBLIC_VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''
export const NEXT_PUBLIC_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL
export const POSTGRES_URL = process.env.POSTGRES_URL ?? ''
export const POSTGRES_URL_NON_POOLING = process.env.POSTGRES_URL_NON_POOLING ?? ''
export const SUPABASE_CERTIFICATE = process.env.SUPABASE_CERTIFICATE ?? ''
export const JWT_SECRET_ACCESS_TOKEN = process.env.JWT_SECRET_ACCESS_TOKEN ?? ''
export const JWT_SECRET_REFRESH_TOKEN = process.env.JWT_SECRET_REFRESH_TOKEN ?? ''
export const NEXT_PUBLIC_CORS_PROXY_URL = process.env.NEXT_PUBLIC_CORS_PROXY_URL ?? ''
export const NEXT_PUBLIC_TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''
export const VERCEL_ANALYTICS = process.env.VERCEL_ANALYTICS ?? ''
export const VERCEL_SPEED_INSIGHTS = process.env.VERCEL_SPEED_INSIGHTS ?? ''
export const WEBAUTHN_ORIGIN = process.env.NODE_ENV === 'production' ? CANONICAL_URL : LOCAL_URL
export const WEBAUTHN_RP_ID = process.env.NODE_ENV === 'production' ? new URL(CANONICAL_URL).hostname : 'localhost'
export const WEBAUTHN_RP_NAME = 'litomi'
export const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? ''
export const TOTP_ENCRYPTION_KEY = process.env.TOTP_ENCRYPTION_KEY ?? ''
export const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY ?? ''
