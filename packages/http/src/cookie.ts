export enum CookieKey {
  ACCESS_TOKEN = 'at',
  AUTH_HINT = 'ah',
  LOCALE = 'locale',
  PASSKEY_AUTHENTICATION_ATTEMPT = 'pkai',
  POINTS_TURNSTILE = 'pt',
  REFRESH_TOKEN = 'rt',
  TRUSTED_BROWSER_TOKEN = 'tbt',
}

export const COOKIE_DOMAIN = process.env.NODE_ENV === 'production' ? '.litomi.in' : 'localhost'
