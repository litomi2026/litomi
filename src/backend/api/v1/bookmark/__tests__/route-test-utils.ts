import { Hono } from 'hono'
import { contextStorage } from 'hono/context-storage'

import type { Env } from '@/backend'

export type TestEnv = Env & {
  Bindings: {
    isAdult?: boolean
    userId?: number
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createRouteTestApp(route: Hono<any>, mountPath = '/') {
  const app = new Hono<TestEnv>()

  app.use('*', contextStorage())
  app.use('*', async (c, next) => {
    const userId = c.env.userId

    if (typeof userId === 'number') {
      c.set('userId', userId)
      c.set('isAdult', c.env.isAdult ?? true)
    }

    await next()
  })

  app.route(mountPath, route)

  return app
}
