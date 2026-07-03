import { Hono } from 'hono'

import type { Env } from '@/app'
import artistHandleGetRoute from './artist/[handle]/GET'
import messageReadPutRoute from './artist/[handle]/message/[messageId]/read/PUT'
import messageReplyGetRoute from './artist/[handle]/message/[messageId]/reply/GET'
import messageReplyPostRoute from './artist/[handle]/message/[messageId]/reply/POST'
import artistHandleMessageGetRoute from './artist/[handle]/message/GET'
import artistHandleMessagePostRoute from './artist/[handle]/message/POST'
import artistHandlePatchRoute from './artist/[handle]/PATCH'
import artistHandleReadPutRoute from './artist/[handle]/read/PUT'
import subscriptionDeleteRoute from './artist/[handle]/subscription/DELETE'
import subscriptionPostRoute from './artist/[handle]/subscription/POST'
import subscriptionRefundPostRoute from './artist/[handle]/subscription/refund/POST'
import artistPostRoute from './artist/POST'
import studioEarningsGetRoute from './studio/earnings/GET'
import studioGetRoute from './studio/GET'
import studioPayoutAccountPutRoute from './studio/payout-account/PUT'
import threadsGetRoute from './threads/GET'

const chatRoutes = new Hono<Env>()

chatRoutes.route('/threads', threadsGetRoute)
chatRoutes.route('/studio', studioGetRoute)
chatRoutes.route('/studio/earnings', studioEarningsGetRoute)
chatRoutes.route('/studio/payout-account', studioPayoutAccountPutRoute)
chatRoutes.route('/artist', artistPostRoute)
chatRoutes.route('/artist/:handle', artistHandleGetRoute)
chatRoutes.route('/artist/:handle', artistHandlePatchRoute)
chatRoutes.route('/artist/:handle/subscription', subscriptionPostRoute)
chatRoutes.route('/artist/:handle/subscription', subscriptionDeleteRoute)
chatRoutes.route('/artist/:handle/subscription/refund', subscriptionRefundPostRoute)
chatRoutes.route('/artist/:handle/message', artistHandleMessageGetRoute)
chatRoutes.route('/artist/:handle/message', artistHandleMessagePostRoute)
chatRoutes.route('/artist/:handle/read', artistHandleReadPutRoute)
chatRoutes.route('/artist/:handle/message/:messageId/reply', messageReplyGetRoute)
chatRoutes.route('/artist/:handle/message/:messageId/reply', messageReplyPostRoute)
chatRoutes.route('/artist/:handle/message/:messageId/read', messageReadPutRoute)

export default chatRoutes
