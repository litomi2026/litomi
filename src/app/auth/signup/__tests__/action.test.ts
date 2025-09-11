import { beforeEach, describe, expect, mock, test } from 'bun:test'

import signup from '../action'

mock.module('next/headers', () => ({
  headers: mock(() =>
    Promise.resolve({
      get: mock(() => '127.0.0.1'),
    }),
  ),
  cookies: mock(() =>
    Promise.resolve({
      set: mock(() => {}),
    }),
  ),
}))

const mockDbInsert = mock(() => Promise.resolve([{ id: 123 }]))
mock.module('@/database/supabase/drizzle', () => ({
  db: {
    insert: mock(() => ({
      values: mock(() => ({
        onConflictDoNothing: mock(() => ({
          returning: mockDbInsert,
        })),
      })),
    })),
  },
}))

mock.module('@/utils/turnstile', () => ({
  default: class MockTurnstileValidator {
    validate = mock(() => Promise.resolve({ success: true }))
  },
}))

describe('signup action', () => {
  let formData: FormData

  beforeEach(() => {
    formData = new FormData()
    mockDbInsert.mockReset()
    mockDbInsert.mockImplementation(() => Promise.resolve([{ id: 123 }]))
  })

  test('should return validation error for invalid loginId', async () => {
    formData.append('loginId', 'a')
    formData.append('password', 'Password123')
    formData.append('password-confirm', 'Password123')

    const result = await signup(formData)

    expect(result.ok).toBe(false)
    expect('error' in result).toBe(true)

    if (!result.ok && typeof result.error === 'object') {
      expect(result.error.loginId).toBe('아이디는 최소 2자 이상이어야 해요')
    }
  })

  test('should return validation error for invalid password', async () => {
    formData.append('loginId', 'testuser')
    formData.append('password', 'short')
    formData.append('password-confirm', 'short')

    const result = await signup(formData)

    expect(result.ok).toBe(false)
    expect(!result.ok && typeof result.error === 'object' && 'password' in result.error).toBe(true)

    if (!result.ok && typeof result.error === 'object' && 'password' in result.error) {
      expect(result.error.password).toContain('비밀번호는')
    }
  })

  test('should return validation error for password mismatch', async () => {
    formData.append('loginId', 'testuser')
    formData.append('password', 'Password123')
    formData.append('password-confirm', 'Password456')

    const result = await signup(formData)

    expect(result.ok).toBe(false)
    expect(!result.ok && typeof result.error === 'object' && 'password-confirm' in result.error).toBe(true)

    if (!result.ok && typeof result.error === 'object' && 'password-confirm' in result.error) {
      expect(result.error['password-confirm']).toBe('비밀번호와 비밀번호 확인 값이 일치하지 않아요')
    }
  })

  test('should return validation error when loginId equals password', async () => {
    formData.append('loginId', 'testuser123')
    formData.append('password', 'testuser123')
    formData.append('password-confirm', 'testuser123')

    const result = await signup(formData)

    expect(result.ok).toBe(false)
    expect(!result.ok && typeof result.error === 'object' && 'password' in result.error).toBe(true)

    if (!result.ok && typeof result.error === 'object' && 'password' in result.error) {
      expect(result.error.password).toBe('아이디와 비밀번호는 같을 수 없어요')
    }
  })

  test('should return FormErrors.INVALID_INPUT for empty form data', async () => {
    const result = await signup(formData)

    expect(result.ok).toBe(false)

    if (!result.ok) {
      expect(result.error).toHaveProperty('loginId')
      expect(result.error).toHaveProperty('password')
      expect(result.error).toHaveProperty('password-confirm')
    }
  })

  test('should return conflict error for duplicate loginId', async () => {
    mockDbInsert.mockImplementationOnce(() => Promise.resolve([]))

    formData.append('loginId', 'existinguser')
    formData.append('password', 'Password123!')
    formData.append('password-confirm', 'Password123!')

    const result = await signup(formData)

    expect(result.ok).toBe(false)
    expect('error' in result).toBe(true)

    if (!result.ok && typeof result.error === 'object') {
      expect(result.error.loginId).toBe('이미 사용 중인 아이디에요')
    }
  })
})
