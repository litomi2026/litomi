import type { ProblemDetails } from '@/utils/problem-details'

import { getInvalidParams } from '@/utils/problem-details'

type PasswordChangeFormFieldName = 'confirmPassword' | 'currentPassword' | 'newPassword' | 'token'
type PasswordChangeServerFieldName = 'currentPassword' | 'newPassword' | 'token'

export function applyPasswordChangeProblem(form: HTMLFormElement | null, problem: ProblemDetails) {
  let firstInvalidInput: HTMLInputElement | null = null

  for (const param of getInvalidParams(problem)) {
    if (!isPasswordChangeServerFieldName(param.name)) {
      continue
    }

    const input = getPasswordChangeInput(form, param.name)

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

export function clearPasswordChangeInputValidity(form: HTMLFormElement | null, target: EventTarget | null) {
  if (!(target instanceof HTMLInputElement)) {
    return
  }

  target.setCustomValidity('')

  if (target.name === 'currentPassword') {
    getPasswordChangeInput(form, 'newPassword')?.setCustomValidity('')
  }

  if (target.name === 'newPassword') {
    getPasswordChangeInput(form, 'currentPassword')?.setCustomValidity('')
    getPasswordChangeInput(form, 'confirmPassword')?.setCustomValidity('')
  }

  if (target.name === 'confirmPassword') {
    getPasswordChangeInput(form, 'newPassword')?.setCustomValidity('')
  }
}

export function clearPasswordChangeValidity(form: HTMLFormElement | null) {
  getPasswordChangeInput(form, 'currentPassword')?.setCustomValidity('')
  getPasswordChangeInput(form, 'newPassword')?.setCustomValidity('')
  getPasswordChangeInput(form, 'confirmPassword')?.setCustomValidity('')
  getPasswordChangeInput(form, 'token')?.setCustomValidity('')
}

export function getPasswordChangeInput(form: HTMLFormElement | null, field: PasswordChangeFormFieldName) {
  const input = form?.elements.namedItem(field)
  return input instanceof HTMLInputElement ? input : null
}

function isPasswordChangeServerFieldName(name: string): name is PasswordChangeServerFieldName {
  return name === 'currentPassword' || name === 'newPassword' || name === 'token'
}
