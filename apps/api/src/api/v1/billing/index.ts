import { Hono } from 'hono'

import type { Env } from '@/app'

import postRoute from './POST'
import paymentMethodDeleteRoute from './payment-methods/[id]/DELETE'
import paymentMethodsGetRoute from './payment-methods/GET'
import paymentMethodsPostRoute from './payment-methods/POST'
import webhookRoute from './webhook'

const billingRoutes = new Hono<Env>()

billingRoutes.route('/', postRoute)
billingRoutes.route('/', webhookRoute)
billingRoutes.route('/payment-methods', paymentMethodsGetRoute)
billingRoutes.route('/payment-methods', paymentMethodsPostRoute)
billingRoutes.route('/payment-methods/:id', paymentMethodDeleteRoute)

export default billingRoutes
