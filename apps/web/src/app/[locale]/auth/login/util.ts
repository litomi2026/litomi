type LoginFormFieldName = 'login-id' | 'password'
type TwoFactorFormFieldName = 'token'

export const loginInputNames: Record<string, LoginFormFieldName> = {
  loginId: 'login-id',
  password: 'password',
}

export const twoFactorInputNames: Record<string, TwoFactorFormFieldName> = {
  token: 'token',
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
  getInput(form, 'login-id')?.setCustomValidity('')
  getInput(form, 'password')?.setCustomValidity('')
}

export function clearTwoFactorValidity(form: HTMLFormElement | null) {
  getInput(form, 'token')?.setCustomValidity('')
}

function getInput(form: HTMLFormElement | null, field: LoginFormFieldName | TwoFactorFormFieldName) {
  const input = form?.elements.namedItem(field)
  return input instanceof HTMLInputElement ? input : null
}
