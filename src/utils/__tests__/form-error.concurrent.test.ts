import { describe, expect, test } from 'bun:test'
import { z } from 'zod'

import { flattenZodFieldErrors } from '../form-error'

describe('form-error utilities', () => {
  describe('flattenZodFieldErrors', () => {
    test('should flatten simple field errors', () => {
      const schema = z.object({
        loginId: z.string().min(3, 'Invalid login ID'),
        password: z.string().min(8, 'Password too weak'),
      })

      const validationResult = schema.safeParse({
        loginId: 'ab',
        password: 'weak',
      })

      if (!validationResult.success) {
        const result = flattenZodFieldErrors(validationResult.error)
        expect(result).toEqual({
          loginId: 'Invalid login ID',
          password: 'Password too weak',
        })
      }
    })

    test('should handle nested object field errors', () => {
      const schema = z.object({
        user: z.object({
          email: z.string().email('Invalid email format'),
          name: z.string().min(1, 'Name is required'),
        }),
      })

      const validationResult = schema.safeParse({
        user: {
          email: 'not-an-email',
          name: '',
        },
      })

      if (!validationResult.success) {
        const result = flattenZodFieldErrors(validationResult.error)
        // Zod's flattenError returns the first error for nested objects
        expect(result).toHaveProperty('user')
        expect(typeof result.user).toBe('string')
      }
    })

    test('should take first error when multiple errors exist for same field', () => {
      const schema = z.object({
        password: z.string().min(6, 'Password too short').regex(/[0-9]/, 'Password must contain numbers'),
      })

      const validationResult = schema.safeParse({
        password: 'weak',
      })

      if (!validationResult.success) {
        const result = flattenZodFieldErrors(validationResult.error)
        expect(result).toEqual({
          password: 'Password too short',
        })
      }
    })

    test('should handle empty errors object', () => {
      const schema = z.object({
        field: z.string(),
      })

      const validationResult = schema.safeParse({ field: 'valid' })

      if (validationResult.success) {
        // Create an empty error for testing
        const emptyError = new z.ZodError([])
        const result = flattenZodFieldErrors(emptyError)
        expect(result).toEqual({})
      }
    })

    test('should handle array field errors', () => {
      const schema = z.object({
        items: z
          .array(
            z.object({
              name: z.string().min(1, 'Item name required'),
              price: z.number().positive('Invalid price'),
            }),
          )
          .min(1, 'At least one item required'),
      })

      const validationResult = schema.safeParse({
        items: [],
      })

      if (!validationResult.success) {
        const result = flattenZodFieldErrors(validationResult.error)
        expect(result).toEqual({
          items: 'At least one item required',
        })
      }
    })

    test('should handle refine errors', () => {
      const schema = z
        .object({
          password: z.string(),
          confirmPassword: z.string(),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: 'Passwords do not match',
          path: ['confirmPassword'],
        })

      const validationResult = schema.safeParse({
        password: 'password123',
        confirmPassword: 'different',
      })

      if (!validationResult.success) {
        const result = flattenZodFieldErrors(validationResult.error)
        expect(result).toEqual({
          confirmPassword: 'Passwords do not match',
        })
      }
    })

    test('should handle string field with multiple validators', () => {
      const schema = z.object({
        email: z.string().min(1, 'Email is required').email('Invalid email format'),
      })

      const validationResult = schema.safeParse({
        email: '',
      })

      if (!validationResult.success) {
        const result = flattenZodFieldErrors(validationResult.error)
        expect(result).toEqual({
          email: 'Email is required',
        })
      }
    })

    test('should handle optional fields', () => {
      const schema = z.object({
        required: z.string().min(1, 'Field is required'),
        optional: z.string().optional(),
      })

      const validationResult = schema.safeParse({
        required: '',
      })

      if (!validationResult.success) {
        const result = flattenZodFieldErrors(validationResult.error)
        expect(result).toEqual({
          required: 'Field is required',
        })
        expect(result.optional).toBeUndefined()
      }
    })

    test('should handle actual form validation like signup', () => {
      const schema = z
        .object({
          loginId: z.string().min(4, '아이디는 4자 이상이어야 해요'),
          password: z.string().min(8, '비밀번호는 8자 이상이어야 해요'),
          'password-confirm': z.string(),
          nickname: z.string().min(2, '닉네임은 2자 이상이어야 해요'),
        })
        .refine((data) => data.password === data['password-confirm'], {
          message: '비밀번호와 비밀번호 확인 값이 일치하지 않아요',
          path: ['password-confirm'],
        })

      const validationResult = schema.safeParse({
        loginId: 'usr',
        password: 'pass',
        'password-confirm': 'pass',
        nickname: 'a',
      })

      if (!validationResult.success) {
        const result = flattenZodFieldErrors(validationResult.error)
        expect(result).toEqual({
          loginId: '아이디는 4자 이상이어야 해요',
          password: '비밀번호는 8자 이상이어야 해요',
          nickname: '닉네임은 2자 이상이어야 해요',
        })
      }
    })
  })
})
