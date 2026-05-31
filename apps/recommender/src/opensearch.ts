import type { CatalogMangaRecord } from '@litomi/db/query/catalog-manga'

import { catalogDB } from '@litomi/db/catalog'
import { mangaTable } from '@litomi/db/catalog/schema'
import { CensorshipKey } from '@litomi/domain/censorship/model'
import { MANGA_TYPE_VALUE_BY_ID, TagCategory } from '@litomi/domain/manga/model'
import { env } from '@litomi/env/server.common'
import { asc, gt } from 'drizzle-orm'

import type { CensorshipRule } from './censorship'
import type { FeaturePosteriorCatalogHint, FeaturePosteriorCatalogHints } from './feature-posterior'

const CENSORSHIP_KEY_BY_TAG_CATEGORY: Record<TagCategory, CensorshipKey> = {
  [TagCategory.FEMALE]: CensorshipKey.TAG_CATEGORY_FEMALE,
  [TagCategory.MALE]: CensorshipKey.TAG_CATEGORY_MALE,
  [TagCategory.MIXED]: CensorshipKey.TAG_CATEGORY_MIXED,
  [TagCategory.OTHER]: CensorshipKey.TAG_CATEGORY_OTHER,
}

const INDEX_MANAGEMENT_REQUEST_TIMEOUT_MS = 30_000
const VERSIONED_MANGA_INDEX_RETAIN_COUNT = 2
const SEARCH_REQUEST_TIMEOUT_MS = 5_000
const SYNC_BULK_REQUEST_TIMEOUT_MS = 60_000

const catalogMangaColumns = {
  id: mangaTable.id,
  title: mangaTable.title,
  description: mangaTable.description,
  lines: mangaTable.lines,
  type: mangaTable.type,
  count: mangaTable.count,
  createdAt: mangaTable.createdAt,
  artists: mangaTable.artists,
  characters: mangaTable.characters,
  series: mangaTable.series,
  groups: mangaTable.groups,
  languages: mangaTable.languages,
  uploader: mangaTable.uploader,
  tagValues: mangaTable.tagValues,
  tagCategories: mangaTable.tagCategories,
}

type OpenSearchBulkResponse = {
  errors: boolean
  items?: Array<Record<string, { error?: unknown; status: number }>>
}

type OpenSearchSearchResponse = {
  hits: {
    hits: Array<{
      _id: string
    }>
  }
}

type SyncMangaSearchIndexOptions = {
  batchSize?: number
}

class OpenSearchRequestError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(`OpenSearch request failed with status ${status}: ${message}`)
  }
}

export async function searchMangaIdsByFeaturePosterior({
  censorshipRules,
  excludedMangaIds,
  hints,
  limit,
}: {
  censorshipRules: readonly CensorshipRule[]
  excludedMangaIds: readonly number[]
  hints: FeaturePosteriorCatalogHints
  limit: number
}) {
  const should = createFeatureHintShouldClauses(hints)

  if (should.length === 0) {
    return []
  }

  const mustNot: unknown[] = []
  const censorshipKeys = censorshipRules.map((rule) => toCensorshipLookupKey(rule.key, rule.value))

  if (censorshipKeys.length > 0) {
    mustNot.push({ terms: { censorshipKeys } })
  }

  if (excludedMangaIds.length > 0) {
    mustNot.push({ terms: { id: excludedMangaIds } })
  }

  const response = await openSearchRequest<OpenSearchSearchResponse>({
    body: {
      _source: false,
      query: {
        bool: {
          minimum_should_match: 1,
          must_not: mustNot,
          should,
        },
      },
      size: limit,
      sort: [{ _score: 'desc' }, { id: 'desc' }],
      track_total_hits: false,
    },
    method: 'POST',
    path: `/${encodeURIComponent(env.OPENSEARCH_MANGA_INDEX_ALIAS)}/_search`,
    timeoutMs: SEARCH_REQUEST_TIMEOUT_MS,
  })

  return response.hits.hits.map((hit) => Number(hit._id)).filter(Number.isSafeInteger)
}

export async function syncMangaSearchIndex({ batchSize = 1_000 }: SyncMangaSearchIndexOptions = {}) {
  const indexName = createVersionedIndexName(env.OPENSEARCH_MANGA_INDEX_ALIAS)
  let afterId = 0
  let total = 0

  await createMangaSearchIndex(indexName)

  while (true) {
    const records = await selectCatalogMangaRecordsForSearchIndexSync({ afterId, limit: batchSize })

    if (records.length === 0) {
      break
    }

    await bulkIndexMangaRecords(indexName, records)

    afterId = records[records.length - 1]!.id
    total += records.length
    console.info(`indexed ${total} manga records into ${indexName}`)
  }

  await refreshIndex(indexName)
  await pointAliasToIndex(env.OPENSEARCH_MANGA_INDEX_ALIAS, indexName)
  await deleteStaleVersionedIndices(env.OPENSEARCH_MANGA_INDEX_ALIAS)

  return {
    indexName,
    total,
  }
}

