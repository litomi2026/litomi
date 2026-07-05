import '@test/setup.dom'

import { afterEach, describe, expect, test } from 'bun:test'
import type { ProblemDetails } from '@litomi/http/problem-details'

import { applyInvalidParams } from '@/lib/apply-invalid-params'
import type { ErrorsTranslator } from '@/lib/error-message'

import {
  clearSignupInputValidity,
  clearSignupLoginId,
  signupInputNames,
  toggleSignupPasswordVisibility,
} from '../signup-form'

// invalidParams[].code → 카탈로그 카피 변환은 error-message 리졸버 소관이므로, 폼 DOM 매핑만 검증하도록
// 키를 그대로 돌려주는 fake 번역기를 쓴다(코드 → 표시 메시지의 결정성만 보장).
const fakeErrorsTranslator = Object.assign((key: string) => `msg:${key}`, {
  has: () => true,
}) as unknown as ErrorsTranslator

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
    throw new Error('회원가입 폼을 만들지 못했어요')
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
    throw new Error('회원가입 입력 요소를 만들지 못했어요')
  }

  return { form, loginId, password, passwordConfirm, nickname, turnstile }
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('회원가입 폼 헬퍼', () => {
  test('비밀번호가 바뀌면 연관된 사용자 지정 유효성 메시지를 지운다', () => {
    const { form, password, passwordConfirm } = createSignupForm()

    password.setCustomValidity('아이디와 비밀번호는 같을 수 없어요')
    passwordConfirm.setCustomValidity('비밀번호와 비밀번호 확인 값이 일치하지 않아요')

    clearSignupInputValidity(form, password)

    expect(password.validationMessage).toBe('')
    expect(passwordConfirm.validationMessage).toBe('')
  })

  test('invalidParams 값을 일치하는 회원가입 필드에 적용한다', () => {
    const { form, loginId, nickname } = createSignupForm()

    const problem: ProblemDetails = {
      type: 'https://example.com/problems/invalid-input',
      title: '잘못된 요청이에요',
      status: 400,
      invalidParams: [
        { name: 'loginId', code: 'login-id-conflict' },
        { name: 'nickname', code: 'invalid_type' },
      ],
    }

    expect(applyInvalidParams(form, problem, fakeErrorsTranslator, signupInputNames)).toBe(true)
    expect(loginId.validationMessage).toBe('msg:field.login-id-conflict')
    expect(nickname.validationMessage).toBe('msg:field.invalid_type')
    expect(document.activeElement).toBe(loginId)
  })

  test('loginId 필드를 비우고 포커스를 이동한다', () => {
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

  test('aria-pressed 상태에 맞춰 비밀번호 표시 여부를 전환한다', () => {
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
