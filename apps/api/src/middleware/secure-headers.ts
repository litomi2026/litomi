import { sec } from '@litomi/std'
import type { secureHeaders } from 'hono/secure-headers'

export function getDefaultSecureHeadersOptions(): NonNullable<Parameters<typeof secureHeaders>[0]> {
  return {
    contentSecurityPolicy: {
      defaultSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
    strictTransportSecurity: `max-age=${sec('2 years')}; includeSubDomains; preload`,
    crossOriginOpenerPolicy: false,
    originAgentCluster: false,
    referrerPolicy: false,
    xDnsPrefetchControl: false,
    xDownloadOptions: false,
    xFrameOptions: false,
    xPermittedCrossDomainPolicies: false,
    xXssProtection: false,
  }
}
