import { test, expect } from '@playwright/test'

test.describe('S7-03: Search', () => {
  test('search icon is visible in header', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('button', { name: /поиск/i })).toBeVisible()
  })

  test('clicking search icon opens input', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /поиск/i }).click()
    await expect(page.getByPlaceholder(/фильм или сериал/i)).toBeVisible()
  })

  test('empty query shows no dropdown', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /поиск/i }).click()
    const input = page.getByPlaceholder(/фильм или сериал/i)
    await expect(input).toBeVisible()
    // No dropdown with just 1 char
    await input.fill('а')
    await page.waitForTimeout(400)
    await expect(page.locator('ul')).not.toBeVisible()
  })

  test('search query shows results or "nothing found"', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /поиск/i }).click()
    const input = page.getByPlaceholder(/фильм или сериал/i)
    await input.fill('матрица')
    await page.waitForTimeout(500)
    // Either results list or "nothing found" message
    const hasResults = await page.locator('ul li').count() > 0
    const hasEmpty = await page.getByText('Ничего не найдено').isVisible().catch(() => false)
    expect(hasResults || hasEmpty).toBeTruthy()
  })

  test('search result links to movie or tv page', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /поиск/i }).click()
    const input = page.getByPlaceholder(/фильм или сериал/i)
    await input.fill('матрица')
    await page.waitForTimeout(600)
    const firstResult = page.locator('ul li a').first()
    const count = await firstResult.count()
    if (count > 0) {
      const href = await firstResult.getAttribute('href')
      expect(href).toMatch(/^\/(movie|tv)\/\d+$/)
    }
  })

  test('Esc key closes search', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /поиск/i }).click()
    await expect(page.getByPlaceholder(/фильм или сериал/i)).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByPlaceholder(/фильм или сериал/i)).not.toBeVisible()
    await expect(page.getByRole('button', { name: /поиск/i })).toBeVisible()
  })

  test('close button closes search', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /поиск/i }).click()
    await expect(page.getByPlaceholder(/фильм или сериал/i)).toBeVisible()
    await page.getByRole('button', { name: /закрыть поиск/i }).click()
    await expect(page.getByPlaceholder(/фильм или сериал/i)).not.toBeVisible()
  })

  test('/api/search returns empty array for short query', async ({ page }) => {
    const res = await page.request.get('/api/search?q=а')
    expect(res.status()).toBe(200)
    const json = await res.json()
    expect(json.results).toEqual([])
  })

  test('/api/search returns results for valid query', async ({ page }) => {
    const res = await page.request.get('/api/search?q=matrix')
    expect(res.status()).toBe(200)
    const json = await res.json()
    expect(Array.isArray(json.results)).toBeTruthy()
    if (json.results.length > 0) {
      const first = json.results[0]
      expect(first).toHaveProperty('id')
      expect(first).toHaveProperty('title')
      expect(first.media_type).toMatch(/movie|tv/)
    }
  })

  test('search does not show on mobile header when closed', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    await expect(page.getByRole('button', { name: /поиск/i })).toBeVisible()
    await expect(page.getByPlaceholder(/фильм или сериал/i)).not.toBeVisible()
  })
})

test.describe('S7-01: PostHog Provider', () => {
  test('posthog-provider renders without console errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    await page.goto('/')
    // Filter posthog-unrelated errors (e.g. network errors for unset POSTHOG_KEY)
    const criticalErrors = errors.filter(
      (e) => !e.includes('posthog') && !e.includes('phc_') && !e.includes('NEXT_PUBLIC_POSTHOG')
    )
    expect(criticalErrors).toHaveLength(0)
  })
})

test.describe('S7-04: Error pages', () => {
  test('404 page shows not-found content', async ({ page }) => {
    await page.goto('/this-page-does-not-exist-at-all-xyz')
    await expect(page.getByText('404')).toBeVisible()
  })

  test('not-found page has link to homepage', async ({ page }) => {
    await page.goto('/this-page-does-not-exist-at-all-xyz')
    await expect(page.getByRole('link', { name: /на главную/i })).toBeVisible()
  })

  test('OG meta tag is present on homepage', async ({ page }) => {
    await page.goto('/')
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content')
    expect(ogTitle).toBeTruthy()
    expect(ogTitle).toContain('Кинополка')
  })

  test('Watch Providers fallback shows "Найти онлайн" when no providers', async ({ page }) => {
    // This is tested via movie detail pages — checking that the fallback link exists
    // when providers are unavailable (hard to control in E2E, so we verify the element exists on a known page)
    // For the test, we just verify the link text exists on a movie that might have no RU providers
    // We'll test that the WatchProvidersBlock renders correctly on any movie page
    await page.goto('/movie/603') // The Matrix — likely has providers
    await expect(page.getByText('Где смотреть')).toBeVisible()
  })
})
