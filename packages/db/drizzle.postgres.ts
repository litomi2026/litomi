import type { ConnectionOptions } from 'node:tls'

type DrizzlePostgresCredentials = {
  database: string
  host: string
  password?: string
  port?: number
  ssl: 'allow' | 'prefer' | 'require' | 'verify-full' | false | ConnectionOptions
  user?: string
}

export function postgresURLToDrizzleCredentials(
  connectionURL: string,
  certificate?: string,
): DrizzlePostgresCredentials {
  const parsed = new URL(connectionURL)

  return {
    database: decodeURIComponent(parsed.pathname.slice(1)),
    host: parsed.hostname,
    password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
    port: parsed.port ? Number(parsed.port) : undefined,
    ssl: resolvePostgresSSL(parsed, certificate),
    user: parsed.username ? decodeURIComponent(parsed.username) : undefined,
  }
}

function resolvePostgresSSL(parsedURL: URL, certificate?: string): DrizzlePostgresCredentials['ssl'] {
  if (certificate) {
    return { ca: certificate, rejectUnauthorized: true }
  }

  const sslMode = parsedURL.searchParams.get('sslmode')

  if (sslMode === 'disable') {
    return false
  }

  if (sslMode === 'allow' || sslMode === 'prefer' || sslMode === 'require' || sslMode === 'verify-full') {
    return sslMode
  }

  return 'prefer'
}
