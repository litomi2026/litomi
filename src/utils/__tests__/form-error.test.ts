import { describe, expect, test } from 'bun:test'

import { createFormError, getErrorMessage, hasFieldError, zodToFormError } from '../form-error'

describe('form-error utilities', () => {
  describe('createFormError', () => {
    test('should create a form error with only form message', () => {
      const error = createFormError('Form error message')
      expect(error).toEqual({ form: 'Form error message' })
    })

    test('should create a form error with only field errors', () => {
      const error = createFormError(undefined, { loginId: 'Invalid ID' })
      expect(error).toEqual({ fields: { loginId: 'Invalid ID' } })
    })

    test('should create a form error with both form and field errors', () => {
      const error = createFormError('Form error', { loginId: 'Field error' })
      expect(error).toEqual({
        form: 'Form error',
        fields: { loginId: 'Field error' },
      })
    })
  })

  describe('getErrorMessage', () => {
    test('should return undefined for undefined error', () => {
      expect(getErrorMessage(undefined)).toBeUndefined()
    })

    test('should prefer form-level error over field errors', () => {
      const error = createFormError('Form error', { loginId: 'Field error' })
      expect(getErrorMessage(error)).toBe('Form error')
    })

    test('should return first field error when no form error', () => {
      const error = createFormError(undefined, {
        loginId: 'Login error',
        password: 'Password error',
      })
      expect(getErrorMessage(error)).toBe('Login error')
    })
  })

  describe('hasFieldError', () => {
    test('should return false for undefined error', () => {
      expect(hasFieldError(undefined, 'loginId')).toBe(false)
    })

    test('should return true when field has error', () => {
      const error = createFormError(undefined, { loginId: 'Error' })
      expect(hasFieldError(error, 'loginId')).toBe(true)
    })

    test('should return false when field has no error', () => {
      const error = createFormError(undefined, { password: 'Error' })
      expect(hasFieldError(error, 'loginId')).toBe(false)
    })
  })

  describe('zodToFormError', () => {
    test('should convert Zod errors to FormError', () => {
      const zodError = {
        loginId: { errors: ['First error', 'Second error'] },
        password: { errors: ['Password error'] },
      }
      const formError = zodToFormError(zodError)
      expect(formError).toEqual({
        fields: {
          loginId: 'First error',
          password: 'Password error',
        },
      })
    })

    test('should handle empty errors array', () => {
      const zodError = {
        loginId: { errors: [] },
        password: { errors: ['Error'] },
      }
      const formError = zodToFormError(zodError)
      expect(formError).toEqual({
        fields: {
          password: 'Error',
        },
      })
    })
  })
})
