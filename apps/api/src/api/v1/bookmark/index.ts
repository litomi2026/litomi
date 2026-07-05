import { Hono } from 'hono'

import type { Env } from '@/app'

import idDeleteRoute from './[id]/DELETE'
import idPutRoute from './[id]/PUT'
import deleteRoute from './DELETE'
import exportGetRoute from './export/GET'
import getRoute from './GET'
import idGetRoute from './id/GET'
import importPostRoute from './import/POST'
import postRoute from './POST'

const bookmarkRoutes = new Hono<Env>()

bookmarkRoutes.route('/', getRoute)
bookmarkRoutes.route('/', deleteRoute)
bookmarkRoutes.route('/', postRoute)
bookmarkRoutes.route('/id', idGetRoute)
bookmarkRoutes.route('/export', exportGetRoute)
bookmarkRoutes.route('/import', importPostRoute)
bookmarkRoutes.route('/:id', idPutRoute)
bookmarkRoutes.route('/:id', idDeleteRoute)

export default bookmarkRoutes
