/**
 * Cloud Run (multi-instance)에서 ISR/Incremental Cache를 공유하기 위해 사용해요.
 */

const TAG_PREFIX = 'next:tag:'

function tagKey(tag) {
  return `${TAG_PREFIX}${tag}`
}

async function upstashPipeline(commands) {
  const res = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Upstash pipeline failed: ${res.status} ${res.statusText}${text ? ` - ${text}` : ''}`)
  }

  /** @type {Array<{result: unknown; error?: string}>} */
  const json = await res.json()
  return json
}

module.exports = class UpstashCacheHandler {
  /**
   * @param {string} key
   */
  async get(key) {
    const result = await upstashPipeline([['GET', key]])
    const value = result?.[0]?.result

    if (value == null) {
      return null
    }

    if (typeof value !== 'string') {
      return null
    }

    try {
      return JSON.parse(value)
    } catch {
      return null
    }
  }

  resetRequestCache() {
    // No per-request in-memory cache here.
  }

  /**
   * @param {string} tag
   */
  async revalidateTag(tag) {
    const members = await upstashPipeline([['SMEMBERS', tagKey(tag)]])
    const keys = members?.[0]?.result

    /** @type {string[]} */
    const toDelete = Array.isArray(keys) ? keys.filter((k) => typeof k === 'string') : []

    if (toDelete.length === 0) {
      await upstashPipeline([['DEL', tagKey(tag)]])
      return
    }

    await upstashPipeline([
      ['DEL', ...toDelete],
      ['DEL', tagKey(tag)],
    ])
  }

  /**
   * @param {string} key
   * @param {unknown | null} data
   * @param {{ tags?: string[] }} ctx
   */
  async set(key, data, ctx) {
    if (data == null) {
      await upstashPipeline([['DEL', key]])
      return
    }

    const payload = JSON.stringify(data)
    /** @type {Array<[string, ...any[]]>} */
    const commands = [['SET', key, payload]]
    const tags = Array.isArray(ctx?.tags) ? ctx.tags : []

    for (const t of tags) {
      if (!t) continue
      commands.push(['SADD', tagKey(t), key])
    }

    await upstashPipeline(commands)
  }
}
