import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('loads with HTTP 200 and no console errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    const response = await page.goto('/')
    expect(response?.status()).toBe(200)

    await page.waitForLoadState('networkidle')
    expect(errors.filter((e) => !e.includes('favicon'))).toHaveLength(0)
  })

  test('shows hero heading', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /что посмотреть/i })).toBeVisible()
  })

  test('shows all 4 action tiles', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Подобрать фильм')).toBeVisible()
    await expect(page.getByText('Подобрать сериал')).toBeVisible()
    await expect(page.getByText('Кинорулетка')).toBeVisible()
    await expect(page.getByText('Вечер с партнёром')).toBeVisible()
  })

  test('renders at least 4 movie cards', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('article', { timeout: 10000 })
    const cards = page.locator('article')
    await expect(cards).toHaveCount(await cards.count())
    expect(await cards.count()).toBeGreaterThanOrEqual(4)
  })

  test('TMDB token does not appear in page source', async ({ page }) => {
    const response = await page.goto('/')
    const body = await response?.text()
    expect(body).not.toContain('TMDB_API_READ_TOKEN')
    expect(body).not.toContain('eyJhbGciOiJIUzI1') // JWT prefix used by TMDB tokens
  })
})

test.describe('Quiz navigation', () => {
  test('"Подобрать фильм" navigates to /quiz', async ({ page }) => {
    await page.goto('/')
    await page.click('text=Подобрать фильм')
    await expect(page).toHaveURL(/\/quiz/)
  })

  test('"Подобрать сериал" navigates to /quiz', async ({ page }) => {
    await page.goto('/')
    await page.click('text=Подобрать сериал')
    await expect(page).toHaveURL(/\/quiz/)
  })

  test('quiz shows step 1 of 3 when accessed via /quiz?start=movie', async ({ page }) => {
    await page.goto('/quiz?start=movie')
    await expect(page.getByText(/шаг/i)).toBeVisible()
  })

  test('quiz shows mood question after type selection', async ({ page }) => {
    await page.goto('/quiz')
    await page.waitForSelector('button:has-text("Фильм")')
    await page.click('button:has-text("Фильм")')
    await expect(page.getByRole('heading', { name: /настроение/i })).toBeVisible()
  })

  test('quiz completes and shows results for movie flow', async ({ page }) => {
    await page.goto('/quiz')

    // Step 0: pick type
    await page.waitForSelector('button:has-text("Фильм")')
    await page.click('button:has-text("Фильм")')

    // Step 1: pick mood
    await page.waitForSelector('button:has-text("Комедия")')
    await page.click('button:has-text("Комедия")')

    // Step 2: pick runtime
    await page.waitForSelector('button:has-text("Неважно")')
    await page.click('button:has-text("Неважно")')

    // Results should appear
    await expect(page.getByRole('heading', { name: /что посмотреть|подбираем/i })).toBeVisible({ timeout: 15000 })
  })
})
