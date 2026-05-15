import type { AuthenticationResponseJSON } from '@simplewebauthn/server'

import { CookieKey } from '@litomi/domain/constants/storage'
import { getSetCookieStrings, requestBackend } from '@test/backend/setup/app'
import { installExternalFetchGuard } from '@test/backend/setup/network'

import { buildAuthHeaders } from '../fixtures'
import { turnstileErrorRoute, turnstileFailureRoute, turnstileSuccessRoute } from '../login/fixtures'

type BuildPasskeyAuthenticationInput = {
  clientExtensionResults?: AuthenticationResponseJSON['clientExtensionResults']
  id: string
  rawId?: string
  response?: Partial<AuthenticationResponseJSON['response']>
}

type TurnstileGuardResult = 'error' | 'failure' | 'success'

export function buildPasskeyAuthentication({
  id,
  rawId,
  response,
  clientExtensionResults,
}: BuildPasskeyAuthenticationInput): AuthenticationResponseJSON {
  return {
    id,
    rawId: rawId ?? id,
    type: 'public-key',
    response: {
      authenticatorData: response?.authenticatorData ?? 'authenticator-data',
      clientDataJSON: response?.clientDataJSON ?? 'client-data-json',
      signature: response?.signature ?? 'signature',
      ...(response?.userHandle !== undefined && { userHandle: response.userHandle }),
    },
    clientExtensionResults: clientExtensionResults ?? {},
  }
}

export function getResponseCookieValue(response: Response, name: string) {
  const cookie = getSetCookieStrings(response).find((value) => value.startsWith(`${name}=`))

  if (!cookie) {
    return null
  }

  const pair = cookie.split(';', 1)[0]
  return pair?.slice(name.length + 1) ?? null
}

export function installPasskeyTurnstileGuard(result: TurnstileGuardResult = 'success') {
  return installExternalFetchGuard([resolveTurnstileRoute(result)])
}

export async function issuePasskeyAttempt({ ip, attempts = 1 }: { attempts?: number; ip: string }) {
  let response: Response | null = null

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    response = await requestBackend({
      path: '/api/v1/auth/passkey/options',
      method: 'POST',
      headers: buildAuthHeaders({ ip }),
    })

    if (response.status !== 200) {
      throw new Error(`passkey options setup failed with status ${response.status}`)
    }
  }

  if (!response) {
    throw new Error('passkey options response should exist')
  }

  const pkai = getResponseCookieValue(response, CookieKey.PASSKEY_AUTHENTICATION_ATTEMPT)
  const body = await response.json()

  if (!pkai) {
    throw new Error('passkey authentication attempt cookie should be issued')
  }

  return {
    pkai,
    turnstileRequired: Boolean(body.turnstileRequired),
  }
}

function resolveTurnstileRoute(result: TurnstileGuardResult) {
  switch (result) {
    case 'error':
      return turnstileErrorRoute()
    case 'failure':
      return turnstileFailureRoute()
    case 'success':
    default:
      return turnstileSuccessRoute()
  }
}
