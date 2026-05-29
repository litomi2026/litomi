import type { Context } from 'hono'

export function getCloudflareCountryCode(c: Pick<Context, 'req'>): string | undefined {
  const countryCode = c.req.header('CF-IPCountry')?.trim().toUpperCase()

  if (!countryCode || !/^[A-Z0-9]{2}$/.test(countryCode)) {
    return undefined
  }

  return countryCode
}
