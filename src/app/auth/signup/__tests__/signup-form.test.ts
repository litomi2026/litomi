import { afterEach, describe, expect, test } from 'bun:test'

import type { ProblemDetails } from '@/utils/problem-details'

import {
  applySignupProblem,
  clearSignupInputValidity,
  clearSignupLoginId,
  toggleSignupPasswordVisibility,
  validateSignupRequest,
} from '../signup-form'

function createSignupForm() {
  document.body.innerHTML = `
    <form>
      <input name="login-id" type="text" />
      <input name="password" type="password" />
      <input name="password-confirm" type="password" />
      <input name="nickname" type="text" />
      <input name="cf-turnstile-response" type="hidden" />
    </form>
  `

  const form = document.querySelector('form')
  if (!(form instanceof window.HTMLFormElement)) {
    throw new Error('signup form not created')
  }

  const loginId = form.elements.namedItem('login-id')
  const password = form.elements.namedItem('password')
  const passwordConfirm = form.elements.namedItem('password-confirm')
  const nickname = form.elements.namedItem('nickname')
  const turnstile = form.elements.namedItem('cf-turnstile-response')

  if (
    !(loginId instanceof window.HTMLInputElement) ||
    !(password instanceof window.HTMLInputElement) ||
    !(passwordConfirm instanceof window.HTMLInputElement) ||
    !(nickname instanceof window.HTMLInputElement) ||
    !(turnstile instanceof window.HTMLInputElement)
  ) {
    throw new Error('signup inputs not created')
  }

  return { form, loginId, password, passwordConfirm, nickname, turnstile }
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('signup-form helpers', () => {
  test('reports password confirmation mismatch on the confirm field', () => {
    const { form, passwordConfirm } = createSignupForm()

    const isValid = validateSignupRequest(form, {
      loginId: 'litomi',
      nickname: '',
      password: 'password123',
      passwordConfirm: 'password456',
      turnstileToken: 'token-123',
    })

    expect(isValid).toBe(false)
    expect(passwordConfirm.validationMessage).toBe('비밀번호와 비밀번호 확인 값이 일치하지 않아요')
    expect(document.activeElement).toBe(passwordConfirm)
  })

  test('clears dependent custom validity when the password changes', () => {
    const { form, password, passwordConfirm } = createSignupForm()

    password.setCustomValidity('아이디와 비밀번호는 같을 수 없어요')
    passwordConfirm.setCustomValidity('비밀번호와 비밀번호 확인 값이 일치하지 않아요')

    clearSignupInputValidity(form, password)

    expect(password.validationMessage).toBe('')
    expect(passwordConfirm.validationMessage).toBe('')
  })

  test('applies invalidParams to matching signup fields', () => {
    const { form, loginId, nickname } = createSignupForm()

    const problem: ProblemDetails = {
      type: 'https://example.com/problems/invalid-input',
      title: '잘못된 요청이에요',
      status: 400,
      invalidParams: [
        { name: 'loginId', reason: '이미 사용 중인 아이디예요' },
        { name: 'nickname', reason: '닉네임을 확인해 주세요' },
      ],
    }

    expect(applySignupProblem(form, problem)).toBe(true)
    expect(loginId.validationMessage).toBe('이미 사용 중인 아이디예요')
    expect(nickname.validationMessage).toBe('닉네임을 확인해 주세요')
    expect(document.activeElement).toBe(loginId)
  })

  test('clears the login id field and focuses it', () => {
    const { form, loginId, password } = createSignupForm()

    loginId.value = 'litomi'
    loginId.setCustomValidity('이미 사용 중인 아이디예요')
    password.setCustomValidity('아이디와 비밀번호는 같을 수 없어요')

    clearSignupLoginId(form)

    expect(loginId.value).toBe('')
    expect(loginId.validationMessage).toBe('')
    expect(password.validationMessage).toBe('')
    expect(document.activeElement).toBe(loginId)
  })

  test('toggles password visibility with aria-pressed state', () => {
    const { form, password } = createSignupForm()
    const button = document.createElement('button')

    toggleSignupPasswordVisibility(form, 'password', button)
    expect(password.type).toBe('text')
    expect(button.getAttribute('aria-pressed')).toBe('true')
    expect(document.activeElement).toBe(password)

    toggleSignupPasswordVisibility(form, 'password', button)
    expect(password.type).toBe('password')
    expect(button.hasAttribute('aria-pressed')).toBe(false)
  })
})
