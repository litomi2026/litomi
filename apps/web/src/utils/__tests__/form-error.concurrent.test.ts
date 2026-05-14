import { describe, expect, test } from 'bun:test'
import { z } from 'zod'

import { flattenZodFieldErrors } from '../form-error'

describe('폼 오류 유틸', () => {
  describe('flattenZodFieldErrors', () => {
    test('단순한 필드 오류를 평탄화한다', () => {
      const schema = z.object({
        loginId: z.string().min(3, '잘못된 로그인 아이디예요'),
        password: z.string().min(8, '비밀번호가 너무 약해요'),
      })

      const validationResult = schema.safeParse({
        loginId: 'ab',
        password: 'weak',
      })

      if (!validationResult.success) {
        const result = flattenZodFieldErrors(validationResult.error)
        expect(result).toEqual({
          loginId: '잘못된 로그인 아이디예요',
          password: '비밀번호가 너무 약해요',
        })
      }
    })

    test('중첩 객체 필드 오류를 처리한다', () => {
      const schema = z.object({
        user: z.object({
          email: z.string().email('이메일 형식이 올바르지 않아요'),
          name: z.string().min(1, '이름은 필수예요'),
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
        // Zod의 flattenError는 중첩 객체에서 첫 번째 오류만 반환한다.
        expect(result).toHaveProperty('user')
        expect(typeof result.user).toBe('string')
      }
    })

    test('같은 필드에 오류가 여러 개면 첫 번째 오류를 사용한다', () => {
      const schema = z.object({
        password: z.string().min(6, '비밀번호가 너무 짧아요').regex(/[0-9]/, '비밀번호에 숫자가 들어가야 해요'),
      })

      const validationResult = schema.safeParse({
        password: 'weak',
      })

      if (!validationResult.success) {
        const result = flattenZodFieldErrors(validationResult.error)
        expect(result).toEqual({
          password: '비밀번호가 너무 짧아요',
        })
      }
    })

    test('빈 오류 객체를 처리한다', () => {
      const schema = z.object({
        field: z.string(),
      })

      const validationResult = schema.safeParse({ field: 'valid' })

      if (validationResult.success) {
        // 테스트용 빈 오류 객체를 만든다.
        const emptyError = new z.ZodError([])
        const result = flattenZodFieldErrors(emptyError)
        expect(result).toEqual({})
      }
    })

    test('배열 필드 오류를 처리한다', () => {
      const schema = z.object({
        items: z
          .array(
            z.object({
              name: z.string().min(1, '상품 이름은 필수예요'),
              price: z.number().positive('가격이 올바르지 않아요'),
            }),
          )
          .min(1, '상품은 최소 1개 이상 필요해요'),
      })

      const validationResult = schema.safeParse({
        items: [],
      })

      if (!validationResult.success) {
        const result = flattenZodFieldErrors(validationResult.error)
        expect(result).toEqual({
          items: '상품은 최소 1개 이상 필요해요',
        })
      }
    })

    test('refine 오류를 처리한다', () => {
      const schema = z
        .object({
          password: z.string(),
          confirmPassword: z.string(),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: '비밀번호가 일치하지 않아요',
          path: ['confirmPassword'],
        })

      const validationResult = schema.safeParse({
        password: 'password123',
        confirmPassword: 'different',
      })

      if (!validationResult.success) {
        const result = flattenZodFieldErrors(validationResult.error)
        expect(result).toEqual({
          confirmPassword: '비밀번호가 일치하지 않아요',
        })
      }
    })

    test('검증기가 여러 개인 문자열 필드를 처리한다', () => {
      const schema = z.object({
        email: z.string().min(1, '이메일은 필수예요').email('이메일 형식이 올바르지 않아요'),
      })

      const validationResult = schema.safeParse({
        email: '',
      })

      if (!validationResult.success) {
        const result = flattenZodFieldErrors(validationResult.error)
        expect(result).toEqual({
          email: '이메일은 필수예요',
        })
      }
    })

    test('선택 필드를 처리한다', () => {
      const schema = z.object({
        required: z.string().min(1, '필수 입력값이에요'),
        optional: z.string().optional(),
      })

      const validationResult = schema.safeParse({
        required: '',
      })

      if (!validationResult.success) {
        const result = flattenZodFieldErrors(validationResult.error)
        expect(result).toEqual({
          required: '필수 입력값이에요',
        })
        expect(result.optional).toBeUndefined()
      }
    })

    test('회원가입처럼 실제 폼 검증 시나리오를 처리한다', () => {
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
