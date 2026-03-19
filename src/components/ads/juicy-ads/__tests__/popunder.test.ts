import { afterEach, describe, expect, it, mock } from 'bun:test'

import { disableJuicyPopunder, enableJuicyPopunder, JUICY_POPUNDER_TRIGGER_CLASS } from '../popunder'

type JuicyPopunderStackEntry = {
  url: string
  under: boolean
  tab: boolean
  expires: number
  afterOpen?: () => void
}

type JuicyPopunderWindow = typeof globalThis &
  Window & {
    __juicyPopunderLoadPromise?: Promise<void>
    __juicyPopunderShouldEnable?: boolean
    juicy_tags?: string[]
    jYWWRgFaKP?: {
      emptyStack: () => unknown
      getStack: () => JuicyPopunderStackEntry[]
    }
  }

function createMockJuicyPopunderAPI(initialEntries: JuicyPopunderStackEntry[]) {
  let stack = initialEntries.map((entry) => ({ ...entry }))

  const api = {
    emptyStack: mock(() => {
      stack = []
      return api
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
  let appendedScript: HTMLScriptElement | null = null

  const dispatchLoad = () => {
    popunderWindow.jYWWRgFaKP = api
    appendedScript?.dispatchEvent(new window.Event('load'))
  }

  document.body.appendChild = mock((node: Node) => {
    appendedScript = node as HTMLScriptElement

    if (!deferLoad) {
      queueMicrotask(dispatchLoad)
    }

    return node
  }) as typeof document.body.appendChild

  return {
    dispatchLoad,
    restore: () => {
      document.body.appendChild = originalAppendChild
    },
  }
}

afterEach(() => {
  disableJuicyPopunder()

  const popunderWindow = window as JuicyPopunderWindow

  delete popunderWindow.__juicyPopunderLoadPromise
  delete popunderWindow.__juicyPopunderShouldEnable
  delete popunderWindow.juicy_tags
  delete popunderWindow.jYWWRgFaKP

  document.body.innerHTML = ''
})

describe('Juicy popunder live stack control', () => {
  it('loads the vendor script once and leaves the live stack untouched', async () => {
    const initialEntries = [
      {
        url: 'https://xapi.juicyads.com/popunder.php?slot=1&x=example.com/title/1',
        under: true,
        tab: false,
        expires: 28800,
      },
    ]
    const { api, getStack } = createMockJuicyPopunderAPI(initialEntries)
    const { restore } = interceptJuicyPopunderScript({ api })

    try {
      await enableJuicyPopunder()

      expect((window as JuicyPopunderWindow).juicy_tags).toEqual([`.${JUICY_POPUNDER_TRIGGER_CLASS}`])
      expect(getStack()).toEqual(initialEntries)

      await enableJuicyPopunder()
      expect(getStack()).toEqual(initialEntries)
    } finally {
      restore()
    }
  })

  it('empties the live stack when disabled before the script finishes loading and does not replay it later', async () => {
    const initialEntries = [
      {
        url: 'https://xapi.juicyads.com/popunder.php?slot=1&x=example.com/title/2',
        under: true,
        tab: false,
        expires: 28800,
      },
    ]
    const { api, getStack } = createMockJuicyPopunderAPI(initialEntries)
    const { dispatchLoad, restore } = interceptJuicyPopunderScript({ api, deferLoad: true })

    try {
      const enablePromise = enableJuicyPopunder()

      disableJuicyPopunder()
      dispatchLoad()
      await enablePromise

      expect(getStack()).toEqual([])

      await enableJuicyPopunder()
      expect(getStack()).toEqual([])
    } finally {
      restore()
    }
  })
})
