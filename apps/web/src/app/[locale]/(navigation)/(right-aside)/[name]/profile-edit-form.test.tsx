import '@test/setup.dom'

import { describe, expect, test } from 'bun:test'
import type { ProblemDetails } from '@litomi/http/problem-details'

import type { ErrorsTranslator } from '@/lib/error-message'

import {
  applyProfileProblem,
  buildProfileEditPatch,
  clearProfileValidity,
  getProfileProblemFieldErrors,
} from './profile-edit-form'

// invalidParams[].code → 카탈로그 카피 변환은 error-message 리졸버 소관이므로, 필드 매핑만 검증하도록
// 키를 그대로 돌려주는 fake 번역기를 쓴다.
const fakeErrorsTranslator = Object.assign((key: string) => `msg:${key}`, {
  has: () => true,
}) as unknown as ErrorsTranslator

describe('profile-edit-form', () => {
  test('변경이 없으면 patch를 생략하고, 빈 imageURL은 null로 정규화한다', () => {
    const unchangedFormData = new FormData()
    unchangedFormData.set('name', 'alice')
    unchangedFormData.set('nickname', 'Alice')
    unchangedFormData.set('imageURL', '')

    expect(
      buildProfileEditPatch(
        {
          id: 1,
          loginId: 'tester',
          name: 'alice',
          nickname: 'Alice',
          imageURL: null,
        },
        unchangedFormData,
      ),
    ).toBeNull()

    const changedFormData = new FormData()
    changedFormData.set('name', 'alice')
    changedFormData.set('nickname', 'Alice')
    changedFormData.set('imageURL', '')

    expect(
      buildProfileEditPatch(
        {
          id: 1,
          loginId: 'tester',
          name: 'alice',
          nickname: 'Alice',
          imageURL: 'https://example.com/avatar.png',
        },
        changedFormData,
      ),
    ).toEqual({ imageURL: null })
  })

  test('invalidParams를 프로필 수정 필드 오류로 매핑하고 validity를 적용한다', () => {
    const form = document.createElement('form')
    const nameInput = document.createElement('input')
    const nicknameInput = document.createElement('input')
    const imageURLInput = document.createElement('input')

    nameInput.name = 'name'
    nicknameInput.name = 'nickname'
    imageURLInput.name = 'imageURL'

    form.append(nameInput, nicknameInput, imageURLInput)
    document.body.append(form)

    const problem: ProblemDetails = {
      type: 'https://litomi.cc/problems/invalid-input',
      title: '잘못된 요청이에요',
      status: 400,
      detail: '입력을 확인해 주세요',
      invalidParams: [
        { name: 'name', code: 'name-conflict' },
        { name: 'imageURL', code: 'invalid-protocol' },
      ],
    }

    expect(getProfileProblemFieldErrors(problem, fakeErrorsTranslator)).toEqual({
      name: 'msg:field.name-conflict',
      imageURL: 'msg:field.invalid-protocol',
    })
    expect(applyProfileProblem(form, problem, fakeErrorsTranslator)).toBe(true)
    expect(nameInput.validationMessage).toBe('msg:field.name-conflict')
    expect(imageURLInput.validationMessage).toBe('msg:field.invalid-protocol')

    clearProfileValidity(form)

    expect(nameInput.validationMessage).toBe('')
    expect(imageURLInput.validationMessage).toBe('')
  })
})
