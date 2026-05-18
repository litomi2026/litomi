import { env } from '@litomi/env/cli'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { applyAppFunctions } from './applyAppFunction'

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

try {
  await applyAppFunctions(env.APP_POSTGRES_URL_DIRECT, {
    directory: path.join(packageRoot, 'src/database/app/functions'),
    log: (message) => console.log(`[app-functions] ${message}`),
  })
} catch (error) {
  console.error(error)
  process.exit(1)
}
