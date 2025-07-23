import { expect, test } from '@playwright/test'

import { isSafariLocalhost } from '../utils/safari'
import { generateTestUser } from '../utils/user'

test.describe('/auth/login', () => {
  const user = generateTestUser()

  // 테스트 유저 생성
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    await page.goto('/auth/signup')
    await expect(page.locator('label[for="loginId"]')).toContainText('아이디')

    await page.fill('input[name="loginId"]', user.loginId)
    await page.fill('input[name="password"]', user.password)
    await page.fill('input[name="password-confirm"]', user.password)
    await page.fill('input[name="nickname"]', user.nickname)

    await Promise.all([
      page.waitForURL((url) => url.pathname === '/', { timeout: 10000 }),
      page.click('button[type="submit"]'),
    ])
  })

  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page.locator('label[for="loginId"]')).toContainText('아이디')
  })

  test.describe('로그인 성공', () => {
    test('유효한 자격 증명으로 로그인한다', async ({ page, context, browserName }) => {
      await page.fill('input[name="loginId"]', user.loginId)
      await page.fill('input[name="password"]', user.password)

      await Promise.all([
        page.waitForURL((url) => url.pathname === '/', { timeout: 10000 }),
        page.click('button[type="submit"]'),
      ])

      await expect(page.locator('[data-sonner-toast]')).toBeVisible()
      await expect(page.locator(`text=/${user.loginId} 계정으로 로그인했어요/i`)).toBeVisible()

      const currentUrl = page.url()
      expect(currentUrl.endsWith('/')).toBeTruthy()

      if (isSafariLocalhost(browserName, page.url())) {
        return
      }

      const cookies = await context.cookies()
      const accessToken = cookies.find((cookie) => cookie.name === 'at')
      expect(accessToken).toBeTruthy()
      expect(accessToken?.httpOnly).toBe(true)
      expect(accessToken?.sameSite).toBe('Lax')
    })

    test('로그인 상태 유지 옵션을 처리한다', async ({ page, context, browserName }) => {
      await page.fill('input[name="loginId"]', user.loginId)
      await page.fill('input[name="password"]', user.password)
      await page.click('label:has(input[name="remember"])')

      await Promise.all([
        page.waitForURL((url) => url.pathname === '/', { timeout: 10000 }),
        page.click('button[type="submit"]'),
      ])

      if (isSafariLocalhost(browserName, page.url())) {
        return
      }

      const cookies = await context.cookies()
      const refreshToken = cookies.find((cookie) => cookie.name === 'rt')
      expect(refreshToken).toBeTruthy()
      expect(refreshToken?.httpOnly).toBe(true)
      expect(refreshToken?.sameSite).toBe('Lax')
    })

    test('리다이렉트 파라미터를 처리한다', async ({ page }) => {
      const targetPath = '/mangas/latest/1/hi/card'
      await page.goto(`/auth/login?redirect=${encodeURIComponent(targetPath)}`)
      await page.fill('input[name="loginId"]', user.loginId)
      await page.fill('input[name="password"]', user.password)

      await Promise.all([
        page.waitForURL((url) => url.pathname === targetPath, { timeout: 10000 }),
        page.click('button[type="submit"]'),
      ])

      expect(page.url()).toContain(targetPath)
    })

    test('사용자별 리다이렉트를 처리한다', async ({ page }) => {
      await page.goto(`/auth/login?redirect=/@/bookmark`)
      await page.fill('input[name="loginId"]', user.loginId)
      await page.fill('input[name="password"]', user.password)

      await Promise.all([
        page.waitForURL((url) => url.pathname.includes(`/@${user.loginId}/bookmark`), { timeout: 10000 }),
        page.click('button[type="submit"]'),
      ])

      expect(page.url()).toContain(`/@${user.loginId}/bookmark`)
    })

    test('로그인 후 인증된 상태를 유지한다', async ({ page, browserName }) => {
      await page.fill('input[name="loginId"]', user.loginId)
      await page.fill('input[name="password"]', user.password)
      await page.click('button[type="submit"]')
      await page.waitForURL((url) => url.pathname === '/')

      await page.goto(`/@${user.loginId}/bookmark`)
      expect(page.url()).toContain('/bookmark')

      if (isSafariLocalhost(browserName, page.url())) {
        return
      }

      await expect(page.locator('text=/로그인하고 시작하기/i')).not.toBeVisible()
    })
  })

  test.describe('로그인 실패', () => {
    test('잘못된 아이디로 로그인하면 로그인 실패 메시지를 표시한다', async ({ page }) => {
      await page.fill('input[name="loginId"]', 'nonexistentuser123')
      await page.fill('input[name="password"]', 'TestPassword123!')
      await page.click('button[type="submit"]')

      await expect(page.locator('[data-sonner-toast]')).toBeVisible()
      await expect(page.locator('text=/아이디 또는 비밀번호가 일치하지 않습니다/i')).toBeVisible()
    })

    test('아이디 유효성을 검사한다 (HTML5)', async ({ page }) => {
      const loginIdInput = page.locator('input[name="loginId"]')

      await loginIdInput.fill('a')
      await page.fill('input[name="password"]', 'ValidPass123')
      await page.click('button[type="submit"]')

      const validationMessage = await loginIdInput.evaluate((el: HTMLInputElement) => el.validationMessage)
      expect(validationMessage).toBeTruthy()
    })

    test('아이디 유효성을 검사한다 (서버)', async ({ page }) => {
      const loginIdInput = page.locator('input[name="loginId"]')
      await loginIdInput.fill('a')
      await page.fill('input[name="password"]', 'ValidPass123')

      await loginIdInput.evaluate((el: HTMLInputElement) => {
        el.removeAttribute('pattern')
        el.removeAttribute('minLength')
      })

      await page.click('button[type="submit"]')

      await expect(page.locator('[data-sonner-toast]')).toBeVisible()
      await expect(page.locator('text=/아이디는 최소 2자 이상이어야 합니다/i')).toBeVisible()
    })

    test('비밀번호 유효성을 검사한다 (HTML5)', async ({ page }) => {
      const passwordInput = page.locator('input[name="password"]')
      await page.fill('input[name="loginId"]', 'validuser')
      await passwordInput.fill('short')
      await page.click('button[type="submit"]')

      const validationMessage = await passwordInput.evaluate((el: HTMLInputElement) => el.validationMessage)
      expect(validationMessage).toBeTruthy()
    })

    test('비밀번호 유효성을 검사한다 (서버)', async ({ page }) => {
      const passwordInput = page.locator('input[name="password"]')
      await page.fill('input[name="loginId"]', 'validuser')
      await passwordInput.fill('nodigits')

      await passwordInput.evaluate((el: HTMLInputElement) => {
        el.removeAttribute('pattern')
        el.removeAttribute('minLength')
      })

      await page.click('button[type="submit"]')

      await expect(page.locator('[data-sonner-toast]')).toBeVisible()
      await expect(page.locator('text=/알파벳과 숫자를 하나 이상 포함해야 합니다/i')).toBeVisible()
    })

    test('빈 필드 제출을 방지한다', async ({ page }) => {
      await page.click('button[type="submit"]')

      const loginIdInput = page.locator('input[name="loginId"]')
      const validationMessage = await loginIdInput.evaluate((el: HTMLInputElement) => el.validationMessage)
      expect(validationMessage).toBeTruthy()
    })
  })

  test.describe('UI/UX 테스트', () => {
    test('X 버튼으로 입력 필드를 초기화한다', async ({ page }) => {
      await page.fill('input[name="loginId"]', 'testuser')
      await page.fill('input[name="password"]', 'testpassword')

      await page.click('input[name="loginId"] ~ button')
      await expect(page.locator('input[name="loginId"]')).toHaveValue('')

      await page.click('input[name="password"] ~ button')
      await expect(page.locator('input[name="password"]')).toHaveValue('')
    })

    test('제출 중 폼을 비활성화한다', async ({ page }) => {
      await page.fill('input[name="loginId"]', user.loginId)
      await page.fill('input[name="password"]', user.password)

      await page.route('**/auth/login', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 2000))
        await route.continue()
      })

      const submitPromise = page.click('button[type="submit"]')

      await expect(page.locator('input[name="loginId"]')).toBeDisabled({ timeout: 1000 })
      await expect(page.locator('input[name="password"]')).toBeDisabled({ timeout: 1000 })
      await expect(page.locator('input[name="remember"]')).toBeDisabled({ timeout: 1000 })
      await expect(page.locator('button[type="submit"]')).toBeDisabled({ timeout: 1000 })

      await expect(page.locator('button[type="submit"] .text-zinc-500')).toBeVisible({ timeout: 1000 })

      await submitPromise
      await page.unroute('**/auth/login')
    })

    test('회원가입 링크로 이동한다', async ({ page }) => {
      await page.click('text=/회원가입/i')
      await expect(page).toHaveURL('/auth/signup')
    })

    test('자동 완성 속성이 올바르게 설정된다', async ({ page }) => {
      await expect(page.locator('input[name="loginId"]')).toHaveAttribute('autoCapitalize', 'off')
    })
  })

  test.describe('접근성', () => {
    test('적절한 폼 레이블을 가진다', async ({ page }) => {
      const loginIdInput = page.locator('input[name="loginId"]')
      const passwordInput = page.locator('input[name="password"]')
      const rememberCheckbox = page.locator('input[name="remember"]')

      await expect(loginIdInput).toHaveAttribute('id', 'loginId')
      await expect(passwordInput).toHaveAttribute('id', 'password')
      await expect(rememberCheckbox).toHaveAttribute('id', 'remember')

      await expect(page.locator('label[for="loginId"]')).toBeVisible()
      await expect(page.locator('label[for="password"]')).toBeVisible()
      await expect(page.locator('label[for="remember"]')).toBeVisible()
    })

    test('키보드로 폼을 탐색할 수 있다', async ({ page, isMobile }) => {
      test.skip(isMobile, '모바일 환경에서는 Tab 키가 없어 키보드 탐색 테스트를 건너뜁니다')

      await page.waitForLoadState('networkidle')

      const loginIdInput = page.locator('input[name="loginId"]')
      await loginIdInput.focus()
      await expect(loginIdInput).toBeFocused()

      let fieldFocused = false
      const field = page.locator('input[name="password"]')

      for (let attempt = 0; attempt < 5; attempt++) {
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
    })

    test('적절한 ARIA 속성을 가진다', async ({ page }) => {
      await page.fill('input[name="loginId"]', 'a')
      await page.fill('input[name="password"]', 'short')

      await page.locator('input[name="loginId"]').evaluate((el: HTMLInputElement) => {
        el.removeAttribute('pattern')
        el.removeAttribute('minLength')
      })

      await page.locator('input[name="password"]').evaluate((el: HTMLInputElement) => {
        el.removeAttribute('pattern')
        el.removeAttribute('minLength')
      })

      await page.click('button[type="submit"]')

      await expect(page.locator('[data-sonner-toast]')).toBeVisible()
      await expect(page.locator('input[name="loginId"]')).toHaveAttribute('aria-invalid', 'true')
      await expect(page.locator('input[name="password"]')).toHaveAttribute('aria-invalid', 'true')
    })

    test('비밀번호 필드가 마스킹된다', async ({ page }) => {
      await expect(page.locator('input[name="password"]')).toHaveAttribute('type', 'password')
    })
  })
})
