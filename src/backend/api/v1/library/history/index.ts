import { Hono } from 'hono'
import 'server-only'

import { Env } from '@/backend'

import getHistoryRoute from './GET'
import importHistoryRoute from './import'

const route = new Hono<Env>()

route.route('/', getHistoryRoute)
route.route('/import', importHistoryRoute)

export type { GETV1ReadingHistoryResponse, ReadingHistoryItem } from './GET'
export type { POSTV1LibraryHistoryImportBody } from './import'

export default route
