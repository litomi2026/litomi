#!/usr/bin/env bun

import { readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import postgres from 'postgres'

import { env } from '../../src/env.cli'

type PgCronExtension = {
  defaultVersion: string | null
  installedVersion: string | null
}

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

if (import.meta.main) {
  try {
    await syncAppSQL(env.APP_POSTGRES_URL_DIRECT)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

type ApplySqlDirectoryOptions = {
  directory: string
  label: string
}

async function applySqlDirectory(client: postgres.Sql, options: ApplySqlDirectoryOptions) {
  const files = await readSQLFiles(options.directory)

  if (files.length === 0) {
    log(options.label, `no SQL files found in ${path.relative(process.cwd(), options.directory)}`)
    return
  }

  await applySQLFiles(client, files, options)
}

async function applySQLFiles(client: postgres.Sql, files: string[], options: ApplySqlDirectoryOptions) {
  for (const file of files) {
    log(options.label, `applying ${path.relative(process.cwd(), file)}`)
    await client.file(file)
  }

  log(options.label, `applied ${files.length} SQL files`)
}

function log(label: string, message: string) {
  console.log(`[${label}] ${message}`)
}

async function readSQLFiles(directory: string) {
  const directoryEntries = await readdir(directory, { withFileTypes: true }).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') {
      return []
    }

    throw error
  })

  return directoryEntries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
    .map((entry) => path.join(directory, entry.name))
    .sort((left, right) => left.localeCompare(right))
}

async function syncAppSQL(url: string) {
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
    await applySqlDirectory(client, {
      directory: path.join(packageRoot, 'src/app/function'),
      label: 'app-function',
    })

    await syncCronSQL(client, path.join(packageRoot, 'src/app/cron'))
  } finally {
    await client.end({ timeout: 5 })
  }
}

async function syncCronSQL(client: postgres.Sql, directory: string) {
  const files = await readSQLFiles(directory)

  if (files.length === 0) {
    log('app-cron', `no SQL cron files found in ${path.relative(process.cwd(), directory)}`)
    return
  }

  const [pgCron] = await client<PgCronExtension[]>`
    select
      default_version as "defaultVersion",
      installed_version as "installedVersion"
    from pg_available_extensions
    where name = 'pg_cron'
  `

  if (!pgCron) {
    log('app-cron', 'pg_cron is not available; skipping app cron sync')
    return
  }

  if (!pgCron.installedVersion) {
    log('app-cron', `installing pg_cron ${pgCron.defaultVersion ?? ''}`.trim())
    await client`create extension if not exists pg_cron`
  }

  await applySQLFiles(client, files, { directory, label: 'app-cron' })
}
