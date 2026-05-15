import '@test/setup.dom'
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, test } from 'bun:test'

import OneTimeCodeInput from './OneTimeCodeInput'

afterEach(() => {
  cleanup()
})

describe('OneTimeCodeInput', () => {
  test('OTP 입력에 필요한 표준 속성을 기본으로 제공한다', () => {
    const { getByRole } = render(<OneTimeCodeInput />)
    const input = getByRole('textbox')

    expect(input.getAttribute('autocomplete')).toBe('one-time-code')
    expect(input.getAttribute('autocapitalize')).toBe('off')
    expect(input.getAttribute('autocorrect')).toBe('off')
    expect(input.getAttribute('enterkeyhint')).toBe('done')
    expect(input.getAttribute('inputmode')).toBe('numeric')
    expect(input.getAttribute('spellcheck')).toBe('false')
  })

  test('호출부에서 전달한 props로 기본 속성을 덮어쓸 수 있다', () => {
    const { getByRole } = render(<OneTimeCodeInput autoComplete="off" inputMode="text" maxLength={9} />)
    const input = getByRole('textbox')

    expect(input.getAttribute('autocomplete')).toBe('off')
    expect(input.getAttribute('inputmode')).toBe('text')
    expect(input.getAttribute('maxlength')).toBe('9')
  })
})
