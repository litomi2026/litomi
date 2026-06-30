// Kafka topic names. Keep them dot-namespaced and stable.
// They are an external contract between producers (api/chat-worker) and consumers.
export const TOPIC_CHAT_MESSAGE = 'chat.message'
// Push fan-out jobs. The chat-worker enqueues here; the chat-push worker expands the
// audience and delivers web push. Decoupled so a huge fan-out never blocks the realtime
// relay (offset commit on chat.message is independent of delivery progress).
export const TOPIC_CHAT_PUSH_FANOUT = 'chat.push.fanout'
