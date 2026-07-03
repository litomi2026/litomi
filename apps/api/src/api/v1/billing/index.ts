import { Hono } from 'hono'

import type { Env } from '@/app'

import postRoute from './POST'
import paymentMethodDeleteRoute from './payment-methods/[id]/DELETE'
import paymentMethodsGetRoute from './payment-methods/GET'
import paymentMethodsPostRoute from './payment-methods/POST'
import paymentReceiptGetRoute from './payments/[paymentId]/receipt/GET'
import paymentsGetRoute from './payments/GET'
import subscriptionsGetRoute from './subscriptions/GET'
import webhookRoute from './webhook'

const billingRoutes = new Hono<Env>()

billingRoutes.route('/', postRoute)
billingRoutes.route('/', webhookRoute)
billingRoutes.route('/payment-methods', paymentMethodsGetRoute)
billingRoutes.route('/payment-methods', paymentMethodsPostRoute)
billingRoutes.route('/payment-methods/:id', paymentMethodDeleteRoute)
billingRoutes.route('/payments', paymentsGetRoute)
billingRoutes.route('/payments/:paymentId/receipt', paymentReceiptGetRoute)
billingRoutes.route('/subscriptions', subscriptionsGetRoute)

export default billingRoutes
