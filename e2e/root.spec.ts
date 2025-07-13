import { expect, test } from '@playwright/test'

test.describe('/', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('올바른 제목을 가지고 있다', async ({ page }) => {
    await expect(page).toHaveTitle(/litomi/i)
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
    await expect(page).toHaveURL(/\/mangas\/latest\/1\/hi\/card/i)

    const nav = page.locator('header nav')
    await expect(nav).toBeVisible()

    const searchLink = page.getByRole('link', { name: /검색/i })
    await expect(searchLink).toHaveAttribute('href', '/search')
  })
})