function addCensorshipKeys(keys: string[], key: CensorshipKey, values: readonly string[]) {
  for (const value of values) {
    keys.push(toCensorshipLookupKey(key, value))
  }
}

async function bulkIndexMangaRecords(indexName: string, records: readonly CatalogMangaRecord[]) {
  if (records.length === 0) {
    return
  }

  const body =
    records
      .flatMap((record) => [
        JSON.stringify({ index: { _id: record.id, _index: indexName } }),
        JSON.stringify(createMangaSearchDocument(record)),
      ])
      .join('\n') + '\n'

  const response = await openSearchRequest<OpenSearchBulkResponse>({
    body,
    contentType: 'application/x-ndjson',
    method: 'POST',
    path: '/_bulk',
    timeoutMs: SYNC_BULK_REQUEST_TIMEOUT_MS,
  })

  if (!response.errors) {
    return
  }

  const failedItems = response.items
    ?.flatMap((item) => Object.values(item))
    .filter((item) => item.status >= 400)
    .slice(0, 5)

  throw new Error(`OpenSearch bulk index failed: ${JSON.stringify(failedItems)}`)
}

function createFeatureHintScoreClauses(
  field: string,
  hints: readonly FeaturePosteriorCatalogHint[],
  fieldBoost: number,
) {
  return hints.map((hint) => createTermScoreClause(field, hint.value, hint.boost * fieldBoost))
}

function createFeatureHintShouldClauses(hints: FeaturePosteriorCatalogHints) {
  const clauses: unknown[] = []

  clauses.push(...createFeatureHintScoreClauses('artists', hints.artists, 3))
  clauses.push(...createFeatureHintScoreClauses('characters', hints.characters, 2.2))
  clauses.push(...createFeatureHintScoreClauses('series', hints.series, 2.5))
  clauses.push(...createFeatureHintScoreClauses('tagValues', hints.tagValues, 1))

  return clauses
}

function createMangaIndexBody() {
  return {
    mappings: {
      dynamic: false,
      properties: {
        artists: { type: 'keyword' },
        censorshipKeys: { type: 'keyword' },
        characters: { type: 'keyword' },
        count: { type: 'integer' },
        createdAt: { type: 'date' },
        groups: { type: 'keyword' },
        id: { type: 'integer' },
        languages: { type: 'keyword' },
        series: { type: 'keyword' },
        tagCategories: { type: 'short' },
        tagValues: { type: 'keyword' },
        title: {
          fields: {
            keyword: {
              ignore_above: 512,
              type: 'keyword',
            },
          },
          type: 'text',
        },
        type: { type: 'short' },
        uploader: { type: 'keyword' },
      },
    },
    settings: {
      index: {
        number_of_replicas: env.OPENSEARCH_MANGA_INDEX_REPLICAS,
        number_of_shards: env.OPENSEARCH_MANGA_INDEX_SHARDS,
        refresh_interval: '30s',
      },
    },
  }
}

function createMangaSearchDocument(record: CatalogMangaRecord) {
  return {
    artists: record.artists,
    censorshipKeys: getMangaCensorshipKeys(record),
    characters: record.characters,
    count: record.count,
    createdAt: record.createdAt?.toISOString() ?? null,
    groups: record.groups,
    id: record.id,
    languages: record.languages,
    series: record.series,
    tagCategories: record.tagCategories,
    tagValues: record.tagValues,
    title: record.title,
    type: record.type,
    uploader: record.uploader,
  }
}

async function createMangaSearchIndex(indexName: string) {
  await openSearchRequest({
    body: createMangaIndexBody(),
    method: 'PUT',
    path: `/${encodeURIComponent(indexName)}`,
    timeoutMs: INDEX_MANAGEMENT_REQUEST_TIMEOUT_MS,
  })
}

function createTermScoreClause(field: string, value: string, boost: number) {
  return {
    constant_score: {
      boost: roundBoost(boost),
      filter: {
        term: {
          [field]: value,
        },
      },
    },
  }
}

function createVersionedIndexName(alias: string) {
  const timestamp = new Date().toISOString().replace(/\D/g, '').slice(0, 17)
  return `${alias}-${timestamp}`
}

async function deleteIndex(indexName: string) {
  await openSearchRequest({
    method: 'DELETE',
    path: `/${encodeURIComponent(indexName)}`,
    timeoutMs: INDEX_MANAGEMENT_REQUEST_TIMEOUT_MS,
  })
}

async function deleteStaleVersionedIndices(alias: string) {
  const indexNames = await getVersionedIndexNames(alias)
  const retained = new Set(indexNames.slice(0, VERSIONED_MANGA_INDEX_RETAIN_COUNT))
  const staleIndexNames = indexNames.filter((indexName) => !retained.has(indexName))

  for (const staleIndexName of staleIndexNames) {
    await deleteIndex(staleIndexName)
    console.info(`deleted stale OpenSearch index ${staleIndexName}`)
  }
}

