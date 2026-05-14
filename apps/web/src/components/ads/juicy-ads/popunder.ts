const JUICY_POPUNDER_SCRIPT_ID = 'juicy-popunder'
const JUICY_POPUNDER_SCRIPT_CODE = '4464w233y284u4r2p27433e424'
const JUICY_POPUNDER_SCRIPT_TARGET_URL = 'https://www.juicyads.rocks'

const JUICY_POPUNDER_SCRIPT_URL = `https://js.juicyads.com/jp.php?${new URLSearchParams({
  c: JUICY_POPUNDER_SCRIPT_CODE,
  u: JUICY_POPUNDER_SCRIPT_TARGET_URL,
})}`

export const JUICY_POPUNDER_TRIGGER_CLASS = 'juicy-popunder-trigger'

type JuicyPopunderAPI = {
  add: (
    url: string,
    options: {
      afterOpen?: (popupWindow: Window | null, targetURL: string, options: unknown) => void
      cookieExpires: number
      newTab: boolean
      under: boolean
    },
  ) => void
  emptyStack: () => void
  getStack: () => JuicyPopunderStackEntry[]
}

type JuicyPopunderStackEntry = {
  afterOpen?: (popupWindow: Window | null, targetURL: string, options: unknown) => void
  expires: number
  tab: boolean
  under: boolean
  url: string
}

declare global {
  interface Window {
    __juicyPopunderEnableCount?: number
    __juicyPopunderLoadPromise?: Promise<void>
    __juicyPopunderPrimedPageKey?: string
    __juicyPopunderTemplateEntry?: JuicyPopunderStackEntry
    __juicyPopunderTemplatePageParamKeys?: string[]
    juicy_tags?: string[]
    jYWWRgFaKP?: JuicyPopunderAPI
  }
}

export function disableJuicyPopunder() {
  if (typeof window === 'undefined') {
    return
  }

  window.__juicyPopunderEnableCount = Math.max((window.__juicyPopunderEnableCount ?? 0) - 1, 0)

  if (isJuicyPopunderEnabled()) {
    return
  }

  window.__juicyPopunderPrimedPageKey = undefined
  window.jYWWRgFaKP?.emptyStack()
}

export async function enableJuicyPopunder() {
  if (typeof window === 'undefined') {
    return
  }

  window.__juicyPopunderEnableCount = (window.__juicyPopunderEnableCount ?? 0) + 1
  await ensureJuicyPopunderScriptLoaded()

  if (!isJuicyPopunderEnabled()) {
    window.__juicyPopunderPrimedPageKey = undefined
    window.jYWWRgFaKP?.emptyStack()
    return
  }

  syncJuicyPopunderStack()
}

function captureJuicyPopunderTemplateOnce() {
  if (window.__juicyPopunderTemplateEntry && window.__juicyPopunderTemplatePageParamKeys) {
    return
  }

  const entry = window.jYWWRgFaKP?.getStack()?.[0]

  if (!entry) {
    return
  }

  window.__juicyPopunderTemplateEntry = {
    afterOpen: entry.afterOpen,
    expires: entry.expires,
    tab: entry.tab,
    under: entry.under,
    url: entry.url,
  }

  if (!window.__juicyPopunderPrimedPageKey) {
    window.__juicyPopunderPrimedPageKey = getJuicyPopunderPageKey()
  }

  window.__juicyPopunderTemplatePageParamKeys = getCurrentPageParamKeys(entry.url)
}

function createCurrentPageStackURL(template: JuicyPopunderStackEntry, templatePageParamKeys: string[]) {
  const currentLocationPath = getCurrentLocationPath()
  const requestURL = new URL(template.url)

  for (const key of templatePageParamKeys) {
    requestURL.searchParams.set(key, currentLocationPath)
  }

  if (templatePageParamKeys.length > 0) {
    return requestURL.toString()
  }

  return template.url
}

async function ensureJuicyPopunderScriptLoaded() {
  if (window.jYWWRgFaKP) {
    captureJuicyPopunderTemplateOnce()
    return
  }

  if (window.__juicyPopunderLoadPromise) {
    await window.__juicyPopunderLoadPromise
    captureJuicyPopunderTemplateOnce()
    return
  }

  window.juicy_tags = [`.${JUICY_POPUNDER_TRIGGER_CLASS}`]

  window.__juicyPopunderLoadPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')

    script.id = JUICY_POPUNDER_SCRIPT_ID
    script.async = true
    script.src = JUICY_POPUNDER_SCRIPT_URL
    script.setAttribute('data-cfasync', 'false')
    script.addEventListener('load', () => resolve(), { once: true })
    script.addEventListener(
      'error',
      () => {
        window.__juicyPopunderLoadPromise = undefined
        reject(new Error('JuicyAds popunder script failed to load'))
      },
      { once: true },
    )

    document.body.appendChild(script)
  })

  await window.__juicyPopunderLoadPromise
  captureJuicyPopunderTemplateOnce()
}

function getCurrentLocationPath() {
  return `${window.location.host}${window.location.pathname}`.replace(/\/$/, '')
}

function getCurrentPageParamKeys(url: string) {
  const currentLocationPath = getCurrentLocationPath()
  const requestURL = new URL(url)
  const keys: string[] = []

  for (const [key, value] of requestURL.searchParams) {
    if (value === currentLocationPath) {
      keys.push(key)
    }
  }

  return keys
}

function getJuicyPopunderPageKey() {
  return `${window.location.origin}${window.location.pathname}`
}

function isJuicyPopunderEnabled() {
  return (window.__juicyPopunderEnableCount ?? 0) > 0
}

function syncJuicyPopunderStack() {
  const api = window.jYWWRgFaKP
  const currentPageKey = getJuicyPopunderPageKey()

  if (!api) {
    return
  }

  const stack = api.getStack()

  if (stack.length > 0 && window.__juicyPopunderPrimedPageKey === currentPageKey) {
    return
  }

  const template = window.__juicyPopunderTemplateEntry
  const templatePageParamKeys = window.__juicyPopunderTemplatePageParamKeys

  if (!template || !templatePageParamKeys) {
    return
  }

  api.emptyStack()

  api.add(createCurrentPageStackURL(template, templatePageParamKeys), {
    afterOpen: template.afterOpen,
    cookieExpires: template.expires,
    newTab: template.tab,
    under: template.under,
  })

  window.__juicyPopunderPrimedPageKey = currentPageKey
}
