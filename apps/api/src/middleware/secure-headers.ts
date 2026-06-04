import { sec } from '@litomi/std'
import { secureHeaders } from 'hono/secure-headers'

export function getDefaultSecureHeadersOptions(): NonNullable<Parameters<typeof secureHeaders>[0]> {
  return {
    contentSecurityPolicy: {
      defaultSrc: ["'none'"],
      baseUri: ["'none'"],
      formAction: ["'none'"],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
    },
    crossOriginResourcePolicy: 'same-origin',
    permissionsPolicy: {
      accelerometer: [],
      autoplay: [],
      browsingTopics: [],
      camera: [],
      fullscreen: [],
      geolocation: [],
      gyroscope: [],
      magnetometer: [],
      microphone: [],
      payment: [],
      usb: [],
    },
    strictTransportSecurity: `max-age=${sec('2 years')}; includeSubDomains; preload`,
    xFrameOptions: 'DENY',
  }
}
