import { db } from '@litomi/db/app'
import { trustedBrowserTable } from '@litomi/db/app/two-factor'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { problemResponse } from '@/utils/problem'

const route = new Hono<Env>()

route.delete('/', async (c) => {
  const userId = c.get('userId')!

  try {
    await db.delete(trustedBrowserTable).where(eq(trustedBrowserTable.userId, userId))

    return c.body(null, 204)
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500 })
  }
})

export default route
