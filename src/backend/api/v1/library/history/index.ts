import { Hono } from 'hono'

import { Env } from '@/backend'

import deleteRoute from './DELETE'
import getRoute from './GET'

const route = new Hono<Env>()

route.route('/', getRoute)
route.route('/', deleteRoute)

export type { DELETEV1ReadingHistoryBody, DELETEV1ReadingHistoryResponse } from './DELETE'
export type { GETV1ReadingHistoryResponse, ReadingHistoryItem } from './GET'

export default route
