const JUICY_POPUNDER_SCRIPT_ID = 'juicy-popunder'

const JUICY_POPUNDER_SCRIPT_URL =
  'https://js.juicyads.com/jp.php?c=4464w233y284u4r2p27433e424&u=https%3A%2F%2Fwww.juicyads.rocks'

export const JUICY_POPUNDER_TRIGGER_CLASS = 'juicy-popunder-trigger'

type JuicyPopunderAPI = {
  emptyStack: () => void
}

declare global {
  interface Window {
    __juicyPopunderLoadPromise?: Promise<void>
    __juicyPopunderShouldEnable?: boolean
    juicy_tags?: string[]
    jYWWRgFaKP?: JuicyPopunderAPI
  }
}

export function disableJuicyPopunder() {
  if (typeof window === 'undefined') {
    return
  }

  window.__juicyPopunderShouldEnable = false
  window.jYWWRgFaKP?.emptyStack()
}

export async function enableJuicyPopunder() {
  if (typeof window === 'undefined') {
    return
  }

  window.__juicyPopunderShouldEnable = true
  await ensureJuicyPopunderScriptLoaded()

  if (!window.__juicyPopunderShouldEnable) {
    window.jYWWRgFaKP?.emptyStack()
  }
}

async function ensureJuicyPopunderScriptLoaded() {
  if (window.jYWWRgFaKP) {
    return
  }

  if (window.__juicyPopunderLoadPromise) {
    return window.__juicyPopunderLoadPromise
  }

  window.juicy_tags = [`.${JUICY_POPUNDER_TRIGGER_CLASS}`]

  const existingScript = document.getElementById(JUICY_POPUNDER_SCRIPT_ID)

  if (existingScript) {
    window.__juicyPopunderLoadPromise = Promise.resolve()
    return window.__juicyPopunderLoadPromise
  }

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

  return window.__juicyPopunderLoadPromise
}
