type DBStores = 'archivedMessages' | 'outbox' | 'sessionMap'

const DB_NAME = 'litomi-character-chat'
const DB_VERSION = 2

export type ArchivedChatMessageRecord = {
  id: string
  clientSessionId: string
  clientMessageId: string
  role: 'assistant' | 'user'
  content: string
  createdAtMs: number
  debugThink?: string
}

export type OutboxItem =
  | {
      id: string
      kind: 'appendMessages'
      status: 'failed' | 'pending'
      createdAtMs: number
      attempt: number
      nextAttemptAtMs: number
      lastError?: string
      payload: {
        clientSessionId: string
        messages: {
          clientMessageId: string
          role: 'assistant' | 'user'
          content: string
        }[]
      }
    }
  | {
      id: string
      kind: 'createSession'
      status: 'failed' | 'pending'
      createdAtMs: number
      attempt: number
      nextAttemptAtMs: number
      lastError?: string
      payload: {
        clientSessionId: string
        characterId: string
        characterName?: string
        title?: string
        systemPrompt: string
        modelId: string
      }
    }

export type SessionMapRecord = {
  clientSessionId: string
  serverSessionId: number
  updatedAtMs: number
}

let dbPromise: Promise<IDBDatabase> | null = null

export async function archiveChatMessages(records: ArchivedChatMessageRecord[]) {
  if (records.length === 0) {
    return
  }

  const db = await getDB()
  await runTx<void>(db, 'archivedMessages', 'readwrite', (store) => {
    for (const record of records) {
      store.put(record)
    }
  })
}

export async function deleteOutboxItem(id: string) {
  const db = await getDB()
  await runTx<void>(db, 'outbox', 'readwrite', (store) => {
    store.delete(id)
  })
}

export async function getAllOutboxItems(): Promise<OutboxItem[]> {
  const db = await getDB()
  const tx = db.transaction('outbox', 'readonly')
  const store = tx.objectStore('outbox')
  const items = await requestToPromise(store.getAll())
  return (items as unknown[]).filter(isOutboxItem)
}

export function getDB(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = openDB()
  }
  return dbPromise
}

export async function getSessionMap(clientSessionId: string): Promise<SessionMapRecord | null> {
  const db = await getDB()
  const tx = db.transaction('sessionMap', 'readonly')
  const store = tx.objectStore('sessionMap')
  const row = await requestToPromise(store.get(clientSessionId))
  return isSessionMapRecord(row) ? row : null
}

export async function setSessionMap(record: SessionMapRecord) {
  const db = await getDB()
  await runTx<void>(db, 'sessionMap', 'readwrite', (store) => {
    store.put(record)
  })
}

export async function upsertOutboxItem(item: OutboxItem) {
  const db = await getDB()
  await runTx<void>(db, 'outbox', 'readwrite', (store) => {
    store.put(item)
  })
}

function isOutboxItem(value: unknown): value is OutboxItem {
  if (!value || typeof value !== 'object') return false
  if (!('id' in value) || !('kind' in value) || !('status' in value) || !('createdAtMs' in value)) return false
  return true
}

function isSessionMapRecord(value: unknown): value is SessionMapRecord {
  if (!value || typeof value !== 'object') return false
  if (!('clientSessionId' in value) || !('serverSessionId' in value) || !('updatedAtMs' in value)) return false
  const v = value as { clientSessionId: unknown; serverSessionId: unknown; updatedAtMs: unknown }
  return (
    typeof v.clientSessionId === 'string' && typeof v.serverSessionId === 'number' && typeof v.updatedAtMs === 'number'
  )
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result

      if (!db.objectStoreNames.contains('archivedMessages')) {
        const store = db.createObjectStore('archivedMessages', { keyPath: 'id' })
        store.createIndex('clientSessionId', 'clientSessionId', { unique: false })
      }

      if (!db.objectStoreNames.contains('outbox')) {
        db.createObjectStore('outbox', { keyPath: 'id' })
      }

      if (!db.objectStoreNames.contains('sessionMap')) {
        db.createObjectStore('sessionMap', { keyPath: 'clientSessionId' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'))
  })
}

function requestToPromise<T>(req: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB request failed'))
  })
}

function runTx<T>(db: IDBDatabase, storeName: DBStores, mode: IDBTransactionMode, fn: (store: IDBObjectStore) => void) {
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(storeName, mode)
    const store = tx.objectStore(storeName)
    fn(store)
    tx.oncomplete = () => resolve(undefined as T)
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'))
  })
}
