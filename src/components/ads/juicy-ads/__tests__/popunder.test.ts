import { afterEach, describe, expect, it, mock } from 'bun:test'

import { disableJuicyPopunder, enableJuicyPopunder, JUICY_POPUNDER_TRIGGER_CLASS } from '../popunder'

type JuicyPopunderAddOptions = {
  afterOpen?: (popupWindow: Window | null, targetURL: string, options: unknown) => void
  cookieExpires: number
  newTab: boolean
  under: boolean
}

type JuicyPopunderStackEntry = {
  afterOpen?: (popupWindow: Window | null, targetURL: string, options: unknown) => void
  expires: number
  tab: boolean
  under: boolean
  url: string
}

type JuicyPopunderWindow = typeof globalThis &
  Window & {
    __juicyPopunderEnableCount?: number
    __juicyPopunderLoadPromise?: Promise<void>
    __juicyPopunderPrimedPageKey?: string
    __juicyPopunderTemplateEntry?: JuicyPopunderStackEntry
    __juicyPopunderTemplatePageParamKeys?: string[]
    juicy_tags?: string[]
    jYWWRgFaKP?: {
      add: (url: string, options: JuicyPopunderAddOptions) => unknown
      emptyStack: () => unknown
      getStack: () => JuicyPopunderStackEntry[]
    }
  }

function createMockJuicyPopunderAPI(initialEntry: JuicyPopunderStackEntry) {
  let stack = [{ ...initialEntry }]

  const api = {
    add: mock((url: string, options: JuicyPopunderAddOptions) => {
      stack.push({
        afterOpen: options.afterOpen,
        expires: options.cookieExpires,
        tab: options.newTab,
        under: options.under,
        url,
      })
    }),
    emptyStack: mock(() => {
      stack = []
    }),
    getStack: mock(() => stack),
  }

  return {
    api,
    getStack: () => stack,
  }
}

function interceptJuicyPopunderScript({
  api,
  deferLoad = false,
}: {
  api: NonNullable<JuicyPopunderWindow['jYWWRgFaKP']>
  deferLoad?: boolean
}) {
  const popunderWindow = window as JuicyPopunderWindow
  const originalAppendChild = document.body.appendChild
  const appendedScripts: HTMLScriptElement[] = []

  const dispatchLoad = (script: HTMLScriptElement | null = appendedScripts.at(-1) ?? null) => {
    popunderWindow.jYWWRgFaKP = api
    script?.dispatchEvent(new window.Event('load'))
  }

  document.body.appendChild = mock((node: Node) => {
    const script = node as HTMLScriptElement

    appendedScripts.push(script)

    if (!deferLoad) {
      queueMicrotask(() => dispatchLoad(script))
    }

    return node
  }) as typeof document.body.appendChild

  return {
    dispatchLoad,
    getAppendCount: () => appendedScripts.length,
    getLatestScript: () => appendedScripts.at(-1) ?? null,
    restore: () => {
      document.body.appendChild = originalAppendChild
    },
  }
}

afterEach(() => {
  disableJuicyPopunder()

  const popunderWindow = window as JuicyPopunderWindow

  delete popunderWindow.__juicyPopunderEnableCount
  delete popunderWindow.__juicyPopunderLoadPromise
  delete popunderWindow.__juicyPopunderPrimedPageKey
  delete popunderWindow.__juicyPopunderTemplateEntry
  delete popunderWindow.__juicyPopunderTemplatePageParamKeys
  delete popunderWindow.juicy_tags
  delete popunderWindow.jYWWRgFaKP

  document.body.innerHTML = ''
  window.history.replaceState({}, '', '/')
})

