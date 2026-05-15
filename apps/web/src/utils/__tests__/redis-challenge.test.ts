import { describe, it } from 'bun:test'

import { runIsolatedBunTest } from '../../../../../test/utils/run-isolated-bun-test'

describe('redis-challenge', () => {
  it('mocked redis client behavior is isolated from the main test process', async () => {
    await runIsolatedBunTest(new URL('./fixtures/redis-challenge.fixture.ts', import.meta.url))
  })
})
