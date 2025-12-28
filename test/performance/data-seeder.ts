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
   * Seed all tables with 10M+ rows total
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
   * Seed bookmarks with progress tracking
   */
  async seedBookmarks(opts: SeedOptions): Promise<void> {
    const totalBookmarks = opts.userCount * opts.bookmarksPerUser

    let bookmarksInserted = 0
    const batchData = []

    for (let userId = 1; userId <= opts.userCount; userId++) {
      const bookmarks = this.generateBookmarkBatch(userId, opts.bookmarksPerUser)
      batchData.push(...bookmarks)

      // Insert when batch is full
      if (batchData.length >= opts.batchSize) {
        await this.bulkInsert(bookmarkTable, batchData)
        bookmarksInserted += batchData.length
        batchData.length = 0

        if (bookmarksInserted % (opts.batchSize * opts.bookmarksPerUser) === 0) {
          console.log(`  Inserted ${bookmarksInserted} / ${totalBookmarks} bookmarks`)
        }
      }
    }

    // Insert remaining data
    if (batchData.length > 0) {
      await this.bulkInsert(bookmarkTable, batchData)
      bookmarksInserted += batchData.length
    }

    console.log(`✓ Seeded ${bookmarksInserted} bookmarks`)
  }

  /**
   * Seed libraries with progress tracking
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

      // Insert when batch is full
      if (batchData.length >= opts.batchSize) {
        await this.bulkInsert(libraryTable, batchData)
        librariesInserted += batchData.length
        batchData.length = 0

        if (librariesInserted % (opts.batchSize * opts.librariesPerUser) === 0) {
          console.log(`  Inserted ${librariesInserted} / ${totalLibraries} libraries`)
        }
      }
    }

    // Insert remaining data
    if (batchData.length > 0) {
      await this.bulkInsert(libraryTable, batchData)
    }

    console.log(`✓ Seeded ${totalLibraries} libraries`)
  }

  /**
   * Seed library items with progress tracking
   */
  async seedLibraryItems(opts: SeedOptions): Promise<void> {
    const totalLibraries = opts.userCount * opts.librariesPerUser
    const totalItems = totalLibraries * opts.itemsPerLibrary

    let itemsInserted = 0
    const batchData = []

    for (let libraryId = 1; libraryId <= totalLibraries; libraryId++) {
      const items = this.generateLibraryItemBatch(libraryId, opts.itemsPerLibrary)
      batchData.push(...items)

      // Insert when batch is full
      if (batchData.length >= opts.batchSize) {
        await this.bulkInsert(libraryItemTable, batchData)
        itemsInserted += batchData.length
        batchData.length = 0

        if (itemsInserted % (opts.batchSize * opts.librariesPerUser * opts.itemsPerLibrary) === 0) {
          console.log(`  Inserted ${itemsInserted} / ${totalItems} library items`)
        }
      }
    }

    // Insert remaining data
    if (batchData.length > 0) {
      await this.bulkInsert(libraryItemTable, batchData)
      itemsInserted += batchData.length
    }

    console.log(`✓ Seeded ${itemsInserted} library items`)
  }

  /**
   * Seed users with progress tracking
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
   * Bulk insert using batch inserts for maximum performance
   * Splits into chunks to avoid PostgreSQL's 65534 parameter limit
   */
  private async bulkInsert<T extends PgTable>(table: T, data: InferInsertModel<T>[]): Promise<void> {
    if (data.length === 0) {
      return
    }

    const columns = Object.keys(data[0])

    // PostgreSQL has a limit of 65534 parameters
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
   * Generate a batch of bookmarks
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
   * Generate a batch of library data
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
   * Generate a batch of library items
   */
  private generateLibraryItemBatch(libraryId: number, count: number) {
    const items = []
    const baseTime = new Date('2024-01-01')
    const usedMangaIds = new Set<number>()

    for (let i = 0; i < count; i++) {
      let mangaId: number
      do {
        mangaId = Math.floor(Math.random() * 500000) + 1 // Random manga IDs 1-500000
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
   * Generate a batch of user data
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
