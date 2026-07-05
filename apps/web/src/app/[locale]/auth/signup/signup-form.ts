type SignupFormFieldName = 'cf-turnstile-response' | 'login-id' | 'nickname' | 'password-confirm' | 'password'
type SignupPasswordFieldName = 'password-confirm' | 'password'

export const signupInputNames: Record<string, SignupFormFieldName> = {
  loginId: 'login-id',
  nickname: 'nickname',
  password: 'password',
  passwordConfirm: 'password-confirm',
}

export function clearSignupInputValidity(form: HTMLFormElement | null, target: EventTarget | null) {
  if (!(target instanceof HTMLInputElement)) {
    return
  }

  target.setCustomValidity('')

  if (target.name === 'login-id' || target.name === 'password') {
    getSignupInput(form, 'password')?.setCustomValidity('')
  }

  if (target.name === 'password' || target.name === 'password-confirm') {
    getSignupInput(form, 'password-confirm')?.setCustomValidity('')
  }
}

export function clearSignupLoginId(form: HTMLFormElement | null) {
  const input = getSignupInput(form, 'login-id')
  if (!input) {
    return
  }

  input.value = ''
  input.setCustomValidity('')
  getSignupInput(form, 'password')?.setCustomValidity('')
  input.focus()
}

export function clearSignupValidity(form: HTMLFormElement | null) {
  getSignupInput(form, signupInputNames.loginId)?.setCustomValidity('')
  getSignupInput(form, signupInputNames.nickname)?.setCustomValidity('')
  getSignupInput(form, signupInputNames.password)?.setCustomValidity('')
  getSignupInput(form, signupInputNames.passwordConfirm)?.setCustomValidity('')
}

export function getSignupInput(form: HTMLFormElement | null, field: SignupFormFieldName) {
  const input = form?.elements.namedItem(field)
  return input instanceof HTMLInputElement ? input : null
}

export function reportInputValidity(input: HTMLInputElement | null, message: string) {
  if (!input) {
    return
  }

  input.setCustomValidity(message)
  input.focus()
  input.reportValidity()
}

export function toggleSignupPasswordVisibility(
  form: HTMLFormElement | null,
  field: SignupPasswordFieldName,
  button: HTMLButtonElement,
) {
  const input = getSignupInput(form, field)
  if (!input) {
    return
  }

  const nextVisible = input.type === 'password'
  input.type = nextVisible ? 'text' : 'password'

  if (nextVisible) {
    button.setAttribute('aria-pressed', 'true')
  } else {
    button.removeAttribute('aria-pressed')
  }

  input.focus()
}
