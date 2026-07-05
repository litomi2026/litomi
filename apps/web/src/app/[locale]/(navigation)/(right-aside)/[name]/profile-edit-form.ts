import type { PATCHV1MeBody } from '@litomi/contracts'
import type { ProblemDetails } from '@litomi/http/problem-details'

import { getInvalidParams } from '@litomi/http/problem-details'

import type { ErrorsTranslator } from '@/lib/error-message'

import { getInvalidParamMessage } from '@/lib/error-message'

export type EditableProfile = {
  id: number
  loginId: string
  name: string
  nickname: string
  imageURL: string | null
}

export type ProfileFieldErrors = Partial<Record<ProfileFieldName, string>>

type ProfileFieldName = 'imageURL' | 'name' | 'nickname'

const profileInputNames: Record<ProfileFieldName, ProfileFieldName> = {
  name: 'name',
  nickname: 'nickname',
  imageURL: 'imageURL',
}

export function applyProfileProblem(form: HTMLFormElement | null, problem: ProblemDetails, t: ErrorsTranslator) {
  const fieldErrors = getProfileProblemFieldErrors(problem, t)
  let firstInvalidInput: HTMLInputElement | null = null

  for (const [field, reason] of Object.entries(fieldErrors)) {
    const input = getProfileInput(form, field as ProfileFieldName)

    if (!input) {
      continue
    }

    input.setCustomValidity(reason)

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

export function buildProfileEditPatch(me: EditableProfile, formData: FormData): PATCHV1MeBody | null {
  const name = String(formData.get(profileInputNames.name) ?? '')
  const nickname = String(formData.get(profileInputNames.nickname) ?? '')
  const rawImageURL = String(formData.get(profileInputNames.imageURL) ?? '')
  const imageURL = rawImageURL === '' ? null : rawImageURL
  const patch: PATCHV1MeBody = {}

  if (name !== me.name) {
    patch.name = name
  }

  if (nickname !== me.nickname) {
    patch.nickname = nickname
  }

  if (imageURL !== me.imageURL) {
    patch.imageURL = imageURL
  }

  return Object.keys(patch).length > 0 ? patch : null
}

export function clearProfileInputValidity(target: EventTarget | null) {
  if (!(target instanceof HTMLInputElement) || !isProfileFieldName(target.name)) {
    return
  }

  target.setCustomValidity('')
}

export function clearProfileValidity(form: HTMLFormElement | null) {
  getProfileInput(form, profileInputNames.name)?.setCustomValidity('')
  getProfileInput(form, profileInputNames.nickname)?.setCustomValidity('')
  getProfileInput(form, profileInputNames.imageURL)?.setCustomValidity('')
}

export function encodePasskeyUserId(userId: number) {
  return btoa(String(userId)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

export function getProfileProblemFieldErrors(problem: ProblemDetails, t: ErrorsTranslator): ProfileFieldErrors {
  const fieldErrors: ProfileFieldErrors = {}

  for (const param of getInvalidParams(problem)) {
    if (!isProfileFieldName(param.name)) {
      continue
    }

    fieldErrors[param.name] = getInvalidParamMessage(t, param)
  }

  return fieldErrors
}

function getProfileInput(form: HTMLFormElement | null, field: ProfileFieldName) {
  const input = form?.elements.namedItem(field)
  return input instanceof HTMLInputElement ? input : null
}

function isProfileFieldName(name: string): name is ProfileFieldName {
  return name === 'name' || name === 'nickname' || name === 'imageURL'
}
