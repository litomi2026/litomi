import 'server-only'
import { env } from '@litomi/env/server.common'

const { APP_ORIGIN } = env

export const WEBAUTHN_ORIGIN = APP_ORIGIN
export const WEBAUTHN_RP_ID = new URL(APP_ORIGIN).hostname
export const WEBAUTHN_RP_NAME = 'litomi'
