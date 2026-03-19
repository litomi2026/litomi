const JUICY_POPUNDER_SCRIPT_ID = 'juicy-popunder'
const JUICY_POPUNDER_SCRIPT_URL =
  'https://js.juicyads.com/jp.php?c=4464w233y284u4r2p27433e424&u=https%3A%2F%2Fwww.juicyads.rocks'

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
    __juicyPopunderLoadPromise?: Promise<void>
    __juicyPopunderPrimedPageKey?: string
    __juicyPopunderShouldEnable?: boolean
    __juicyPopunderTemplateEntry?: JuicyPopunderStackEntry
    __juicyPopunderTemplatePagePath?: string
    juicy_tags?: string[]
    jYWWRgFaKP?: JuicyPopunderAPI
  }
}

export function disableJuicyPopunder() {
  if (typeof window === 'undefined') {
    return
  }

  window.__juicyPopunderShouldEnable = false
  window.__juicyPopunderPrimedPageKey = undefined
  window.jYWWRgFaKP?.emptyStack()
}

export async function enableJuicyPopunder() {
  if (typeof window === 'undefined') {
    return
  }

  window.__juicyPopunderShouldEnable = true
  await ensureJuicyPopunderScriptLoaded()

  if (!window.__juicyPopunderShouldEnable) {
    window.__juicyPopunderPrimedPageKey = undefined
    window.jYWWRgFaKP?.emptyStack()
    return
  }

  syncJuicyPopunderStack()
}

function captureJuicyPopunderTemplateOnce() {
  if (window.__juicyPopunderTemplateEntry && window.__juicyPopunderTemplatePagePath) {
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

  window.__juicyPopunderTemplatePagePath = getCurrentLocationPath()
}

function createCurrentPageStackURL(template: JuicyPopunderStackEntry, templatePagePath: string) {
  const currentLocationPath = getCurrentLocationPath()
  const requestURL = new URL(template.url)
  let replaced = false

  for (const [key, value] of requestURL.searchParams.entries()) {
    if (value === templatePagePath) {
      requestURL.searchParams.set(key, currentLocationPath)
      replaced = true
    }
  }

  if (replaced) {
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

function getJuicyPopunderPageKey() {
  return `${window.location.origin}${window.location.pathname}`
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
  const templatePagePath = window.__juicyPopunderTemplatePagePath

  if (!template || !templatePagePath) {
    return
  }

  api.emptyStack()

  api.add(createCurrentPageStackURL(template, templatePagePath), {
    afterOpen: template.afterOpen,
    cookieExpires: template.expires,
    newTab: template.tab,
    under: template.under,
  })

  window.__juicyPopunderPrimedPageKey = currentPageKey
}
