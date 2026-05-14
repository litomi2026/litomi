import { APP_ORIGIN } from '@/constants'

export function toAbsoluteUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  return new URL(url, APP_ORIGIN).toString()
}
