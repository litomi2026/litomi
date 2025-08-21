# Product Requirements Document: Last Viewed Page Feature

## Overview

### Background

Users currently lose their reading progress when they close a manga and have to manually find where they left off. This creates friction in the reading experience, especially for longer manga series.

### Objective

Implement a seamless reading history feature that automatically saves and restores the last viewed page for each manga, supporting both guest and authenticated users.

## User Stories

1. **As a guest user**, I want my reading progress saved locally so I can resume where I left off on the same device.
2. **As a logged-in user**, I want my reading progress synced across all my devices.
3. **As a returning reader**, I want to be prompted to resume from my last position without disrupting my intent to start fresh.
4. **As a new user signing up**, I want my guest reading history migrated to my account automatically.

## Functional Requirements

### 1. Reading Progress Tracking

#### Guest Users

- Save last viewed page to sessionStorage with key format: `manga_${id}_lastPage`
- No server-side storage or sync
- Progress persists only on the same tab

#### Authenticated Users

- Save progress to database only (no sessionStorage)
- Sync across all devices where user is logged in
- Debounced updates to minimize server calls (5 sec)

### 2. Progress Restoration

#### Trigger Conditions

- Only activate when user is on page 1 (first page)
  - Show toast notification in this case. e.g. "마지막으로 읽던 페이지 43"
- Do not auto-jump if user has explicit page parameter in URL
  - Show modal dialog in this case. e.g. "Resume Reading" with Yes/No options

#### User Experience

- No layout shift or content flash
- Progress check happens asynchronously with initial page render
- Non-blocking implementation to maintain LCP performance

### 3. History Limits

- **Normal users**: Maximum 100 manga history entries
- **Paid users**: Maximum 1,000 manga history entries
- When limit exceeded, remove oldest entries (LRU policy)

### 4. Migration on Authentication

#### On Login/Signup

1. Read all sessionStorage entries matching pattern `manga_*_lastPage`
2. Bulk insert to database via Server Action
3. Clear sessionStorage on successful migration
4. On failure: Keep sessionStorage intact and retry on next login

## Technical Specifications

### Database Schema

```sql
CREATE TABLE reading_history (
  user_id BIGINT REFERENCES user(id) ON DELETE CASCADE,
  manga_id INTEGER NOT NULL,
  last_page INTEGER NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, manga_id)
);

CREATE INDEX idx_reading_history_updated_at ON reading_history(user_id, updated_at DESC);
```

### Implementation Details

#### 1. Client-Side Data Fetching

```tsx
// hooks/useReadingHistory.ts
import { useQuery } from '@tanstack/react-query'
import useMeQuery from '@/query/useMeQuery'

export default function useReadingHistory(mangaId: number) {
  const { data: user } = useMeQuery()

  const { data: lastPage } = useQuery({
    queryKey: ['readingHistory', mangaId],
    queryFn: async () => {
      if (user) {
        // Logged user: fetch from API
        const response = await fetch(`/api/manga/${mangaId}/reading-history`)
        if (response.ok) {
          const data = await response.json()
          return data.lastPage || null
        }
      } else {
        // Guest user: read from localStorage
        const stored = localStorage.getItem(`manga_${mangaId}_lastPage`)
        return stored ? parseInt(stored, 10) : null
      }
      return null
    },
    enabled: Boolean(user),
  })

  return { lastPage }
}
```

#### 2. Client Component with Toast or Modal based on existance of `page` search param

#### 3. Progress Saving Implementation

```tsx
// hooks/useReadingProgress.ts
import { useMemo } from 'react'
import { debounce } from ...
import useActionResponse from '@/hook/useActionResponse'
import useMeQuery from '@/query/useMeQuery'
import { saveReadingProgress } from '@/app/manga/[id]/actions'

export default function useReadingProgress(mangaId: number) {
  const { data: user } = useMeQuery()

  const [_, dispatchAction, isSaving] = useActionResponse({
    action: saveReadingProgress,
    shouldSetResponse: false, // No need to keep response state
  })

  const saveProgress = useMemo(() => {
    if (user) {
      // Logged user: debounced server save
      return debounce((page: number) => {
        dispatchAction(mangaId, page)
      }, 2000)
    } else {
      // Guest: immediate localStorage save
      return debounce((page: number) => {
        localStorage.setItem(`manga_${mangaId}_lastPage`, String(page))
      }, 500)
    }
  }, [user, mangaId, dispatchAction])

  return { saveProgress, isSaving }
}
```

#### 4. Server Action for Saving

```tsx
// app/manga/[id]/actions.ts
'use server'

export async function saveReadingProgress(mangaId: number, page: number) {
  const userId = await getUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요')
  }

  await db
    .insert(readingHistoryTable)
    .values({
      userId,
      mangaId,
      lastPage: page,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [readingHistoryTable.userId, readingHistoryTable.mangaId],
      set: {
        lastPage: page,
        updatedAt: new Date(),
      },
    })

  return ok(true)
}
```

#### 5. Migration on Authentication

```tsx
'use server'

import { sql } from 'drizzle-orm'
import { db } from '@/database/drizzle'
import { readingHistoryTable } from '@/database/schema'
import { ok, internalServerError } from '@/utils/action-response'

const readingHistoryItemSchema = z.object({
  mangaId: z.number().int().positive(),
  lastPage: z.number().int().positive(),
  updatedAt: z.iso.datetime(),
})

const migrateReadingHistorySchema = z.object({
  localHistory: z.array(readingHistoryItemSchema).min(1).max(100),
})

type ReadingHistoryItem = {
  mangaId: number
  lastPage: number
}

export async function migrateReadingHistory(userId: number, localHistory: ReadingHistoryItem[]) {
  const userId = await getUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요')
  }

  const validation = migrateReadingHistorySchema.safeParse({
    userId,
    localHistory,
  })

  if (!validation.success) {
    return badRequest(flattenZodFieldErrors(validation.error))
  }

  const { localHistory: validHistory } = validation.data

  try {
    const result = await db
      .insert(readingHistoryTable)
      .values(values)
      .onConflictDoNothing()
      .returning({ mangaId: readingHistoryTable.mangaId })

    await enforceHistoryLimit(userId)

    return ok(result.length)
  } catch (error) {
    return internalServerError('읽기 기록 동기화 중 오류가 발생했어요')
  }
}
```

## Implementation Timeline

1. **Phase 1**: Guest user support with sessionStorage (1 day)
2. **Phase 2**: Database schema and server actions (1 day)
3. **Phase 3**: Logged user sync and streaming (2 days)
4. **Phase 4**: Migration logic and testing (1 day)

## Success Metrics

- Reading continuation rate increase by 30%
- Zero CLS (Cumulative Layout Shift) impact
- Server sync latency < 100ms p95
- Migration success rate > 99%

## Error Handling

- **Save failures**: Silent fail with console warning, no user disruption
- **Migration failures**: Retain sessionStorage, retry on next login
- **Sync conflicts**: Server data wins strategy
- **API errors**: Graceful degradation to sessionStorage

## Future Enhancements

- Reading statistics dashboard or "최근 본 작품" library
- Reading time tracking with the Amplitude
