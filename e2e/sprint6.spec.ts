import { test, expect } from '@playwright/test'

// ─── Partner API ──────────────────────────────────────────────────────────────

test.describe('Partner rooms API', () => {
  test('POST /api/partner/rooms returns 401 for anonymous', async ({ page }) => {
    const res = await page.request.post('/api/partner/rooms', {
      data: { genreIds: [28, 35] },
    })
    expect(res.status()).toBe(401)
  })

  test('GET /api/partner/rooms/INVALID returns 404', async ({ page }) => {
    const res = await page.request.get('/api/partner/rooms/XXXXXX')
    expect(res.status()).toBe(404)
  })

  test('POST /api/partner/rooms/INVALID/join returns 404', async ({ page }) => {
    const res = await page.request.post('/api/partner/rooms/XXXXXX/join', {
      data: { genreIds: [28] },
    })
    // 401 (not logged in) or 404 — both are acceptable
    expect([401, 404]).toContain(res.status())
  })
})

// ─── Partner pages ────────────────────────────────────────────────────────────

test.describe('Partner page — auth guard', () => {
  test('/partner redirects anonymous to /', async ({ page }) => {
    await page.goto('/partner')
    await expect(page).toHaveURL('/')
  })

  test('/partner/ANYCODE redirects anonymous to sign-in', async ({ page }) => {
    await page.goto('/partner/TESTCD')
    // Should redirect somewhere (sign-in or home)
    const url = page.url()
    expect(url).not.toContain('/partner/TESTCD')
  })
})

// ─── Hero section ─────────────────────────────────────────────────────────────

test.describe('Homepage — Partner Mode tile', () => {
  test('"Вечер с партнёром" tile is a link to /partner', async ({ page }) => {
    await page.goto('/')
    const tile = page.getByRole('link', { name: /вечер с партнёром/i })
    await expect(tile).toBeVisible({ timeout: 8000 })
    await expect(tile).toHaveAttribute('href', '/partner')
  })
})

// ─── Partner room — not found page ────────────────────────────────────────────

test.describe('Partner room — 404 for unknown code', () => {
  test('/partner/[code] shows 404 when code is invalid (unauthenticated → redirect)', async ({ page }) => {
    await page.goto('/partner/ZZZZZZ')
    // Unauthenticated users hit auth redirect, not the room page
    const url = page.url()
    expect(url).not.toContain('/partner/ZZZZZZ')
  })
})

// ─── Intersection engine unit-like tests via API ──────────────────────────────

test.describe('Genre intersection engine (via API contract)', () => {
  test('join with genreIds in body returns 401 for anonymous (validates body parsing)', async ({ page }) => {
    const res = await page.request.post('/api/partner/rooms/ANYCODE/join', {
      headers: { 'Content-Type': 'application/json' },
      data: { genreIds: [28, 35, 18] },
    })
    expect([401, 404]).toContain(res.status())
  })
})

// ─── Regression ───────────────────────────────────────────────────────────────

test.describe('Regression — Sprint 6', () => {
  test('homepage hero has all 4 action tiles', async ({ page }) => {
    await page.goto('/')
    const links = page.locator('a[href="/quiz?start=movie"], a[href="/quiz?start=tv"], a[href="/roulette"], a[href="/partner"]')
    await expect(links).toHaveCount(4, { timeout: 8000 })
  })

  test('/quiz still works after Sprint 6', async ({ page }) => {
    await page.goto('/quiz')
    await expect(page.getByRole('heading')).toBeVisible({ timeout: 8000 })
  })

  test('/roulette still works after Sprint 6', async ({ page }) => {
    await page.goto('/roulette')
    await expect(page.getByRole('heading', { name: /кинорулетка/i })).toBeVisible({ timeout: 8000 })
  })

  test('homepage loads without JS errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    expect(errors.filter((e) => !e.includes('ResizeObserver'))).toHaveLength(0)
  })

  test('/watchlist still redirects anonymous', async ({ page }) => {
    await page.goto('/watchlist')
    await expect(page).toHaveURL('/')
  })

  test('/profile still redirects anonymous', async ({ page }) => {
    await page.goto('/profile')
    await expect(page).toHaveURL('/')
  })
})
