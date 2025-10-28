import { expect, test } from '@playwright/test'

import { generateTestUser } from '../../utils/user'

test.describe('/auth/signup', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signup')
    await expect(page.locator('label[for="loginId"]')).toContainText('아이디')
  })

  test.describe('회원가입 실패', () => {
    test.describe('아이디', () => {
      test('아이디 유효성을 검증한다 (HTML5)', async ({ page }) => {
        const loginIdInput = page.locator('input[name="loginId"]')
        await loginIdInput.fill('a')
        await page.fill('input[name="password"]', 'ValidPass123')
        await page.fill('input[name="password-confirm"]', 'ValidPass123')
        await page.click('button[type="submit"]')

        const validationMessage = await loginIdInput.evaluate((el: HTMLInputElement) => el.validationMessage)
        expect(validationMessage).toBeTruthy()
      })

      test('아이디 유효성을 검증한다 (서버)', async ({ page }) => {
        const loginIdInput = page.locator('input[name="loginId"]')

        await loginIdInput.evaluate((el: HTMLInputElement) => {
          el.removeAttribute('pattern')
          el.removeAttribute('minLength')
        })

        await loginIdInput.fill('a')
        await page.fill('input[name="password"]', 'ValidPass123')
        await page.fill('input[name="password-confirm"]', 'ValidPass123')

        await page.click('button[type="submit"]')

        await expect(page.locator('p.text-red-500').first()).toBeVisible()
        await expect(page.locator('text=/아이디는 최소 2자 이상이어야 해요/i')).toBeVisible()
      })

      test('아이디 최소 길이를 검증한다 (서버)', async ({ page }) => {
        const loginIdInput = page.locator('input[name="loginId"]')

        await loginIdInput.evaluate((el: HTMLInputElement) => {
          el.removeAttribute('pattern')
          el.removeAttribute('minLength')
          el.removeAttribute('maxLength')
        })

        await loginIdInput.fill('a')
        await page.fill('input[name="password"]', 'ValidPass123')
        await page.fill('input[name="password-confirm"]', 'ValidPass123')

        await page.click('button[type="submit"]')

        await expect(page.locator('p.text-red-500').first()).toBeVisible()
        await expect(page.locator('text=/아이디는 최소 2자 이상이어야 해요/i')).toBeVisible()
      })

      test('아이디 최대 길이를 검증한다 (HTML5)', async ({ page }) => {
        const loginIdInput = page.locator('input[name="loginId"]')
        const timestamp = Date.now()
        const longId = `test${timestamp}${'x'.repeat(30)}`
        await loginIdInput.fill(longId)

        const actualValue = await loginIdInput.inputValue()
        expect(actualValue.length).toBe(32)
        expect(actualValue).toBe(longId.substring(0, 32))
      })

      test('아이디 최대 길이를 검증한다 (서버)', async ({ page }) => {
        const loginIdInput = page.locator('input[name="loginId"]')
        const timestamp = Date.now()
        const longId = `test${timestamp}${'x'.repeat(30)}`

        await loginIdInput.evaluate((el: HTMLInputElement) => {
          el.removeAttribute('pattern')
          el.removeAttribute('minLength')
          el.removeAttribute('maxLength')
        })

        await loginIdInput.fill(longId)
        await page.fill('input[name="password"]', 'ValidPass123')
        await page.fill('input[name="password-confirm"]', 'ValidPass123')

        await page.click('button[type="submit"]')

        await expect(page.locator('p.text-red-500').first()).toBeVisible()
        await expect(page.locator('text=/아이디는 최대 32자까지 입력할 수 있어요/i')).toBeVisible()
      })

      test('허용되지 않은 문자가 포함된 아이디는 유효하지 않다 (HTML5)', async ({ page }) => {
        const loginIdInput = page.locator('input[name="loginId"]')

        await loginIdInput.fill('user@name')
        await page.fill('input[name="password"]', 'ValidPass123')
        await page.fill('input[name="password-confirm"]', 'ValidPass123')
        await page.click('button[type="submit"]')

        const validationMessage = await loginIdInput.evaluate((el: HTMLInputElement) => el.validationMessage)
        expect(validationMessage).toBeTruthy()
      })

      test('숫자로 시작하는 아이디는 유효하지 않다 (서버)', async ({ page }) => {
        const loginIdInput = page.locator('input[name="loginId"]')

        await loginIdInput.evaluate((el: HTMLInputElement) => {
          el.removeAttribute('pattern')
          el.removeAttribute('minLength')
          el.removeAttribute('maxLength')
        })

        await loginIdInput.fill('1username')
        await page.fill('input[name="password"]', 'ValidPass123')
        await page.fill('input[name="password-confirm"]', 'ValidPass123')

        await page.click('button[type="submit"]')

        await expect(page.locator('p.text-red-500').first()).toBeVisible()
        await expect(page.locator('text=/아이디는 알파벳, 숫자, _ 로만 구성해야 해요/i')).toBeVisible()
      })

      test('허용되지 않은 문자가 포함된 아이디는 유효하지 않다 (서버)', async ({ page }) => {
        const loginIdInput = page.locator('input[name="loginId"]')

        await loginIdInput.evaluate((el: HTMLInputElement) => {
          el.removeAttribute('pattern')
          el.removeAttribute('minLength')
          el.removeAttribute('maxLength')
        })

        await loginIdInput.fill('user@name')
        await page.fill('input[name="password"]', 'ValidPass123')
        await page.fill('input[name="password-confirm"]', 'ValidPass123')

        await page.click('button[type="submit"]')

        await expect(page.locator('p.text-red-500').first()).toBeVisible()
        await expect(page.locator('text=/아이디는 알파벳, 숫자, _ 로만 구성해야 해요/i')).toBeVisible()
      })
    })

    test.describe('비밀번호', () => {
      test('비밀번호 유효성을 검증한다 (HTML5)', async ({ page }) => {
        const user = generateTestUser()
        const passwordInput = page.locator('input[name="password"]')
        await page.fill('input[name="loginId"]', user.loginId)
        await passwordInput.fill('nodigits')
        await page.fill('input[name="password-confirm"]', 'nodigits')
        await page.click('button[type="submit"]')

        const validationMessage = await passwordInput.evaluate((el: HTMLInputElement) => el.validationMessage)
        expect(validationMessage).toBeTruthy()
      })

      test('비밀번호 유효성을 검증한다 (서버)', async ({ page }) => {
        const user = generateTestUser()
        const passwordInput = page.locator('input[name="password"]')

        await page.fill('input[name="loginId"]', user.loginId)

        await passwordInput.evaluate((el: HTMLInputElement) => {
          el.removeAttribute('pattern')
          el.removeAttribute('minLength')
        })

        await page.locator('input[name="password-confirm"]').evaluate((el: HTMLInputElement) => {
          el.removeAttribute('pattern')
          el.removeAttribute('minLength')
        })

        await passwordInput.fill('nodigits')
        await page.fill('input[name="password-confirm"]', 'nodigits')
        await page.click('button[type="submit"]')

        await expect(page.locator('p.text-red-500').first()).toBeVisible()
        await expect(page.locator('text=/비밀번호는 알파벳과 숫자를 하나 이상 포함해야 해요/i')).toBeVisible()
      })

      test('비밀번호 불일치를 검증한다 (JS)', async ({ page }) => {
        const user = generateTestUser()

        await page.fill('input[name="loginId"]', user.loginId)
        await page.fill('input[name="password"]', user.password)
        await page.fill('input[name="password-confirm"]', 'DifferentPassword123!')
        await page.click('button[type="submit"]')

        await expect(page.locator('[data-sonner-toast]')).toBeVisible()
        await expect(page.locator('text=/비밀번호가 일치하지 않아요/i')).toBeVisible()
      })

      test('비밀번호 최소 길이를 검증한다 (HTML5)', async ({ page }) => {
        const user = generateTestUser()
        const passwordInput = page.locator('input[name="password"]')

        await page.fill('input[name="loginId"]', user.loginId)
        await passwordInput.fill('Pass1')
        await page.fill('input[name="password-confirm"]', 'Pass1')
        await page.click('button[type="submit"]')

        const validationMessage = await passwordInput.evaluate((el: HTMLInputElement) => el.validationMessage)
        expect(validationMessage).toBeTruthy()
      })

      test('비밀번호 최소 길이를 검증한다 (서버)', async ({ page }) => {
        const user = generateTestUser()
        const passwordInput = page.locator('input[name="password"]')

        await page.fill('input[name="loginId"]', user.loginId)

        await passwordInput.evaluate((el: HTMLInputElement) => {
          el.removeAttribute('pattern')
          el.removeAttribute('minLength')
          el.removeAttribute('maxLength')
        })

        await page.locator('input[name="password-confirm"]').evaluate((el: HTMLInputElement) => {
          el.removeAttribute('pattern')
          el.removeAttribute('minLength')
          el.removeAttribute('maxLength')
        })

        await passwordInput.fill('Pass1')
        await page.fill('input[name="password-confirm"]', 'Pass1')

        await page.click('button[type="submit"]')

        await expect(page.locator('p.text-red-500').first()).toBeVisible()
        await expect(page.locator('text=/비밀번호는 최소 8자 이상이어야 해요/i')).toBeVisible()
      })

      test('비밀번호 최대 길이를 검증한다 (HTML5)', async ({ page }) => {
        const user = generateTestUser()
        const passwordInput = page.locator('input[name="password"]')
        const confirmInput = page.locator('input[name="password-confirm"]')
        const longPassword = 'Pass1' + 'a'.repeat(60)
        await page.fill('input[name="loginId"]', user.loginId)
        await passwordInput.fill(longPassword)
        await confirmInput.fill(longPassword)

        const actualPassword = await passwordInput.inputValue()
        const actualConfirm = await confirmInput.inputValue()
        expect(actualPassword.length).toBe(64)
        expect(actualConfirm.length).toBe(64)
        expect(actualPassword).toBe(longPassword.substring(0, 64))
        expect(actualConfirm).toBe(longPassword.substring(0, 64))
      })

      test('비밀번호 최대 길이를 검증한다 (서버)', async ({ page }) => {
        const user = generateTestUser()
        const passwordInput = page.locator('input[name="password"]')
        const confirmInput = page.locator('input[name="password-confirm"]')
        const longPassword = 'Pass1' + 'a'.repeat(60)

        await page.fill('input[name="loginId"]', user.loginId)

        await passwordInput.evaluate((el: HTMLInputElement) => {
          el.removeAttribute('pattern')
          el.removeAttribute('minLength')
          el.removeAttribute('maxLength')
        })

        await confirmInput.evaluate((el: HTMLInputElement) => {
          el.removeAttribute('pattern')
          el.removeAttribute('minLength')
          el.removeAttribute('maxLength')
        })

        await passwordInput.fill(longPassword)
        await confirmInput.fill(longPassword)
        await page.click('button[type="submit"]')

        await expect(page.locator('p.text-red-500').first()).toBeVisible()
        await expect(page.locator('text=/비밀번호는 최대 64자까지 입력할 수 있어요/i')).toBeVisible()
      })

      test('숫자가 없는 비밀번호는 유효하지 않다 (서버)', async ({ page }) => {
        const user = generateTestUser()
        const passwordInput = page.locator('input[name="password"]')

        await page.fill('input[name="loginId"]', user.loginId)

        await passwordInput.evaluate((el: HTMLInputElement) => {
          el.removeAttribute('pattern')
          el.removeAttribute('minLength')
          el.removeAttribute('maxLength')
        })

        await page.locator('input[name="password-confirm"]').evaluate((el: HTMLInputElement) => {
          el.removeAttribute('pattern')
          el.removeAttribute('minLength')
          el.removeAttribute('maxLength')
        })

        await passwordInput.fill('NoDigitsHere')
        await page.fill('input[name="password-confirm"]', 'NoDigitsHere')

        await page.click('button[type="submit"]')

        await expect(page.locator('p.text-red-500').first()).toBeVisible()
        await expect(page.locator('text=/비밀번호는 알파벳과 숫자를 하나 이상 포함해야 해요/i')).toBeVisible()
      })

      test('알파벳이 없는 비밀번호는 유효하지 않다 (서버)', async ({ page }) => {
        const user = generateTestUser()
        const passwordInput = page.locator('input[name="password"]')

        await page.fill('input[name="loginId"]', user.loginId)

        await passwordInput.evaluate((el: HTMLInputElement) => {
          el.removeAttribute('pattern')
          el.removeAttribute('minLength')
          el.removeAttribute('maxLength')
        })

        await page.locator('input[name="password-confirm"]').evaluate((el: HTMLInputElement) => {
          el.removeAttribute('pattern')
          el.removeAttribute('minLength')
          el.removeAttribute('maxLength')
        })

        await passwordInput.fill('12345678')
        await page.fill('input[name="password-confirm"]', '12345678')

        await page.click('button[type="submit"]')

        await expect(page.locator('p.text-red-500').first()).toBeVisible()
        await expect(page.locator('text=/비밀번호는 알파벳과 숫자를 하나 이상 포함해야 해요/i')).toBeVisible()
      })

      test('아이디와 비밀번호가 같을 수 없음을 검증한다 (JS)', async ({ page }) => {
        await page.fill('input[name="loginId"]', 'password123')
        await page.fill('input[name="password"]', 'password123')
        await page.fill('input[name="password-confirm"]', 'password123')

        await page.click('button[type="submit"]')

        await expect(page.locator('[data-sonner-toast]')).toBeVisible()
        await expect(page.locator('text=/아이디와 비밀번호를 다르게 입력해주세요/i')).toBeVisible()
      })
    })

    test.describe('닉네임', () => {
      test('닉네임 최소 길이를 검증한다 (HTML5)', async ({ page }) => {
        const user = generateTestUser()
        const nicknameInput = page.locator('input[name="nickname"]')

        await page.fill('input[name="loginId"]', user.loginId)
        await page.fill('input[name="password"]', user.password)
        await page.fill('input[name="password-confirm"]', user.password)
        await nicknameInput.fill('a')

        await page.click('button[type="submit"]')

        const validationMessage = await nicknameInput.evaluate((el: HTMLInputElement) => el.validationMessage)
        expect(validationMessage).toBeTruthy()
      })

      test('닉네임 최소 길이를 검증한다 (서버)', async ({ page }) => {
        const user = generateTestUser()
        const nicknameInput = page.locator('input[name="nickname"]')

        await page.fill('input[name="loginId"]', user.loginId)
        await page.fill('input[name="password"]', user.password)
        await page.fill('input[name="password-confirm"]', user.password)

        await nicknameInput.evaluate((el: HTMLInputElement) => {
          el.removeAttribute('minLength')
          el.removeAttribute('maxLength')
        })

        await nicknameInput.fill('a')

        await page.click('button[type="submit"]')

        await expect(page.locator('p.text-red-500').first()).toBeVisible()
        await expect(page.locator('text=/닉네임은 최소 2자 이상이어야 해요/i')).toBeVisible()
      })

      test('닉네임 최대 길이를 검증한다 (HTML5)', async ({ page }) => {
        const user = generateTestUser()
        const nicknameInput = page.locator('input[name="nickname"]')
        const longNickname = 'a'.repeat(33)

        await page.fill('input[name="loginId"]', user.loginId)
        await page.fill('input[name="password"]', user.password)
        await page.fill('input[name="password-confirm"]', user.password)
        await nicknameInput.fill(longNickname)

        const actualNickname = await nicknameInput.inputValue()
        expect(actualNickname.length).toBe(32)
        expect(actualNickname).toBe(longNickname.substring(0, 32))
      })

      test('닉네임 최대 길이를 검증한다 (서버)', async ({ page }) => {
        const user = generateTestUser()
        const nicknameInput = page.locator('input[name="nickname"]')
        const longNickname = 'a'.repeat(33)

        await page.fill('input[name="loginId"]', user.loginId)
        await page.fill('input[name="password"]', user.password)
        await page.fill('input[name="password-confirm"]', user.password)

        await nicknameInput.evaluate((el: HTMLInputElement) => {
          el.removeAttribute('minLength')
          el.removeAttribute('maxLength')
        })

        await nicknameInput.fill(longNickname)
        await page.click('button[type="submit"]')

        await expect(page.locator('p.text-red-500').first()).toBeVisible()
        await expect(page.locator('text=/닉네임은 최대 32자까지 입력할 수 있어요/i')).toBeVisible()
      })
    })

    test('중복 회원가입을 방지한다', async ({ page }) => {
      const user = generateTestUser()

      await page.fill('input[name="loginId"]', user.loginId)
      await page.fill('input[name="password"]', user.password)
      await page.fill('input[name="password-confirm"]', user.password)
      await page.click('button[type="submit"]')

      await page.waitForLoadState('networkidle')

      await page.goto('/auth/signup')
      await page.fill('input[name="loginId"]', user.loginId)
      await page.fill('input[name="password"]', user.password)
      await page.fill('input[name="password-confirm"]', user.password)
      await page.click('button[type="submit"]')

      await expect(page.locator('text=/이미 사용 중인 아이디예요/i')).toBeVisible()
    })

    test('유효성 검사 오류 시 폼 데이터를 보존한다', async ({ page }) => {
      const user = generateTestUser()

      await page.fill('input[name="loginId"]', user.loginId)
      await page.fill('input[name="password"]', 'short')
      await page.fill('input[name="password-confirm"]', 'short')
      await page.fill('input[name="nickname"]', user.nickname)

      await page.click('button[type="submit"]')

      await expect(page.locator('input[name="loginId"]')).toHaveValue(user.loginId)
      await expect(page.locator('input[name="nickname"]')).toHaveValue(user.nickname)
      await expect(page.locator('input[name="password"]')).toHaveValue('short')
      await expect(page.locator('input[name="password-confirm"]')).toHaveValue('short')
    })
  })
})
