import { lookup } from 'node:dns/promises'
import { stat } from 'node:fs/promises'
import { connect, type DetailedPeerCertificate, type PeerCertificate } from 'node:tls'

import { crawlMangas } from './crawl'

const TLS_PROBE_HOSTNAMES = ['k-hentai.org', 'kohentai.org', 'example.com', 'www.google.com', 'api.github.com']
const TLS_PROBE_TIMEOUT_MS = 10_000
const CA_BUNDLE_PATHS = ['/etc/ssl/certs/ca-certificates.crt', '/etc/ssl/cert.pem', '/etc/pki/tls/certs/ca-bundle.crt']

const log = {
  info: (msg: string, ...args: unknown[]) => console.log(`[${new Date().toISOString()}] ℹ️  ${msg}`, ...args),
  success: (msg: string, ...args: unknown[]) => console.log(`[${new Date().toISOString()}] ✅ ${msg}`, ...args),
  error: (msg: string, ...args: unknown[]) => console.error(`[${new Date().toISOString()}] ❌ ${msg}`, ...args),
  warn: (msg: string, ...args: unknown[]) => console.warn(`[${new Date().toISOString()}] ⚠️  ${msg}`, ...args),
}

async function main() {
  const startTime = Date.now()

  try {
    await logKHentaiTLSProbe()

    // Run the crawl job
    await crawlMangas()

    const duration = (Date.now() - startTime) / 1000
    log.success(`Crawl job completed in ${duration.toFixed(2)} seconds`)

    // Log metrics for monitoring
    console.log(
      JSON.stringify({
        severity: 'INFO',
        message: 'Crawl job completed',
        metrics: {
          duration_seconds: duration,
        },
      }),
    )

    process.exit(0)
  } catch (error) {
    log.error('Fatal error during crawl:', error)

    // Log error for monitoring
    console.log(
      JSON.stringify({
        severity: 'ERROR',
        message: 'Crawl job failed',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }),
    )

    process.exit(1)
  }
}

main()

async function logKHentaiTLSProbe() {
  try {
    const [hosts, caBundles] = await Promise.all([
      Promise.all(TLS_PROBE_HOSTNAMES.map(probeHost)),
      Promise.all(CA_BUNDLE_PATHS.map(statCABundle)),
    ])

    console.log(
      JSON.stringify({
        severity: 'INFO',
        message: 'Cataloger HTTPS TLS probe',
        probe: {
          hostnames: TLS_PROBE_HOSTNAMES,
          runtime: {
            bun: typeof Bun === 'undefined' ? undefined : Bun.version,
            node: process.version,
            platform: process.platform,
            arch: process.arch,
            now: new Date().toISOString(),
          },
          env: {
            httpProxyPresent: Boolean(process.env.HTTP_PROXY || process.env.http_proxy),
            httpsProxyPresent: Boolean(process.env.HTTPS_PROXY || process.env.https_proxy),
            noProxyPresent: Boolean(process.env.NO_PROXY || process.env.no_proxy),
            nodeTLSRejectUnauthorized: process.env.NODE_TLS_REJECT_UNAUTHORIZED,
            sslCertFile: process.env.SSL_CERT_FILE,
            sslCertDir: process.env.SSL_CERT_DIR,
          },
          caBundles,
          hosts,
        },
      }),
    )
  } catch (error) {
    log.warn('K-Hentai TLS probe failed:', error)
  }
}

async function probeHost(hostname: string) {
  const [dns, tls] = await Promise.all([
    lookup(hostname, { all: true }).catch((error: unknown) => ({
      error: toErrorLog(error),
    })),
    probeTLSCertificate(hostname),
  ])

  return { hostname, dns, tls }
}

async function probeTLSCertificate(hostname: string) {
  return new Promise((resolve) => {
    const socket = connect({
      host: hostname,
      port: 443,
      rejectUnauthorized: false,
      servername: hostname,
      timeout: TLS_PROBE_TIMEOUT_MS,
    })

    const finish = (result: unknown) => {
      socket.removeAllListeners()
      socket.destroy()
      resolve(result)
    }

    socket.once('secureConnect', () => {
      finish({
        authorized: socket.authorized,
        authorizationError: socket.authorizationError,
        cipher: socket.getCipher(),
        peerCertificate: serializeCertificate(socket.getPeerCertificate(true)),
        protocol: socket.getProtocol(),
      })
    })

    socket.once('timeout', () => {
      finish({ error: 'TLS probe timed out' })
    })

    socket.once('error', (error) => {
      finish({ error: toErrorLog(error) })
    })
  })
}

function serializeCertificate(certificate: DetailedPeerCertificate | PeerCertificate | null) {
  if (!certificate || Object.keys(certificate).length === 0) {
    return null
  }

  const issuers = []
  let current: DetailedPeerCertificate | PeerCertificate | undefined = certificate

  for (let depth = 0; current && depth < 4; depth++) {
    issuers.push({
      fingerprint256: current.fingerprint256,
      issuer: current.issuer,
      serialNumber: current.serialNumber,
      subject: current.subject,
      subjectaltname: current.subjectaltname,
      valid_from: current.valid_from,
      valid_to: current.valid_to,
    })

    const issuerCertificate: DetailedPeerCertificate | PeerCertificate | undefined = (current as DetailedPeerCertificate)
      .issuerCertificate
    if (!issuerCertificate || issuerCertificate === current) {
      break
    }

    current = issuerCertificate
  }

  return issuers
}

async function statCABundle(path: string) {
  try {
    const result = await stat(path)
    return {
      path,
      exists: true,
      size: result.size,
      modifiedAt: result.mtime.toISOString(),
    }
  } catch (error) {
    return {
      path,
      exists: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

function toErrorLog(error: unknown) {
  if (!(error instanceof Error)) {
    return String(error)
  }

  return {
    message: error.message,
    name: error.name,
    code: 'code' in error ? error.code : undefined,
  }
}
