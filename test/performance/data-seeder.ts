import bcrypt from 'bcryptjs'
import { type InferInsertModel } from 'drizzle-orm'
import { type PgTable } from 'drizzle-orm/pg-core'
import { drizzle } from 'drizzle-orm/postgres-js'

import { bookmarkTable } from '@/database/supabase/activity'
import { libraryItemTable, libraryTable } from '@/database/supabase/library'
import { userTable } from '@/database/supabase/user'

export interface SeedOptions {
  batchSize: number
  bookmarksPerUser: number
  itemsPerLibrary: number
  librariesPerUser: number
  userCount: number
}

export class PerformanceDataSeeder {
  private db

  constructor(db: ReturnType<typeof drizzle>) {
    this.db = db
  }

  /**
   * 전체 테이블에 합계 1천만 건 이상 데이터를 채운다.
   */
  async seedAll(opts: SeedOptions): Promise<void> {
    const startTime = Date.now()

    console.log('\n=== Starting Performance Data Seeding ===')
    console.log(
      `- User: ${opts.userCount}`,
      `\n- Library: ${opts.userCount * opts.librariesPerUser}`,
      `\n- Library item: ${opts.userCount * opts.librariesPerUser * opts.itemsPerLibrary}`,
      `\n- Bookmark: ${opts.userCount * opts.bookmarksPerUser}`,
    )

    await this.seedUsers(opts)
    await this.seedLibraries(opts)
    await this.seedLibraryItems(opts)
    await this.seedBookmarks(opts)

    const duration = (Date.now() - startTime) / 1000
    console.log(`✅ Seeding completed in ${duration.toFixed(2)} seconds\n`)
  }

  /**
   * 진행 상황을 출력하면서 북마크 데이터를 채운다.
   */
  async seedBookmarks(opts: SeedOptions): Promise<void> {
    const totalBookmarks = opts.userCount * opts.bookmarksPerUser

    let bookmarksInserted = 0
    const batchData = []

    for (let userId = 1; userId <= opts.userCount; userId++) {
      const bookmarks = this.generateBookmarkBatch(userId, opts.bookmarksPerUser)
      batchData.push(...bookmarks)

      // 배치가 가득 차면 바로 넣는다.
      if (batchData.length >= opts.batchSize) {
        await this.bulkInsert(bookmarkTable, batchData)
        bookmarksInserted += batchData.length
        batchData.length = 0

        if (bookmarksInserted % (opts.batchSize * opts.bookmarksPerUser) === 0) {
          console.log(`  Inserted ${bookmarksInserted} / ${totalBookmarks} bookmarks`)
        }
      }
    }

    // 마지막에 남은 데이터도 넣는다.
    if (batchData.length > 0) {
      await this.bulkInsert(bookmarkTable, batchData)
      bookmarksInserted += batchData.length
    }

    console.log(`✓ Seeded ${bookmarksInserted} bookmarks`)
  }

  /**
   * 진행 상황을 출력하면서 라이브러리 데이터를 채운다.
   */
  async seedLibraries(opts: SeedOptions): Promise<void> {
    const totalLibraries = opts.userCount * opts.librariesPerUser

    let libraryId = 1
    let librariesInserted = 0
    const batchData = []

    for (let userId = 1; userId <= opts.userCount; userId++) {
      const libraries = this.generateLibraryBatch(libraryId, opts.librariesPerUser, userId)
      batchData.push(...libraries)
      libraryId += opts.librariesPerUser

      // 배치가 가득 차면 바로 넣는다.
      if (batchData.length >= opts.batchSize) {
        await this.bulkInsert(libraryTable, batchData)
        librariesInserted += batchData.length
        batchData.length = 0

        if (librariesInserted % (opts.batchSize * opts.librariesPerUser) === 0) {
          console.log(`  Inserted ${librariesInserted} / ${totalLibraries} libraries`)
        }
      }
    }

    // 마지막에 남은 데이터도 넣는다.
    if (batchData.length > 0) {
      await this.bulkInsert(libraryTable, batchData)
    }

    console.log(`✓ Seeded ${totalLibraries} libraries`)
  }

  /**
   * 진행 상황을 출력하면서 라이브러리 아이템 데이터를 채운다.
   */
  async seedLibraryItems(opts: SeedOptions): Promise<void> {
    const totalLibraries = opts.userCount * opts.librariesPerUser
    const totalItems = totalLibraries * opts.itemsPerLibrary

    let itemsInserted = 0
    const batchData = []

    for (let libraryId = 1; libraryId <= totalLibraries; libraryId++) {
      const items = this.generateLibraryItemBatch(libraryId, opts.itemsPerLibrary)
      batchData.push(...items)

      // 배치가 가득 차면 바로 넣는다.
      if (batchData.length >= opts.batchSize) {
        await this.bulkInsert(libraryItemTable, batchData)
        itemsInserted += batchData.length
        batchData.length = 0

        if (itemsInserted % (opts.batchSize * opts.librariesPerUser * opts.itemsPerLibrary) === 0) {
          console.log(`  Inserted ${itemsInserted} / ${totalItems} library items`)
        }
      }
    }

    // 마지막에 남은 데이터도 넣는다.
    if (batchData.length > 0) {
      await this.bulkInsert(libraryItemTable, batchData)
      itemsInserted += batchData.length
    }

    console.log(`✓ Seeded ${itemsInserted} library items`)
  }

