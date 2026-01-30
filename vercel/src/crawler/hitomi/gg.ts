import { GG_REFRESH_INTERVAL } from './common'

interface GGData {
  b: string
  default: number
  map: Map<number, number>
}

class GG {
  private data: GGData = {
    default: 0,
    map: new Map(),
    b: '',
  }
  private lastRetrieval: number | null = null
  private refreshPromise: Promise<void> | null = null

  async b(): Promise<string> {
    await this.refresh()
    return this.data.b
  }

  async m(g: number): Promise<number> {
    await this.refresh()
    return this.data.map.get(g) ?? this.data.default
  }

  s(h: string): string {
    const match = h.match(/(..)(.)$/)
    if (!match) {
      throw new Error(`Invalid hash format: ${h}`)
    }
    const [, a, b] = match
    return parseInt(b + a, 16).toString(10)
  }

  private async doRefresh(): Promise<void> {
    try {
      const response = await fetch('https://ltn.gold-usergeneratedcontent.net/gg.js')

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const ggjs = await response.text()

      // Parse default value
      const defaultMatch = ggjs.match(/var o = (\d)/)
      if (!defaultMatch) {
        throw new Error('Failed to parse default value from gg.js')
      }
      this.data.default = parseInt(defaultMatch[1], 10)

      // Parse o value for cases
      const oMatch = ggjs.match(/o = (\d); break;/)
      if (!oMatch) {
        throw new Error('Failed to parse o value from gg.js')
      }
      const o = parseInt(oMatch[1], 10)

      // Parse case values
      this.data.map.clear()
      const caseMatches = ggjs.matchAll(/case (\d+):/g)
      for (const match of caseMatches) {
        const caseValue = parseInt(match[1], 10)
        this.data.map.set(caseValue, o)
      }

      // Parse b value
      const bMatch = ggjs.match(/b: '(.+)'/)
      if (!bMatch) {
        throw new Error('Failed to parse b value from gg.js')
      }
      this.data.b = bMatch[1]

      this.lastRetrieval = Date.now()
    } catch (error) {
      console.error('Error refreshing gg.js:', error)
      throw error
    }
  }

  private async refresh(): Promise<void> {
    // If a refresh is already in progress, wait for it
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    // Check if we need to refresh
    if (this.lastRetrieval && this.lastRetrieval + GG_REFRESH_INTERVAL > Date.now()) {
      return
    }

    // Start a new refresh
    this.refreshPromise = this.doRefresh()
    try {
      await this.refreshPromise
    } finally {
      this.refreshPromise = null
    }
  }
}

export const gg = new GG()
