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
    xFrameOptions: 'DENY',
  }
}
