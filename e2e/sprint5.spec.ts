import { test, expect } from '@playwright/test'

// ─── API routes ───────────────────────────────────────────────────────────────

test.describe('Watchlist API', () => {
  test('/api/watchlist/status returns inWatchlist: false for anonymous', async ({ page }) => {
    const res = await page.request.get('/api/watchlist/status?tmdbId=550&mediaType=movie')
    expect(res.status()).toBe(200)
    const json = await res.json()
    expect(json.inWatchlist).toBe(false)
  })

  test('/api/watchlist/status returns 200 even without params', async ({ page }) => {
    const res = await page.request.get('/api/watchlist/status')
    expect(res.status()).toBe(200)
    const json = await res.json()
    expect(json).toHaveProperty('inWatchlist')
  })
})

test.describe('Ratings API', () => {
  test('/api/ratings/mine returns score: null for anonymous', async ({ page }) => {
    const res = await page.request.get('/api/ratings/mine?tmdbId=550&mediaType=movie')
    expect(res.status()).toBe(200)
    const json = await res.json()
    expect(json.score).toBeNull()
  })

  test('/api/ratings/mine returns 200 even without params', async ({ page }) => {
    const res = await page.request.get('/api/ratings/mine')
    expect(res.status()).toBe(200)
    const json = await res.json()
    expect(json).toHaveProperty('score')
  })
})

// ─── Movie detail page ────────────────────────────────────────────────────────

test.describe('Movie detail page (Sprint 5 additions)', () => {
  test('/movie/[id] renders WatchlistButton', async ({ page }) => {
    await page.goto('/movie/550')
    // Button loads async (client component), wait for it
    await expect(
      page.getByRole('button', { name: /в вотчлист/i })
    ).toBeVisible({ timeout: 10000 })
  })

  test('/movie/[id] renders StarRating stars', async ({ page }) => {
    await page.goto('/movie/550')
    await expect(page.getByText('Ваша оценка')).toBeVisible({ timeout: 10000 })
  })

  test('/movie/[id] WatchlistButton becomes enabled after load', async ({ page }) => {
    await page.goto('/movie/550')
    const btn = page.getByRole('button', { name: /в вотчлист|в вотчлисте/i })
    await expect(btn).toBeVisible({ timeout: 10000 })
    await expect(btn).toBeEnabled({ timeout: 10000 })
  })
})

// ─── TV detail page ───────────────────────────────────────────────────────────

test.describe('TV detail page (Sprint 5 additions)', () => {
  test('/tv/[id] renders WatchlistButton', async ({ page }) => {
    await page.goto('/tv/1396')
    await expect(
      page.getByRole('button', { name: /в вотчлист/i })
    ).toBeVisible({ timeout: 10000 })
  })

  test('/tv/[id] renders StarRating stars', async ({ page }) => {
    await page.goto('/tv/1396')
    await expect(page.getByText('Ваша оценка')).toBeVisible({ timeout: 10000 })
  })
})

// ─── Watchlist page ───────────────────────────────────────────────────────────

test.describe('Watchlist page', () => {
  test('/watchlist redirects anonymous to /', async ({ page }) => {
    await page.goto('/watchlist')
    await expect(page).toHaveURL('/')
  })
})

// ─── Profile page ─────────────────────────────────────────────────────────────

test.describe('Profile page', () => {
  test('/profile redirects anonymous to /', async ({ page }) => {
    await page.goto('/profile')
    await expect(page).toHaveURL('/')
  })
})

// ─── UserMenu ─────────────────────────────────────────────────────────────────

test.describe('UserMenu', () => {
  test('Войти button is visible to anonymous user', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('button', { name: /войти/i })).toBeVisible()
  })
})

// ─── Regression: previously green pages ──────────────────────────────────────

test.describe('Regression — Sprint 5', () => {
  test('homepage loads without errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    expect(errors.filter((e) => !e.includes('ResizeObserver'))).toHaveLength(0)
  })

  test('/quiz page loads', async ({ page }) => {
    await page.goto('/quiz')
    await expect(page.getByRole('heading')).toBeVisible({ timeout: 8000 })
  })

  test('/roulette page loads', async ({ page }) => {
    await page.goto('/roulette')
    await expect(page.getByRole('heading', { name: /кинорулетка/i })).toBeVisible({ timeout: 8000 })
  })
})
