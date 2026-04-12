import type { AuthenticationResponseJSON } from '@simplewebauthn/server'

import { getSetCookieStrings } from '@test/backend/setup/app'
import { installExternalFetchGuard } from '@test/backend/setup/network'

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
