'use server'

import { CookieKey } from '@/constants/storage'
import { db } from '@/database/drizzle'
import { bookmarkTable, userTable } from '@/database/schema'
import { setAccessTokenCookie, setRefreshTokenCookie } from '@/utils/cookie'
import { TokenType, verifyJWT } from '@/utils/jwt'
import { compare } from 'bcrypt'
import { sql } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { z } from 'zod'

const schema = z.object({
  mangaIds: z.array(z.number()).max(100, '최대 100개까지 등록할 수 있습니다.'),
})

export default async function login(_prevState: unknown, formData: FormData) {
  const validatedFields = schema.safeParse({
    loginId: formData.get('loginId'),
    password: formData.get('password'),
  })

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
      formData,
    }
  }

  const { mangaIds } = validatedFields.data
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(CookieKey.ACCESS_TOKEN)?.value ?? ''
  const { sub: userId } = await verifyJWT(accessToken, TokenType.ACCESS)

  const deleted = db.$with('deleted').as(
    db
      .delete(bookmarkTable)
      .where(sql`${bookmarkTable}`)
      .returning({ mangaId: bookmarkTable.mangaId }),
  )

  // const [result] = await db
  //   .with(deleted)
  //   .insert(bookmarkTable)
  //   .select(
  //     sql`
  //       SELECT id
  //       FROM UNNEST(${sql.array(mangaIds, 'text')}) AS t(id)
  //       WHERE NOT EXISTS (
  //         SELECT 1 FROM deleted d WHERE d.id = t.id
  //       )`,
  //   )
  //   .returning({
  //     mangaId: bookmarkTable.mangaId,
  //   })

  // // const { id: userId, passwordHash } = result
  // const isCorrectPassword = await compare(password, passwordHash)

  // if (!isCorrectPassword) {
  //   return {
  //     error: { loginId: ['아이디 또는 비밀번호가 일치하지 않습니다.'] },
  //     formData,
  //   }
  // }

  // await Promise.all([
  //   setAccessTokenCookie(cookieStore, userId),
  //   setRefreshTokenCookie(cookieStore, userId),
  //   db
  //     .update(userTable)
  //     .set({ loginAt: new Date() })
  //     .where(sql`${userTable.id} = ${userId}`),
  // ])

  // return { success: true }
}
