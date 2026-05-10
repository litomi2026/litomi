export const WHEEL_EVENT_HANDLED = 'handled'
export const WHEEL_EVENT_IGNORED = 'ignored'

export type WheelHandlerResult = typeof WHEEL_EVENT_HANDLED | typeof WHEEL_EVENT_IGNORED
