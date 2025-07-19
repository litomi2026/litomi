declare global {
  const Deno: { env: { get: (key: string) => string | undefined } } | undefined
}

const getEnvironmentVariable = (key: string) => {
  return process.env[key] || (typeof Deno !== 'undefined' && Deno.env.get(key)) || ''
}

export const AMPLITUDE_API_KEY = getEnvironmentVariable('AMPLITUDE_API_KEY')
export const GA_ID = getEnvironmentVariable('GA_ID')
export const GTM_ID = getEnvironmentVariable('GTM_ID')
export const JWT_SECRET_ACCESS_TOKEN = getEnvironmentVariable('JWT_SECRET_ACCESS_TOKEN')
export const JWT_SECRET_REFRESH_TOKEN = getEnvironmentVariable('JWT_SECRET_REFRESH_TOKEN')
export const NEXT_PUBLIC_CORS_PROXY_URL = getEnvironmentVariable('NEXT_PUBLIC_CORS_PROXY_URL')
export const NEXT_PUBLIC_BACKEND_URL = getEnvironmentVariable('NEXT_PUBLIC_BACKEND_URL')
export const NEXT_PUBLIC_VAPID_PUBLIC_KEY = getEnvironmentVariable('NEXT_PUBLIC_VAPID_PUBLIC_KEY')
export const POSTGRES_URL = getEnvironmentVariable('POSTGRES_URL')
