'use server'

import { db } from '@/database/drizzle'
import { userTable } from '@/database/schema'
import { setAccessTokenCookie, setRefreshTokenCookie } from '@/utils/cookie'
import { compare } from 'bcrypt'
import { sql } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { z } from 'zod'

const schema = z.object({
  id: z
    .string()
    .min(2, { message: '아이디는 최소 2자 이상이어야 합니다.' })
    .max(32, { message: '아이디는 최대 32자까지 입력할 수 있습니다.' })
    .regex(/^[a-zA-Z][a-zA-Z0-9-._~]+$/, { message: '아이디는 알파벳, 숫자 - . _ ~ 로만 구성해야 합니다.' }),
  password: z
    .string()
    .min(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
    .max(64, { message: '비밀번호는 최대 64자까지 입력할 수 있습니다.' })
    .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, { message: '비밀번호는 알파벳과 숫자를 하나 이상 포함해야 합니다.' }),
})

export default async function login(_prevState: unknown, formData: FormData) {
  const validatedFields = schema.safeParse({
    id: formData.get('id'),
    password: formData.get('password'),
  })

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
      formData,
    }
  }

  const { id: loginId, password } = validatedFields.data

  const [result] = await db
    .select({
      id: userTable.id,
      passwordHash: userTable.passwordHash,
    })
    .from(userTable)
    .where(sql`${userTable.loginId} = ${loginId}`)

  if (!result) {
    return {
      error: { id: ['아이디 또는 비밀번호가 일치하지 않습니다.'] },
      formData,
    }
  }

  const { id: userId, passwordHash } = result
  const isCorrectPassword = await compare(password, passwordHash)

  if (!isCorrectPassword) {
    return {
      error: { id: ['아이디 또는 비밀번호가 일치하지 않습니다.'] },
      formData,
    }
  }

  db.update(userTable)
    .set({ loginAt: new Date() })
    .where(sql`${userTable.id} = ${userId}`)

  const cookieStore = await cookies()
  setAccessTokenCookie(cookieStore, userId)
  setRefreshTokenCookie(cookieStore, userId)

  return { success: true }
}
