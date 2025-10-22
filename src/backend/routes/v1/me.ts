import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'

import { getUserId } from '@/backend/utils/auth'

import type { Env } from '../..'

const meRoutes = new Hono<Env>()

meRoutes.get('/', async (c) => {
  const userId = getUserId()

  if (!userId) {
    throw new HTTPException(401)
  }

  return c.json({ id: userId })
})

export default meRoutes