async function getAliasIndexNames(alias: string) {
  try {
    const response = await openSearchRequest<Record<string, unknown>>({
      method: 'GET',
      path: `/_alias/${encodeURIComponent(alias)}`,
      timeoutMs: INDEX_MANAGEMENT_REQUEST_TIMEOUT_MS,
    })

    return Object.keys(response)
  } catch (error) {
    if (error instanceof OpenSearchRequestError && error.status === 404) {
      return []
    }

    throw error
  }
}

function getMangaCensorshipKeys(record: CatalogMangaRecord) {
  const keys: string[] = []

  addCensorshipKeys(keys, CensorshipKey.ARTIST, record.artists)
  addCensorshipKeys(keys, CensorshipKey.CHARACTER, record.characters)
  addCensorshipKeys(keys, CensorshipKey.GROUP, record.groups)
  addCensorshipKeys(keys, CensorshipKey.LANGUAGE, record.languages)
  addCensorshipKeys(keys, CensorshipKey.SERIES, record.series)
  addCensorshipKeys(keys, CensorshipKey.TAG, record.tagValues)

  if (record.uploader) {
    keys.push(toCensorshipLookupKey(CensorshipKey.UPLOADER, record.uploader))
  }

  const typeValue = MANGA_TYPE_VALUE_BY_ID[record.type]

  if (typeValue) {
    keys.push(toCensorshipLookupKey(CensorshipKey.TYPE, typeValue))
  }

  for (let index = 0; index < record.tagValues.length; index++) {
    const tagValue = record.tagValues[index]
    const tagCategory = record.tagCategories[index] ?? TagCategory.OTHER
    const categoryKey = CENSORSHIP_KEY_BY_TAG_CATEGORY[tagCategory as TagCategory]

    if (categoryKey) {
      keys.push(toCensorshipLookupKey(categoryKey, tagValue))
    }
  }

  return Array.from(new Set(keys))
}

async function getVersionedIndexNames(alias: string) {
  try {
    const response = await openSearchRequest<Record<string, unknown>>({
      method: 'GET',
      path: `/${encodeURIComponent(alias)}-*`,
      timeoutMs: INDEX_MANAGEMENT_REQUEST_TIMEOUT_MS,
    })

    return Object.keys(response).sort().reverse()
  } catch (error) {
    if (error instanceof OpenSearchRequestError && error.status === 404) {
      return []
    }

    throw error
  }
}

async function openSearchRequest<T = unknown>({
  body,
  contentType = 'application/json',
  method,
  path,
  timeoutMs,
}: {
  body?: object | string
  contentType?: string
  method: string
  path: string
  timeoutMs: number
}): Promise<T> {
  const url = new URL(path, env.OPENSEARCH_URL)
  const headers = new Headers()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  let requestBody: BodyInit | undefined

  if (body !== undefined) {
    headers.set('content-type', contentType)
    requestBody = typeof body === 'string' ? body : JSON.stringify(body)
  }

  if (Boolean(env.OPENSEARCH_USERNAME) !== Boolean(env.OPENSEARCH_PASSWORD)) {
    throw new Error('OPENSEARCH_USERNAME and OPENSEARCH_PASSWORD must be configured together')
  }

  if (env.OPENSEARCH_USERNAME && env.OPENSEARCH_PASSWORD) {
    headers.set(
      'authorization',
      `Basic ${Buffer.from(`${env.OPENSEARCH_USERNAME}:${env.OPENSEARCH_PASSWORD}`).toString('base64')}`,
    )
  }

  try {
    const response = await fetch(url, {
      body: requestBody,
      headers,
      method,
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new OpenSearchRequestError(response.status, await response.text())
    }

    if (response.status === 204) {
      return undefined as T
    }

    return (await response.json()) as T
  } finally {
    clearTimeout(timeout)
  }
}

async function pointAliasToIndex(alias: string, indexName: string) {
  const oldIndexNames = await getAliasIndexNames(alias)

  await openSearchRequest({
    body: {
      actions: [
        ...oldIndexNames.map((oldIndexName) => ({ remove: { alias, index: oldIndexName } })),
        { add: { alias, index: indexName } },
      ],
    },
    method: 'POST',
    path: '/_aliases',
    timeoutMs: INDEX_MANAGEMENT_REQUEST_TIMEOUT_MS,
  })
}

async function refreshIndex(indexName: string) {
  await openSearchRequest({
    method: 'POST',
    path: `/${encodeURIComponent(indexName)}/_refresh`,
    timeoutMs: INDEX_MANAGEMENT_REQUEST_TIMEOUT_MS,
  })
}

function roundBoost(boost: number) {
  return Math.max(0.001, Math.round(boost * 1_000) / 1_000)
}

async function selectCatalogMangaRecordsForSearchIndexSync({
  afterId = 0,
  limit,
}: {
  afterId?: number
  limit: number
}): Promise<CatalogMangaRecord[]> {
  return await catalogDB
    .select(catalogMangaColumns)
    .from(mangaTable)
    .where(gt(mangaTable.id, afterId))
    .orderBy(asc(mangaTable.id))
    .limit(limit)
}

function toCensorshipLookupKey(key: CensorshipKey, value: string) {
  return `${key}:${value.trim().toLowerCase()}`
}
