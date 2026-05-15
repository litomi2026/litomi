import type { ProblemDetails } from '@litomi/http/problem-details'

import { getInvalidParams } from '@litomi/http/problem-details'

type LoginFormFieldName = 'login-id' | 'password'
type LoginServerFieldName = 'loginId' | 'password'
type TwoFactorFormFieldName = 'token'
type TwoFactorServerFieldName = 'token'

const loginInputNames: Record<LoginServerFieldName, LoginFormFieldName> = {
  loginId: 'login-id',
  password: 'password',
}

const twoFactorInputNames: Record<TwoFactorServerFieldName, TwoFactorFormFieldName> = {
  token: 'token',
}

export function applyLoginProblem(form: HTMLFormElement | null, problem: ProblemDetails) {
  let firstInvalidInput: HTMLInputElement | null = null

  for (const param of getInvalidParams(problem)) {
    if (!isLoginServerFieldName(param.name)) {
      continue
    }

    const input = getInput(form, loginInputNames[param.name])
    if (!input) {
      continue
    }

    input.setCustomValidity(param.reason)

    if (!firstInvalidInput) {
      firstInvalidInput = input
    }
  }

  if (!firstInvalidInput) {
    return false
  }

  firstInvalidInput.focus()
  firstInvalidInput.reportValidity()
  return true
}

export function applyTwoFactorProblem(form: HTMLFormElement | null, problem: ProblemDetails) {
  let firstInvalidInput: HTMLInputElement | null = null

  for (const param of getInvalidParams(problem)) {
    if (!isTwoFactorServerFieldName(param.name)) {
      continue
    }

    const input = getInput(form, twoFactorInputNames[param.name])
    if (!input) {
      continue
    }

    input.setCustomValidity(param.reason)

    if (!firstInvalidInput) {
      firstInvalidInput = input
    }
  }

  if (!firstInvalidInput) {
    return false
  }

  firstInvalidInput.focus()
  firstInvalidInput.reportValidity()
  return true
}

export function clearLoginId(form: HTMLFormElement | null) {
  const input = getInput(form, 'login-id')

  if (!input) {
    return
  }

  input.value = ''
  input.setCustomValidity('')
  input.focus()
}

export function clearLoginValidity(form: HTMLFormElement | null) {
  getInput(form, loginInputNames.loginId)?.setCustomValidity('')
  getInput(form, loginInputNames.password)?.setCustomValidity('')
}

export function clearTwoFactorValidity(form: HTMLFormElement | null) {
  getInput(form, twoFactorInputNames.token)?.setCustomValidity('')
}

function getInput(form: HTMLFormElement | null, field: LoginFormFieldName | TwoFactorFormFieldName) {
  const input = form?.elements.namedItem(field)
  return input instanceof HTMLInputElement ? input : null
}

function isLoginServerFieldName(name: string): name is LoginServerFieldName {
  return name === 'loginId' || name === 'password'
}

function isTwoFactorServerFieldName(name: string): name is TwoFactorServerFieldName {
  return name === 'token'
}