describe('Juicy popunder stack sync', () => {
  it('loads the vendor script once and re-primes the stack with the current pathname', async () => {
    setCurrentPath('/title/1')

    const afterOpen = mock(() => undefined)
    const { api, getStack } = createMockJuicyPopunderAPI({
      afterOpen,
      expires: 28800,
      tab: false,
      under: true,
      url: 'https://xapi.juicyads.com/hash.php?juicy_code=test&u=https://landing.example&x=localhost:3000/title/1',
    })
    const { getAppendCount, getLatestScript, restore } = interceptJuicyPopunderScript({ api })

    try {
      await enableJuicyPopunder()

      expect((window as JuicyPopunderWindow).juicy_tags).toEqual([`.${JUICY_POPUNDER_TRIGGER_CLASS}`])
      expect(getAppendCount()).toBe(1)
      expect(getLatestScript()?.id).toBe('juicy-popunder')
      expect(api.add).not.toHaveBeenCalled()
      expect((window as JuicyPopunderWindow).__juicyPopunderPrimedPageKey).toBe('http://localhost:3000/title/1')

      disableJuicyPopunder()
      expect(getStack()).toEqual([])

      await enableJuicyPopunder()

      expect(getAppendCount()).toBe(1)
      expect(api.add).toHaveBeenCalledTimes(1)
      expectStackEntry(getStack()[0], '/title/1')
      expect(getStack()[0]?.afterOpen).toBe(afterOpen)

      setCurrentPath('/title/2')
      await enableJuicyPopunder()

      expect(getAppendCount()).toBe(1)
      expect(api.add).toHaveBeenCalledTimes(2)
      expectStackEntry(getStack()[0], '/title/2')
      expect(getStack()[0]?.afterOpen).toBe(afterOpen)
      expect((window as JuicyPopunderWindow).__juicyPopunderPrimedPageKey).toBe('http://localhost:3000/title/2')
    } finally {
      restore()
    }
  })

  it('captures the vendor stack before a deferred load is disabled and reuses it later', async () => {
    setCurrentPath('/title/1')

    const afterOpen = mock(() => undefined)
    const { api, getStack } = createMockJuicyPopunderAPI({
      afterOpen,
      expires: 28800,
      tab: false,
      under: true,
      url: 'https://xapi.juicyads.com/hash.php?juicy_code=test&u=https://landing.example&x=localhost:3000/title/1',
    })
    const { dispatchLoad, getAppendCount, restore } = interceptJuicyPopunderScript({ api, deferLoad: true })

    try {
      const enablePromise = enableJuicyPopunder()

      expect(getAppendCount()).toBe(1)

      disableJuicyPopunder()
      dispatchLoad()
      await enablePromise

      expect(api.emptyStack).toHaveBeenCalledTimes(1)
      expect((window as JuicyPopunderWindow).__juicyPopunderTemplateEntry?.afterOpen).toBe(afterOpen)

      setCurrentPath('/title/2')
      await enableJuicyPopunder()

      expect(getAppendCount()).toBe(1)
      expect(api.add).toHaveBeenCalledTimes(1)
      expectStackEntry(getStack()[0], '/title/2')
    } finally {
      restore()
    }
  })

  it('keeps popunder active until the last trigger unregisters', async () => {
    setCurrentPath('/title/1')

    const { api, getStack } = createMockJuicyPopunderAPI({
      expires: 28800,
      tab: false,
      under: true,
      url: 'https://xapi.juicyads.com/hash.php?juicy_code=test&u=https://landing.example&x=localhost:3000/title/1',
    })
    const { getAppendCount, restore } = interceptJuicyPopunderScript({ api })

    try {
      await enableJuicyPopunder()
      await enableJuicyPopunder()

      expect(getAppendCount()).toBe(1)
      expect(getStack()).toHaveLength(1)

      disableJuicyPopunder()

      expect(api.emptyStack).not.toHaveBeenCalled()
      expect(getStack()).toHaveLength(1)

      disableJuicyPopunder()

      expect(api.emptyStack).toHaveBeenCalledTimes(1)
      expect(getStack()).toEqual([])
    } finally {
      restore()
    }
  })
})

function expectStackEntry(entry: JuicyPopunderStackEntry | undefined, pathname: string) {
  expect(entry).toBeDefined()

  const requestURL = new URL(entry!.url)

  expect(requestURL.origin).toBe('https://xapi.juicyads.com')
  expect(requestURL.pathname).toBe('/hash.php')
  expect(requestURL.searchParams.get('juicy_code')).toBe('test')
  expect(requestURL.searchParams.get('u')).toBe('https://landing.example')
  expect(requestURL.searchParams.get('x')).toBe(`localhost:3000${pathname}`)
  expect(entry).toMatchObject({
    expires: 28800,
    tab: false,
    under: true,
  })
}

function setCurrentPath(pathname: string) {
  window.history.replaceState({}, '', pathname)
}
