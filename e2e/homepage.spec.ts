import { expect, test } from '@playwright/test'

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('has correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/litomi/i)
  })

  test('displays navigation links', async ({ page }) => {
    // Check for main navigation elements
    const nav = page.locator('nav')
    await expect(nav).toBeVisible()

    // Check for search functionality
    const searchButton = page.getByRole('button', { name: /search/i })
    await expect(searchButton).toBeVisible()
  })

  test('loads manga cards', async ({ page }) => {
    // Wait for manga cards to load
    await page.waitForSelector('[data-testid="manga-card"]', {
      timeout: 10000,
      state: 'visible',
    })

    // Check that at least one manga card is displayed
    const mangaCards = page.locator('[data-testid="manga-card"]')
    await expect(mangaCards.first()).toBeVisible()
  })

  test('navigates to manga detail page', async ({ page }) => {
    // Wait for and click the first manga card
    await page.waitForSelector('[data-testid="manga-card"]')
    await page.locator('[data-testid="manga-card"]').first().click()

    // Verify navigation to manga detail page
    await expect(page).toHaveURL(/\/manga\/\d+\//i)
  })

  test('responsive design works', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Mobile menu should be visible
    const mobileMenu = page.getByRole('button', { name: /menu/i })
    await expect(mobileMenu).toBeVisible()

    // Test desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 })

    // Desktop navigation should be visible
    const desktopNav = page.locator('nav')
    await expect(desktopNav).toBeVisible()
  })
})
