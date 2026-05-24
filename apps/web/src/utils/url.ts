import { env } from '@litomi/env/client'

export function toAbsoluteUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  return new URL(url, env.NEXT_PUBLIC_APP_ORIGIN).toString()
}
