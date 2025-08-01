import { CANONICAL_URL } from './url'

export const GA_ID = process.env.GA_ID
export const GTM_ID = process.env.GTM_ID
export const AMPLITUDE_API_KEY = process.env.AMPLITUDE_API_KEY
export const NEXT_PUBLIC_VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''
export const NEXT_PUBLIC_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL
export const POSTGRES_URL = process.env.POSTGRES_URL ?? ''
export const JWT_SECRET_ACCESS_TOKEN = process.env.JWT_SECRET_ACCESS_TOKEN ?? ''
export const JWT_SECRET_REFRESH_TOKEN = process.env.JWT_SECRET_REFRESH_TOKEN ?? ''
export const NEXT_PUBLIC_CORS_PROXY_URL = process.env.NEXT_PUBLIC_CORS_PROXY_URL ?? ''
export const VERCEL_ANALYTICS = process.env.VERCEL_ANALYTICS ?? ''
export const VERCEL_SPEED_INSIGHTS = process.env.VERCEL_SPEED_INSIGHTS ?? ''
export const WEBAUTHN_ORIGIN = process.env.NODE_ENV === 'production' ? CANONICAL_URL : 'http://localhost:3000'
export const WEBAUTHN_RP_ID = process.env.NODE_ENV === 'production' ? new URL(CANONICAL_URL).hostname : 'localhost'
export const WEBAUTHN_RP_NAME = 'litomi'
export const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? ''
