import '@test/setup.base'
import { afterAll, afterEach, describe, expect, it, mock } from 'bun:test'

import { ChallengeType } from '@/database/enum'

const getdelMock = mock(async (): Promise<unknown | null> => null)
const setMock = mock(async (): Promise<'OK'> => 'OK')

mock.module('@/database/redis', () => ({
  redisClient: {
    getdel: getdelMock,
    set: setMock,
  },
}))

const { getAndDeleteChallenge, storeChallenge } = await import('../redis-challenge')

afterEach(() => {
  getdelMock.mockClear()
  setMock.mockClear()
})

afterAll(() => {
  mock.restore()
})

describe('redis-challenge', () => {
  it('stores payload objects without an extra payload helper', async () => {
    const challenge = {
      challenge: 'passkey-challenge',
      turnstileRequired: true,
    }

    await storeChallenge('attempt-1', ChallengeType.AUTHENTICATION, challenge)

    const [key, storedChallenge, options] = setMock.mock.calls[0] as unknown as [
      string,
      typeof challenge,
      { ex: number },
    ]

    expect(key).toBe(`challenge:${ChallengeType.AUTHENTICATION}:attempt-1`)
    expect(storedChallenge).toEqual(challenge)
    expect(options.ex).toBe(180)
  })

  it('returns string challenges as-is', async () => {
    getdelMock.mockResolvedValueOnce('registration-challenge')

    const challenge = await getAndDeleteChallenge('attempt-1', ChallengeType.REGISTRATION)

    expect(challenge).toBe('registration-challenge')
  })

  it('returns object challenges as-is', async () => {
    getdelMock.mockResolvedValueOnce({
      challenge: 'passkey-challenge',
      turnstileRequired: false,
    })

    const challenge = await getAndDeleteChallenge<{ challenge: string; turnstileRequired: boolean }>(
      'attempt-1',
      ChallengeType.AUTHENTICATION,
    )

    expect(challenge).toEqual({
      challenge: 'passkey-challenge',
      turnstileRequired: false,
    })
  })
})
