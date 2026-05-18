import { readdir } from 'node:fs/promises'
import path from 'node:path'
import postgres from 'postgres'

type ApplyAppFunctionsOptions = {
  directory?: string
  log?: (message: string) => void
}

export async function applyAppFunctions(url: string, options: ApplyAppFunctionsOptions = {}) {
  const functionsDirectory = options.directory ?? path.join(process.cwd(), 'src', 'database', 'app', 'functions')
  const files = await readSqlFiles(functionsDirectory)
  const log = options.log ?? (() => {})

  if (files.length === 0) {
    log(`no SQL function files found in ${path.relative(process.cwd(), functionsDirectory)}`)
    return
  }

  const client = postgres(url, {
    max: 1,
    idle_timeout: 5,
    connect_timeout: 5,
    prepare: false,
    ssl: process.env.APP_POSTGRES_CERTIFICATE
      ? { ca: process.env.APP_POSTGRES_CERTIFICATE, rejectUnauthorized: true }
      : 'prefer',
  })

  try {
    for (const file of files) {
      log(`applying ${path.relative(process.cwd(), file)}`)
      await client.file(file)
    }

    log(`applied ${files.length} SQL function files`)
  } finally {
    await client.end({ timeout: 5 })
  }
}

async function readSqlFiles(functionsDirectory: string) {
  const directoryEntries = await readdir(functionsDirectory, { withFileTypes: true }).catch(
    (error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') {
        return []
      }

      throw error
    },
  )

  return directoryEntries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
    .map((entry) => path.join(functionsDirectory, entry.name))
    .sort((left, right) => left.localeCompare(right))
}
