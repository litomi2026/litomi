import { db } from '@litomi/db/app'
import { chatArtistTable } from '@litomi/db/app/chat'
import { SUBSCRIPTION_TARGET_CHAT_ARTIST } from '@litomi/db/app/query/subscription'
import { subscriptionTable } from '@litomi/db/app/subscription'
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

async function getOrCreateArtistProfile(userId: number, handle: string, displayName: string, emoji: string) {
  let profile = await db.query.chatArtistTable.findFirst({ where: (c, { eq }) => eq(c.userId, userId) })
  if (!profile) {
    const [inserted] = await db
      .insert(chatArtistTable)
      .values({
        userId,
        handle,
        displayName,
        emoji,
        isActive: true,
        // Priced so the subscribe flow is testable (log in as an un-seeded fan).
        priceAmount: 4900,
        priceCurrency: 'KRW',
      })
      .returning()
    profile = inserted
  }
  return profile
}

async function main() {
  console.log('Seeding chat test data (3 Artists, 9 Fans)...')
  const { hash } = await import('bcryptjs')
  const passwordHash = await hash('qwe123123', 10)

  // 1. Create 3 Artists
  const artists = []
  for (let i = 1; i <= 3; i++) {
    const user = await getOrCreateUser(`cre${i}`, `cre${i}`, `Artist ${i}`, passwordHash)
    const profile = await getOrCreateArtistProfile(user.id, `cre${i}`, `Artist ${i}`, ['🔥', '✨', '🌟'][i - 1])
    artists.push(profile)
    console.log(`Created artist: cre${i}`)
  }

  // 2. Create 9 Fans (numbered 4 to 12)
  const fans = []
  for (let i = 4; i <= 12; i++) {
    const user = await getOrCreateUser(`fan${i}`, `fan${i}`, `Fan ${i}`, passwordHash)
    fans.push(user)
    console.log(`Created fan: fan${i}`)
  }

  // 3. Subscriptions: specific fans to specific artists
  // cre1 (artists[0]) -> fan4, fan5, fan6 (fans[0,1,2])
  // cre2 (artists[1]) -> fan7, fan8, fan9 (fans[3,4,5])
  // cre3 (artists[2]) -> fan10, fan11, fan12 (fans[6,7,8])
  for (let c = 0; c < artists.length; c++) {
    const artist = artists[c]
    const artistFans = fans.slice(c * 3, c * 3 + 3)

    for (const fan of artistFans) {
      const subscription = await db.query.subscriptionTable.findFirst({
        where: (s, { eq, and }) =>
          and(eq(s.userId, fan.id), eq(s.targetType, SUBSCRIPTION_TARGET_CHAT_ARTIST), eq(s.targetId, artist.id)),
      })

      if (!subscription) {
        const expiresAt = new Date()
        expiresAt.setFullYear(expiresAt.getFullYear() + 1)
        await db.insert(subscriptionTable).values({
          userId: fan.id,
          targetType: SUBSCRIPTION_TARGET_CHAT_ARTIST,
          targetId: artist.id,
          priceAmount: 1000,
          priceCurrency: 'KRW',
          status: 'active',
          expiresAt,
          autoRenew: true,
        })
      }
    }
  }

  console.log('✅ Done! 3 Artists, 9 Fans (fan4~fan12), and subscriptions successfully seeded.')
  console.log('You can now log in as any fan (e.g. fan4, fan5, fan6) and visit /sobok/cre1')
  process.exit(0)
}

main().catch(console.error)
