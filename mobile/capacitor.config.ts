import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'in.litomi.app',
  appName: '리토미',
  webDir: 'dist',
  server: {
    url: 'https://litomi.in',
    cleartext: false,
  },
}

export default config
