import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'in.litomi.app',
  appName: '리토미',
  webDir: 'dist',
  backgroundColor: '#120d12',
  server: {
    url: 'https://litomi.in',
    cleartext: false,
    errorPath: 'error/index.html',
  },
}

export default config
