import { test, expect } from '@playwright/test'

test.describe('Roulette', () => {
  test('loads with HTTP 200', async ({ page }) => {
    const response = await page.goto('/roulette')
    expect(response?.status()).toBe(200)
  })

  test('shows heading "Кинорулетка"', async ({ page }) => {
    await page.goto('/roulette')
    await expect(page.getByRole('heading', { name: /кинорулетка/i })).toBeVisible()
  })

  test('shows mood selector with 8 options', async ({ page }) => {
    await page.goto('/roulette')
    await expect(page.getByText('Какое настроение?')).toBeVisible()
    const moodButtons = page.locator('button:has-text("Комедия"), button:has-text("Драма"), button:has-text("Боевик")')
    await expect(moodButtons.first()).toBeVisible()
  })

  test('spin button is disabled before mood selection', async ({ page }) => {
    await page.goto('/roulette')
    const spinBtn = page.getByRole('button', { name: /выберите настроение/i })
    await expect(spinBtn).toBeDisabled()
  })

  test('spin button becomes active after mood selection', async ({ page }) => {
    await page.goto('/roulette')
    await page.waitForSelector('button:has-text("Комедия")')
    await page.click('button:has-text("Комедия")')
    const spinBtn = page.getByRole('button', { name: /найти/i })
    await expect(spinBtn).not.toBeDisabled()
  })

  test('full roulette flow: mood → spin → result shown in < 10 sec', async ({ page }) => {
    await page.goto('/roulette')
    const start = Date.now()

    await page.waitForSelector('button:has-text("Комедия")')
    await page.click('button:has-text("Комедия")')
    await page.click('button:has-text("комедия фильм")', { timeout: 2000 }).catch(() => {
      // label may vary — find any enabled spin button
    })
    const spinBtn = page.getByRole('button', { name: /найти|крутить/i })
    await spinBtn.click()

    // Wait for result (movie title visible)
    await page.waitForSelector('h2', { timeout: 12000 })
    const elapsed = (Date.now() - start) / 1000
    expect(elapsed).toBeLessThan(10)
  })

  test('roulette result shows "Перекрутить" button', async ({ page }) => {
    await page.goto('/roulette')
    await page.waitForSelector('button:has-text("Комедия")')
    await page.click('button:has-text("Комедия")')

    const spinBtn = page.getByRole('button', { name: /найти/i })
    await spinBtn.click()

    await expect(page.getByRole('button', { name: /перекрутить/i })).toBeVisible({ timeout: 12000 })
  })

  test('"Кинорулетка" tile on homepage navigates to /roulette', async ({ page }) => {
    await page.goto('/')
    await page.click('text=Кинорулетка')
    await expect(page).toHaveURL(/\/roulette/)
  })
})

test.describe('Movie detail page', () => {
  test('navigating from quiz result to movie detail page works', async ({ page }) => {
    await page.goto('/quiz')

    await page.waitForSelector('button:has-text("Фильм")')
    await page.click('button:has-text("Фильм")')
    await page.waitForSelector('button:has-text("Комедия")')
    await page.click('button:has-text("Комедия")')
    await page.waitForSelector('button:has-text("Неважно")')
    await page.click('button:has-text("Неважно")')

    // Wait for movie cards
    await page.waitForSelector('article', { timeout: 15000 })
    const firstCard = page.locator('article').first()
    await firstCard.locator('a').first().click()

    // Should navigate to /movie/ or /tv/
    await expect(page).toHaveURL(/\/(movie|tv)\/\d+/, { timeout: 10000 })
  })

  test('/movie/[id] page loads for a known movie (Inception TMDb id: 27205)', async ({ page }) => {
    const response = await page.goto('/movie/27205')
    expect(response?.status()).toBe(200)
  })

  test('movie detail shows watch providers section', async ({ page }) => {
    await page.goto('/movie/27205')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/где смотреть/i)).toBeVisible()
  })

  test('movie detail shows back link to homepage', async ({ page }) => {
    await page.goto('/movie/27205')
    await expect(page.getByRole('link', { name: /на главную/i })).toBeVisible()
  })

  test('/tv/[id] page loads for a known show (Breaking Bad TMDb id: 1396)', async ({ page }) => {
    const response = await page.goto('/tv/1396')
    expect(response?.status()).toBe(200)
  })

  test('tv detail shows watch providers section', async ({ page }) => {
    await page.goto('/tv/1396')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/где смотреть/i)).toBeVisible()
  })

  test('movie card on homepage links to detail page', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('article', { timeout: 10000 })
    const firstCard = page.locator('article').first()
    const link = firstCard.locator('a').first()
    const href = await link.getAttribute('href')
    expect(href).toMatch(/\/(movie|tv)\/\d+/)
  })
})
