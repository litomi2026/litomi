/**
 * Utility functions for URL manipulation
 */

import { gg } from './gg'
import { HitomiFile } from './types'

export async function fullPathFromHash(hash: string): Promise<string> {
  const b = await gg.b()
  const s = gg.s(hash)
  return `${b}${s}/${hash}`
}

export function realFullPathFromHash(hash: string): string {
  const match = hash.match(/^.*(..)(.)$/)
  if (!match) {
    throw new Error(`Invalid hash format: ${hash}`)
  }
  const [, a, b] = match
  return `${b}/${a}/${hash}`
}

export async function subdomainFromURL(url: string, base?: string | null, dir?: string | null): Promise<string> {
  let retval = ''

  if (!base) {
    if (dir === 'webp') {
      retval = 'w'
    } else if (dir === 'avif') {
      retval = 'a'
    }
  }

  const b = 16
  const regex = /\/[0-9a-f]{61}([0-9a-f]{2})([0-9a-f])/
  const match = url.match(regex)

  if (!match) {
    return ''
  }

  const g = parseInt(match[2] + match[1], b)

  if (!isNaN(g)) {
    if (!base) {
      retval = retval + (1 + (await gg.m(g))).toString()
    } else {
      retval = String.fromCharCode(97 + (await gg.m(g))) + base
    }
  }

  return retval
}

export async function urlFromHash(
  _galleryID: number,
  image: HitomiFile,
  dir?: string | null,
  ext?: string | null,
): Promise<string> {
  const extension = ext || dir || image.name.split('.').pop() || ''
  const parts: string[] = ['https://a.gold-usergeneratedcontent.net/']

  if (dir !== 'webp' && dir !== 'avif') {
    if (dir) {
      parts.push(dir)
      parts.push('/')
    }
  }

  parts.push(await fullPathFromHash(image.hash))
  parts.push('.')
  parts.push(extension)

  return parts.join('')
}

export async function urlFromUrl(url: string, base?: string | null, dir?: string | null): Promise<string> {
  const subdomain = await subdomainFromURL(url, base, dir)
  return url.replace(
    /\/\/..?\.(?:gold-usergeneratedcontent\.net|hitomi\.la)\//,
    `//${subdomain}.gold-usergeneratedcontent.net/`,
  )
}

export async function urlFromUrlFromHash(
  galleryID: number,
  image: HitomiFile,
  dir?: string | null,
  ext?: string | null,
  base?: string | null,
): Promise<string> {
  if (base === 'tn') {
    return urlFromUrl(`https://a.gold-usergeneratedcontent.net/${dir}/${realFullPathFromHash(image.hash)}.${ext}`, base)
  } else {
    const url = await urlFromHash(galleryID, image, dir, ext)
    return urlFromUrl(url, base, dir)
  }
}
