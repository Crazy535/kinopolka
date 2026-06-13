import { test, expect } from '@playwright/test'

test.describe('Auth UI (unauthenticated)', () => {
  test('header shows "Войти" link for anonymous user', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: /войти/i })).toBeVisible()
  })

  test('homepage does not show personal feed for anonymous user', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Для тебя')).not.toBeVisible()
  })

  test('/profile redirects anonymous user to /', async ({ page }) => {
    await page.goto('/profile')
    await expect(page).toHaveURL('/')
  })

  test('/watchlist redirects anonymous user to /', async ({ page }) => {
    await page.goto('/watchlist')
    await expect(page).toHaveURL('/')
  })
})

test.describe('Auth API', () => {
  test('/api/auth/providers returns JSON with credentials provider', async ({ page }) => {
    const res = await page.request.get('/api/auth/providers')
    expect(res.status()).toBe(200)
    const json = await res.json()
    expect(json).toHaveProperty('credentials')
    expect(json.credentials.id).toBe('credentials')
  })

  test('/api/auth/session returns empty session for anonymous', async ({ page }) => {
    const res = await page.request.get('/api/auth/session')
    expect(res.status()).toBe(200)
    const json = await res.json()
    // Unauthenticated: session is null or object without user
    const hasUser = json != null && typeof json === 'object' && 'user' in json && json.user?.email
    expect(hasUser).toBeFalsy()
  })

  test('/api/recommendations/level2 returns 401 for anonymous', async ({ page }) => {
    const res = await page.request.get('/api/recommendations/level2')
    expect(res.status()).toBe(401)
  })
})

test.describe('Onboarding page', () => {
  test('/onboarding redirects anonymous user to /', async ({ page }) => {
    await page.goto('/onboarding')
    await expect(page).toHaveURL('/')
  })
})

test.describe('Homepage auth-aware sections', () => {
  test('shows trending section regardless of auth state', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /в тренде сейчас/i })).toBeVisible()
  })

  test('trending section has at least 4 cards', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('article', { timeout: 10000 })
    const cards = page.locator('article')
    expect(await cards.count()).toBeGreaterThanOrEqual(4)
  })

  test('no AUTH_SECRET or google credentials in page source', async ({ page }) => {
    const response = await page.goto('/')
    const body = await response?.text()
    expect(body).not.toContain('AUTH_SECRET')
    expect(body).not.toContain('GOCSPX-')
    expect(body).not.toContain('AUTH_GOOGLE')
  })
})
