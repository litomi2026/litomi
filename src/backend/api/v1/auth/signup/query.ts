import { db } from '@/database/supabase/drizzle'
import { userTable } from '@/database/supabase/user'

type CreateUserInput = {
  imageURL: string
  loginId: string
  nickname: string
  passwordHash: string
}

export async function createUser({ imageURL, loginId, nickname, passwordHash }: CreateUserInput) {
  const [user] = await db
    .insert(userTable)
    .values({
      loginId,
      name: loginId,
      passwordHash,
      nickname,
      imageURL,
    })
    .onConflictDoNothing()
    .returning({ id: userTable.id })

  return user ?? null
}
