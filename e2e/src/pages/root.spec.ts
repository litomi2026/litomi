import { expect, test } from '@playwright/test'

test.describe('/', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('올바른 제목을 가지고 있다', async ({ page }) => {
    await expect(page).toHaveTitle(/리토미/i)
  })

  test('연령 확인 페이지를 표시한다', async ({ page }) => {
    const ageVerificationText = page.locator('text=/19세 미만의 청소년이 이용할 수 없습니다/i')
    await expect(ageVerificationText).toBeVisible()

    const adultButton = page.getByRole('link', { name: '19세 이상 성인입니다' })
    await expect(adultButton).toBeVisible()

    const exitButton = page.getByRole('link', { name: '19세 미만 나가기' })
    await expect(exitButton).toBeVisible()
  })

  test('연령 확인 후 만화 목록으로 이동한다', async ({ page }) => {
    await page.getByRole('link', { name: '19세 이상 성인입니다' }).click()
    await expect(page).toHaveURL(/\/mangas\/1\/hi\/card/i)

    const nav = page.locator('header nav')
    await expect(nav).toBeVisible()

    const searchLink = page.getByRole('link', { name: /검색/i })
    await expect(searchLink).toHaveAttribute('href', '/search')
  })

  test('연령 확인에 실패하면 제한 페이지로 이동한다', async ({ page }) => {
    await page.getByRole('link', { name: '19세 미만 나가기' }).click()
    await expect(page).toHaveURL(/\/deterrence/i)

    const deterrenceText = page.locator('text=/본 웹사이트는 19세 이상의 성인 사용자만을 대상으로 합니다./i')
    await expect(deterrenceText).toBeVisible()
  })
})
