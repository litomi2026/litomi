'use server'

import { z } from 'zod'

const schema = z.object({
  id: z.string({
    invalid_type_error: '아이디가 올바르지 않습니다.',
  }),
  password: z.string({
    invalid_type_error: '비밀번호가 올바르지 않습니다.',
  }),
  'password-confirm': z.string({
    invalid_type_error: '비밀번호가 올바르지 않습니다.',
  }),
  nickname: z.string({
    invalid_type_error: '닉네임이 올바르지 않습니다.',
  }),
})

export default async function createUser(_prevState: unknown, formData: FormData) {
  const validatedFields = schema.safeParse({
    id: formData.get('id'),
    password: formData.get('password'),
    'password-confirm': formData.get('password-confirm'),
    nickname: formData.get('nickname'),
  })

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
      formData,
    }
  }

  return {
    data: {
      accessToken: 'accessToken',
      refreshToken: 'refreshToken',
    },
  }
}
