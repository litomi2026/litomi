type PasswordChangeFormFieldName = 'confirmPassword' | 'currentPassword' | 'newPassword' | 'token'

export const passwordChangeInputNames: Record<string, PasswordChangeFormFieldName> = {
  currentPassword: 'currentPassword',
  newPassword: 'newPassword',
  token: 'token',
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
