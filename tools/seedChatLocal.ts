import { db } from '@litomi/db/app'
import { chatCreatorTable, chatSubscriptionTable } from '@litomi/db/app/chat'
import { userTable } from '@litomi/db/app/user'

async function getOrCreateUser(loginId: string, name: string, nickname: string, passwordHash: string) {
  let user = await db.query.userTable.findFirst({ where: (u, { eq }) => eq(u.loginId, loginId) })
  if (!user) {
    const [inserted] = await db
      .insert(userTable)
      .values({
        loginId,
        name,
        nickname,
        passwordHash,
      })
      .returning()
    user = inserted
  }
  return user
}

async function getOrCreateCreatorProfile(userId: number, handle: string, displayName: string, emoji: string) {
  let profile = await db.query.chatCreatorTable.findFirst({ where: (c, { eq }) => eq(c.userId, userId) })
  if (!profile) {
    const [inserted] = await db
      .insert(chatCreatorTable)
      .values({
        userId,
        handle,
        displayName,
        emoji,
        isActive: true,
      })
      .returning()
    profile = inserted
  }
  return profile
}

async function main() {
  console.log('Seeding chat test data (3 Creators, 9 Fans)...')
  const { hash } = await import('bcryptjs')
  const passwordHash = await hash('qwe123123', 10)

  // 1. Create 3 Creators
  const creators = []
  for (let i = 1; i <= 3; i++) {
    const user = await getOrCreateUser(`cre${i}`, `cre${i}`, `Creator ${i}`, passwordHash)
    const profile = await getOrCreateCreatorProfile(user.id, `cre${i}`, `Creator ${i}`, ['🔥', '✨', '🌟'][i - 1])
    creators.push(profile)
    console.log(`Created creator: cre${i}`)
  }

  // 2. Create 9 Fans (numbered 4 to 12)
  const fans = []
  for (let i = 4; i <= 12; i++) {
    const user = await getOrCreateUser(`fan${i}`, `fan${i}`, `Fan ${i}`, passwordHash)
    fans.push(user)
    console.log(`Created fan: fan${i}`)
  }

  // 3. Subscriptions: specific fans to specific creators
  // cre1 (creators[0]) -> fan4, fan5, fan6 (fans[0,1,2])
  // cre2 (creators[1]) -> fan7, fan8, fan9 (fans[3,4,5])
  // cre3 (creators[2]) -> fan10, fan11, fan12 (fans[6,7,8])
  for (let c = 0; c < creators.length; c++) {
    const creator = creators[c]
    const creatorFans = fans.slice(c * 3, c * 3 + 3)

    for (const fan of creatorFans) {
      const subscription = await db.query.chatSubscriptionTable.findFirst({
        where: (s, { eq, and }) => and(eq(s.creatorId, creator.id), eq(s.userId, fan.id)),
      })

      if (!subscription) {
        const expiresAt = new Date()
        expiresAt.setFullYear(expiresAt.getFullYear() + 1)
        await db.insert(chatSubscriptionTable).values({
          creatorId: creator.id,
          userId: fan.id,
          status: 'active',
          startedAt: new Date(),
          expiresAt,
        })
      }
    }
  }

  console.log('✅ Done! 3 Creators, 9 Fans (fan4~fan12), and subscriptions successfully seeded.')
  console.log('You can now log in as any fan (e.g. fan4, fan5, fan6) and visit /sobok/cre1')
  process.exit(0)
}

main().catch(console.error)
