import '@test/setup.base'
import { afterAll, afterEach, describe, expect, it, mock } from 'bun:test'
import { ChallengeType } from '@litomi/domain/auth/model'

const getdelRedisJsonMock = mock(async (): Promise<unknown | null> => null)
const setRedisJsonMock = mock(async (): Promise<void> => undefined)

mock.module('@litomi/db/redis', () => ({
  getdelRedisJson: getdelRedisJsonMock,
  setRedisJson: setRedisJsonMock,
}))

const { getAndDeleteChallenge, storeChallenge } = await import('@litomi/auth/redis-challenge')

afterEach(() => {
  getdelRedisJsonMock.mockClear()
  setRedisJsonMock.mockClear()
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

    const [key, storedChallenge, options] = setRedisJsonMock.mock.calls[0] as unknown as [
      string,
      typeof challenge,
      { ex: number },
    ]

    expect(key).toBe(`challenge:${ChallengeType.AUTHENTICATION}:attempt-1`)
    expect(storedChallenge).toEqual(challenge)
    expect(options.ex).toBe(180)
  })

  it('returns string challenges as-is', async () => {
    getdelRedisJsonMock.mockResolvedValueOnce('registration-challenge')

    const challenge = await getAndDeleteChallenge('attempt-1', ChallengeType.REGISTRATION)

    expect(challenge).toBe('registration-challenge')
  })

  it('returns object challenges as-is', async () => {
    getdelRedisJsonMock.mockResolvedValueOnce({
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
