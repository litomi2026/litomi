import { CANONICAL_URL } from '@/constants/url'

const privateIP = `
  ^(?:
    # 10.x.x.x
      10\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)\\.
         (?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)\\.
         (?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)    
    # 172.16.0.0/12
    | 172\\.(?:1[6-9]|2\\d|3[0-1])\\.
         (?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)\\.
         (?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)       
    # 192.168.x.x
    | 192\\.168\\.
         (?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)\\.
         (?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)       
    # fc00::/7
    | (?:fc|fd)[0-9a-f]{0,2}
      (?::[0-9a-f]{0,4}){0,7}
      (?:%[0-9a-zA-Z]{1,})?         
  )$`
  .replace(/#.*$/gm, '')
  .replace(/\s+/g, '')

const ALLOWED_HOSTNAME_REGEX = [
  /^localhost$/i,
  new RegExp(privateIP, 'i'),
  /^litomi(?:-(?:git-[a-z0-9-]{1,10}|[a-z0-9]{1,10}))?-team2837\.vercel\.app$/i,
  /^litomi\.in$/i,
]

export function sanitizeRedirect(url: string | null | undefined) {
  if (!url) return

  try {
    const parsedUrl = new URL(url, CANONICAL_URL)

    if (ALLOWED_HOSTNAME_REGEX.some((re) => re.test(parsedUrl.hostname))) {
      return url
    }

    if (parsedUrl.origin === CANONICAL_URL) {
      return url
    }

    return
  } catch {
    return
  }
}