  /**
   * 진행 상황을 출력하면서 사용자 데이터를 채운다.
   */
  async seedUsers(opts: SeedOptions): Promise<void> {
    const totalBatches = Math.ceil(opts.userCount / opts.batchSize)

    for (let batch = 0; batch < totalBatches; batch++) {
      const startId = batch * opts.batchSize + 1
      const count = Math.min(opts.batchSize, opts.userCount - batch * opts.batchSize)
      const users = this.generateUserBatch(startId, count)
      await this.bulkInsert(userTable, users)
      console.log(`  Inserted ${(batch + 1) * opts.batchSize} / ${opts.userCount} users`)
    }

    console.log(`✓ Seeded ${opts.userCount} users`)
  }

  /**
   * 최대 성능을 위해 배치 단위로 bulk insert를 수행한다.
   * PostgreSQL의 65534 파라미터 제한을 피하려고 청크로 나눈다.
   */
  private async bulkInsert<T extends PgTable>(table: T, data: InferInsertModel<T>[]): Promise<void> {
    if (data.length === 0) {
      return
    }

    const columns = Object.keys(data[0])

    // PostgreSQL은 파라미터를 65534개까지만 허용한다.
    const maxParamsPerQuery = 65000
    const chunkSize = Math.floor(maxParamsPerQuery / columns.length)

    try {
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize)
        await this.db.insert(table).values(chunk)
      }
    } catch (error) {
      console.error(`Error bulk inserting into table:`, error)
      throw error
    }
  }

  /**
   * 북마크 배치를 만든다.
   */
  private generateBookmarkBatch(userId: number, count: number) {
    const bookmarks = []
    const baseTime = new Date('2024-01-01')
    const usedMangaIds = new Set<number>()

    for (let i = 0; i < count; i++) {
      let mangaId: number
      do {
        mangaId = Math.floor(Math.random() * 500000) + 1
      } while (usedMangaIds.has(mangaId))
      usedMangaIds.add(mangaId)

      bookmarks.push({
        userId: userId,
        mangaId: mangaId,
        createdAt: new Date(baseTime.getTime() + userId * 1000 + i),
      })
    }

    return bookmarks
  }

  /**
   * 라이브러리 배치를 만든다.
   */
  private generateLibraryBatch(startId: number, count: number, userId: number) {
    const libraries = []
    const baseTime = new Date('2024-01-01')
    const colors = [null, 1, 2, 3, 4, 5]
    const icons = [null, '📚', '🎯', '⭐', '💾', '🔥']

    for (let i = 0; i < count; i++) {
      const id = startId + i
      libraries.push({
        id,
        userId: userId,
        createdAt: new Date(baseTime.getTime() + id * 1000),
        name: `Library ${id} for User ${userId}`,
        description: id % 3 === 0 ? `Description for library ${id}` : null,
        color: colors[id % colors.length],
        icon: icons[id % icons.length],
        isPublic: id % 2 === 0,
      })
    }

    return libraries
  }

  /**
   * 라이브러리 아이템 배치를 만든다.
   */
  private generateLibraryItemBatch(libraryId: number, count: number) {
    const items = []
    const baseTime = new Date('2024-01-01')
    const usedMangaIds = new Set<number>()

    for (let i = 0; i < count; i++) {
      let mangaId: number
      do {
        mangaId = Math.floor(Math.random() * 500000) + 1 // 1~500000 범위에서 임의 작품 ID를 만든다.
      } while (usedMangaIds.has(mangaId))
      usedMangaIds.add(mangaId)

      items.push({
        libraryId: libraryId,
        mangaId: mangaId,
        createdAt: new Date(baseTime.getTime() + libraryId * 1000 + i),
      })
    }

    return items
  }

  /**
   * 사용자 배치를 만든다.
   */
  private generateUserBatch(startId: number, count: number) {
    const users = []
    const baseTime = new Date('2024-01-01')
    const passwordHash = bcrypt.hashSync('password123', 1)

    for (let i = 0; i < count; i++) {
      const id = startId + i
      users.push({
        id,
        createdAt: new Date(baseTime.getTime() + id * 1000),
        loginAt: new Date(baseTime.getTime() + id * 2000),
        logoutAt: null,
        loginId: `user_${id}`,
        name: `username_${id}`,
        passwordHash: passwordHash,
        nickname: `User ${id}`,
        imageURL: null,
        autoDeletionDays: 365,
      })
    }

    return users
  }
}
