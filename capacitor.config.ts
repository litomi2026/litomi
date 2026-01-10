import type { CapacitorConfig } from '@capacitor/cli'

function getCapacitorServerConfig(): CapacitorConfig['server'] | undefined {
  const raw = process.env.CAPACITOR_SERVER_URL?.trim()
  if (!raw) {
    return undefined
  }

  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new Error(`Invalid CAPACITOR_SERVER_URL: ${raw}`)
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`CAPACITOR_SERVER_URL must start with http:// or https:// (got: ${raw})`)
  }

  return {
    url: url.toString().replace(/\/$/, ''),
    cleartext: url.protocol === 'http:',
  }
}

const config: CapacitorConfig = {
  appId: 'in.litomi.app',
  appName: '리토미',
  webDir: 'public',
  server: getCapacitorServerConfig(),
}

export default config
