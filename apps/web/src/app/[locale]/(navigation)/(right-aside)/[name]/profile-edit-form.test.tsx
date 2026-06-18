import '@test/setup.dom'
import type { ProblemDetails } from '@litomi/http/problem-details'

import { describe, expect, test } from 'bun:test'

import {
  applyProfileProblem,
  buildProfileEditPatch,
  clearProfileValidity,
  getProfileProblemFieldErrors,
} from './profile-edit-form'

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
        { name: 'name', reason: '이미 사용 중인 이름이에요' },
        { name: 'imageURL', reason: '프로필 이미지 주소가 URL 형식이 아니에요' },
      ],
    }

    expect(getProfileProblemFieldErrors(problem)).toEqual({
      name: '이미 사용 중인 이름이에요',
      imageURL: '프로필 이미지 주소가 URL 형식이 아니에요',
    })
    expect(applyProfileProblem(form, problem)).toBe(true)
    expect(nameInput.validationMessage).toBe('이미 사용 중인 이름이에요')
    expect(imageURLInput.validationMessage).toBe('프로필 이미지 주소가 URL 형식이 아니에요')

    clearProfileValidity(form)

    expect(nameInput.validationMessage).toBe('')
    expect(imageURLInput.validationMessage).toBe('')
  })
})
