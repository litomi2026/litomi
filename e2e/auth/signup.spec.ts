import { expect, test } from '@playwright/test'

import { generateTestUser } from '../utils/user'

test.describe('/auth/signup', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signup')
    await expect(page.locator('label[for="loginId"]')).toContainText('아이디')
  })

  test.describe('회원가입 성공', () => {
    test('회원가입 플로우를 완료하고 사용자를 생성한다', async ({ page }) => {
      const user = generateTestUser()

      await page.fill('input[name="loginId"]', user.loginId)
      await page.fill('input[name="password"]', user.password)
      await page.fill('input[name="password-confirm"]', user.password)
      await page.fill('input[name="nickname"]', user.nickname)

      await Promise.all([
        page.waitForURL((url) => url.pathname === '/', { timeout: 10000 }),
        page.click('button[type="submit"]'),
      ])

      await expect(page.locator('[data-sonner-toast]')).toBeVisible()
      await expect(page.locator('text=/계정으로 가입했어요/i')).toBeVisible()

      const currentUrl = page.url()
      expect(currentUrl.endsWith('/')).toBeTruthy()
    })

    test('선택적 닉네임 필드를 처리한다', async ({ page }) => {
      const user = generateTestUser()

      await page.fill('input[name="loginId"]', user.loginId)
      await page.fill('input[name="password"]', user.password)
      await page.fill('input[name="password-confirm"]', user.password)

      await Promise.all([
        page.waitForURL((url) => url.pathname === '/', { timeout: 10000 }),
        page.click('button[type="submit"]'),
      ])

      const currentUrl = page.url()
      expect(currentUrl.endsWith('/')).toBeTruthy()
    })
  })

  test.describe('회원가입 실패', () => {
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
      await loginIdInput.fill('a')
      await page.fill('input[name="password"]', 'ValidPass123')
      await page.fill('input[name="password-confirm"]', 'ValidPass123')

      await loginIdInput.evaluate((el: HTMLInputElement) => {
        el.removeAttribute('pattern')
        el.removeAttribute('minLength')
      })

      await page.click('button[type="submit"]')

      await expect(page.locator('[data-sonner-toast]')).toBeVisible()
      await expect(page.locator('text=/아이디는 최소 2자 이상이어야 합니다/i')).toBeVisible()
    })

    test('비밀번호 불일치를 검증한다', async ({ page }) => {
      const user = generateTestUser()

      await page.fill('input[name="loginId"]', user.loginId)
      await page.fill('input[name="password"]', user.password)
      await page.fill('input[name="password-confirm"]', 'DifferentPassword123!')
      await page.click('button[type="submit"]')

      await expect(page.locator('[data-sonner-toast]')).toBeVisible()
      await expect(page.locator('text=/비밀번호가 일치하지 않습니다/i')).toBeVisible()
    })

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
      await passwordInput.fill('nodigits')
      await page.fill('input[name="password-confirm"]', 'nodigits')

      await passwordInput.evaluate((el: HTMLInputElement) => {
        el.removeAttribute('pattern')
        el.removeAttribute('minLength')
      })

      await page.locator('input[name="password-confirm"]').evaluate((el: HTMLInputElement) => {
        el.removeAttribute('pattern')
        el.removeAttribute('minLength')
      })

      await page.click('button[type="submit"]')

      await expect(page.locator('[data-sonner-toast]')).toBeVisible()
      await expect(page.locator('text=/알파벳과 숫자를 하나 이상 포함해야 합니다/i')).toBeVisible()
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

      await expect(page.locator('text=/이미 사용 중인 아이디입니다/i')).toBeVisible()
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

  test.describe('UI/UX 테스트', () => {
    test('비밀번호 토글 기능을 표시한다 (기능 개발 중)', async ({ page }) => {
      await expect(page.locator('input[name="password"]')).toHaveAttribute('type', 'password')
      await expect(page.locator('input[name="password-confirm"]')).toHaveAttribute('type', 'password')
    })

    test('제출 중 폼을 비활성화한다', async ({ page }) => {
      const user = generateTestUser()

      await page.fill('input[name="loginId"]', user.loginId)
      await page.fill('input[name="password"]', user.password)
      await page.fill('input[name="password-confirm"]', user.password)

      // NOTE: disabled 상태를 온전히 확인하기 위해 인위적으로 지연시간을 추가함
      await page.route('**/auth/signup', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 2000))
        await route.continue()
      })

      const submitPromise = page.click('button[type="submit"]')

      await expect(page.locator('input[name="loginId"]')).toBeDisabled({ timeout: 1000 })
      await expect(page.locator('input[name="password"]')).toBeDisabled({ timeout: 1000 })
      await expect(page.locator('input[name="password-confirm"]')).toBeDisabled({ timeout: 1000 })
      await expect(page.locator('input[name="nickname"]')).toBeDisabled({ timeout: 1000 })
      await expect(page.locator('button[type="submit"]')).toBeDisabled({ timeout: 1000 })

      await submitPromise
      await page.unroute('**/auth/signup')
    })

    test('로그인 페이지로 이동한다', async ({ page }) => {
      await page.click('text=/로그인/i')
      await expect(page).toHaveURL('/auth/login')
    })

    test('이용약관 페이지로 이동한다', async ({ page }) => {
      await page.click('text=/이용약관/i')
      await expect(page).toHaveURL('/doc/terms')
    })

    test('개인정보처리방침 페이지로 이동한다', async ({ page }) => {
      await page.click('text=/개인정보처리방침/i')
      await expect(page).toHaveURL('/doc/privacy')
    })
  })

  test.describe('접근성', () => {
    test('적절한 폼 레이블을 가진다', async ({ page }) => {
      const loginIdInput = page.locator('input[name="loginId"]')
      const passwordInput = page.locator('input[name="password"]')
      const confirmInput = page.locator('input[name="password-confirm"]')

      await expect(loginIdInput).toHaveAttribute('id', 'loginId')
      await expect(passwordInput).toHaveAttribute('id', 'password')
      await expect(confirmInput).toHaveAttribute('id', 'password-confirm')

      await expect(page.locator('label[for="loginId"]')).toBeVisible()
      await expect(page.locator('label[for="password"]')).toBeVisible()
      await expect(page.locator('label[for="password-confirm"]')).toBeVisible()
      await expect(page.locator('label[for="nickname"]')).toBeVisible()
    })

    test('입력창을 키보드로 탐색할 수 있다', async ({ page, isMobile }) => {
      test.skip(isMobile, '모바일 환경에서는 Tab 키가 없어 키보드 탐색 테스트를 건너뜁니다')

      await page.waitForLoadState('networkidle')

      const loginIdInput = page.locator('input[name="loginId"]')
      await loginIdInput.focus()
      await expect(loginIdInput).toBeFocused()

      const formFields = ['input[name="password"]', 'input[name="password-confirm"]', 'input[name="nickname"]']
      const maxTabAttempts = 5

      for (const fieldSelector of formFields) {
        let fieldFocused = false
        const field = page.locator(fieldSelector)

        for (let attempt = 0; attempt < maxTabAttempts; attempt++) {
          await page.keyboard.press('Tab')
          await page.waitForTimeout(100)

          const isFocused = await field.evaluate((el) => el === document.activeElement)

          if (isFocused) {
            fieldFocused = true
            await expect(field).toBeFocused()
            break
          }
        }

        expect(fieldFocused).toBeTruthy()
      }
    })
  })
})
