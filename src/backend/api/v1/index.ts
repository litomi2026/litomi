import { Env, Hono } from 'hono'

import searchRoutes from './search'

const v1Routes = new Hono<Env>()

// v1Routes.route('/me', meRoutes) // NOTE: 아직 쿠키 인증이 안 돼서 주석 처리
v1Routes.route('/search', searchRoutes)

export default v1Routes
