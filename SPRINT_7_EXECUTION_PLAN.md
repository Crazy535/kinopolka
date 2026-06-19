# Sprint 7 Execution Plan — Polish + Soft Launch

**Дата:** 2026-06-13  
**Product Owner:** Rustem  
**Цель:** Доказать на реальных пользователях TTW < 30 сек и принять Go/No-Go решение о публичном запуске.

---

## Environment Audit

| Компонент | Статус | Примечание |
|---|---|---|
| Next.js 16.2.9 | ✅ | Vercel auto-deploy из main |
| Prisma 7 + PostgreSQL (Supabase) | ✅ | 8 таблиц, 2 миграции |
| Auth.js v5 (Google OAuth) | ✅ | Prod-домен нужно проверить в Google Console |
| Supabase Realtime | ✅ | Partner Mode работает |
| TMDB API | ✅ | Только server-side |
| E2E тесты | ✅ | 65/65 green |
| PostHog | ❌ | Нужен аккаунт + `NEXT_PUBLIC_POSTHOG_KEY` |
| Новые env vars Vercel | ❌ | `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` |
| OG Image | ❌ | Нет кастомной og:image |
| Favicon | ⚠️ | Дефолтный Next.js |

---

## Задачи Sprint 7

### S7-01 — PostHog Analytics `[P0 — блокер для S7-05]`

**Цель:** измерять TTW P50 и воронку квиза на реальных пользователях.

**Новые файлы:**
- `src/components/posthog-provider.tsx` — клиентский провайдер (Client Component)
- `src/lib/analytics.ts` — хелперы для событий TTW

**Изменения:**
- `src/app/layout.tsx` — обернуть в `<PostHogProvider>`
- `package.json` — добавить `posthog-js`

**События для трекинга:**

| Событие | Где | Свойства |
|---|---|---|
| `ttw_session_start` | layout / page.tsx | `user_type: 'anon' \| 'auth'`, `entry_page` |
| `ttw_completed` | WatchlistButton, provider link | `user_type`, `duration_ms`, `method: 'watchlist' \| 'provider'` |
| `quiz_step` | quiz-step.tsx | `step: 1\|2\|3`, `user_type` |
| `quiz_completed` | quiz-results.tsx | `result_count`, `user_type` |
| `roulette_spun` | roulette-container.tsx | `user_type` |
| `partner_room_created` | partner-create-room.tsx | — |
| `search_used` | search-bar.tsx (S7-03) | `query_length`, `result_count` |

**Env vars:**
```
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://eu.posthog.com
```

**DoD:**
- PostHog dashboard показывает события от реальных сессий
- TTW рассчитывается как P50 по событиям `ttw_session_start` → `ttw_completed`
- Quiz Completion Rate виден в воронке шагов квиза
- Трекинг не блокирует рендер (async, не влияет на LCP)

---

### S7-02 — Lighthouse Mobile > 85 `[P0]`

**Цель:** мобильный пользователь получает первый контент быстро — валидные TTW данные.

**Шаг 1 — Замер (до):**
- Запустить Lighthouse mobile на `/`, `/quiz`, `/movie/[id]` (через Vercel prod или `npm run build && npm start`)

**Ожидаемые проблемы и решения:**

| Вероятная проблема | Решение |
|---|---|
| LCP на `/movie/[id]` — poster без priority | Добавить `priority` на первый Image |
| CLS — layout shift у movie-card | Зафиксировать aspect-ratio в CSS |
| Render-blocking fonts | `display: swap` уже есть в next/font |
| Framer Motion CPU на mobile | Добавить `prefers-reduced-motion` check |
| Отсутствие `loading="lazy"` | next/image уже lazy по умолчанию |

**Изменения:**
- `src/components/movie-card.tsx` — добавить `sizes` prop для Image
- `src/app/movie/[id]/page.tsx` — `priority` на poster (ISR страница)
- `src/app/tv/[id]/page.tsx` — аналогично
- `src/app/globals.css` — `@media (prefers-reduced-motion: reduce)` для анимаций

**DoD:**
- Lighthouse Mobile Performance ≥ 85 на `/`, `/quiz`, `/movie/[id]`
- Desktop регрессий нет (был 98/100)
- Скриншоты замеров до/после зафиксированы

---

### S7-03 — Поиск фильмов (вспомогательный) `[P1]`

**Anti-Catalog Rule:** поиск — escape hatch, не каталог. Без фильтров, без сортировок, без бесконечной ленты.

**Новые файлы:**
- `src/app/api/search/route.ts` — GET `/api/search?q=...`
- `src/components/search-bar.tsx` — компонент поиска в header

**Изменения:**
- `src/components/header.tsx` — добавить SearchBar (иконка → инпут → dropdown)

**API route `/api/search`:**
```typescript
// TMDB /search/multi?query=q&language=ru-RU&page=1
// Возвращает: { results: Array<{ id, title|name, media_type, poster_path, release_date|first_air_date }> }
// Лимит: первые 8 результатов, только movie и tv (без person)
```

**Поведение SearchBar:**
- Иконка поиска в правой части header (слева от UserMenu)
- Клик → инпут разворачивается
- Debounce 300ms → запрос к `/api/search`
- Dropdown с результатами под header (max 8)
- Каждый результат: poster + title + год
- Клик → `/movie/[id]` или `/tv/[id]`
- Esc или blur → закрыть
- Пустой запрос → скрыть dropdown
- Нет результатов → «Ничего не найдено» (не пустой экран)

**Env vars:** не требуются (TMDB уже настроен)

**DoD:**
- Поиск визуально вторичен (иконка, не строка по умолчанию)
- Russian-first: русские названия в результатах (TMDB language=ru-RU)
- Переход на карточку с Watch Providers
- Нет фильтров, нет сортировок, нет отдельной страницы каталога
- E2E тест: `e2e/sprint7.spec.ts` — 5+ тестов поиска

---

### S7-04 — Deploy Checklist + Pre-Launch Hardening `[P0]`

**Checklist перед soft launch:**

**1. OpenGraph + SEO**
- `layout.tsx`: добавить `openGraph` и `twitter` в metadata
- `opengraph-image.tsx` или статичный `/public/og.png` (1200×630)
- Проверить canonical URL

**2. Favicon**
- Заменить дефолтный Next.js favicon на Кинополка-иконку
- `src/app/favicon.ico` + `src/app/icon.png`

**3. Google OAuth → Prod**
- Подтвердить, что `https://kinopolka.vercel.app` в Authorized redirect URIs
- Подтвердить, что `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` на Vercel

**4. Vercel env vars**
- Добавить `NEXT_PUBLIC_POSTHOG_KEY` и `NEXT_PUBLIC_POSTHOG_HOST`
- Проверить `NEXT_PUBLIC_SUPABASE_URL` и `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**5. Error states hardening**
- TMDB недоступен → `error.tsx` в `src/app/` (уже должен быть или создать)
- Watch Providers пусты → fallback на «Найти в интернете» (Google Search link)
- Partner room истекла → redirect на `/partner` с сообщением
- 404 страница `src/app/not-found.tsx`

**6. E2E smoke перед launch**
- `npx playwright test` → 65/65 + новые Sprint 7 тесты

**DoD:**
- Все пункты чеклиста выполнены
- OG preview в https://opengraph.xyz/ показывает правильный preview
- Все E2E green на prod-like окружении
- Нет `console.error` в проде

---

### S7-05 — Soft Launch 20 пользователей `[P0 — требует S7-01, S7-04]`

**Это процессная задача, не кодовая.**

**Plan:**
1. S7-01 в проде + S7-04 пройден → дать доступ 20 пользователям
2. Способ приглашения: личные ссылки (WhatsApp/Telegram) — не публичный анонс
3. Попросить попробовать основной flow: квиз → карточка → провайдер (без подсказки «это тест TTW»)
4. Собрать качественную обратную связь отдельно (форма или личный разговор)

**Критерии готовности к запуску:**
- S7-01 (PostHog) активен → события поступают
- S7-02 (Lighthouse) → Mobile ≥ 85
- S7-03 (Поиск) задеплоен
- S7-04 (Checklist) полностью пройден
- E2E 65+ тестов green

**DoD:**
- 20 уникальных пользователей зафиксированы в PostHog
- Собрано ≥ 50 событий `ttw_completed`
- Нет инцидентов, блокирующих основной path (иначе хотфикс → повтор)

---

### S7-06 — TTW Analysis Report + Go/No-Go `[P0, финал]`

**Это аналитическая задача после S7-05.**

**Отчёт включает:**

```
TTW P50 анонимный:    XX сек (цель < 30 сек) → ✅/❌
TTW P50 авторизованный: XX сек (цель < 15 сек) → ✅/❌
Quiz Completion Rate: XX% (цель > 70%) → ✅/❌
Рулетка TTW:         XX сек (цель < 10 сек) → ✅/❌
Onboarding:          XX сек (цель < 45 сек) → ✅/❌
```

**Go/No-Go критерий:**
- Все 5 метрик в норме → **Go** → Sprint 8 (Public Launch + Email Resend)
- Хотя бы 1 метрика не в норме → **No-Go** → фикс + повтор soft launch

---

## Порядок выполнения

```
ФАЗА 1 (параллельно):
├── S7-01 PostHog        ──┐
├── S7-02 Lighthouse     ──┤ независимы, стартуют одновременно
└── S7-03 Поиск          ──┘

ФАЗА 2 (после Фазы 1):
└── S7-04 Deploy checklist (требует S7-01 + S7-03 в проде)

ФАЗА 3 (после S7-04):
└── S7-05 Soft launch → S7-06 Analysis + Go/No-Go
```

---

## Новые файлы Sprint 7

```
src/
├── components/
│   ├── posthog-provider.tsx    # S7-01: Client component PostHog init
│   └── search-bar.tsx          # S7-03: Search icon → input → dropdown
├── app/
│   ├── api/
│   │   └── search/
│   │       └── route.ts        # S7-03: TMDB /search/multi
│   ├── error.tsx               # S7-04: Global error boundary
│   └── not-found.tsx           # S7-04: Custom 404
└── lib/
    └── analytics.ts            # S7-01: TTW tracking helpers

e2e/
└── sprint7.spec.ts             # S7-01..S7-04 тесты (цель: 10+)

public/
└── og.png                      # S7-04: OpenGraph image 1200×630
```

---

## E2E план Sprint 7

| Тест | Область |
|---|---|
| Search: ввод запроса → показываются результаты | S7-03 |
| Search: клик на результат → переход на /movie/[id] | S7-03 |
| Search: пустой запрос → нет dropdown | S7-03 |
| Search: нет результатов → сообщение "Ничего не найдено" | S7-03 |
| Search: Esc → закрыть | S7-03 |
| Analytics: posthog-provider рендерится без ошибок | S7-01 |
| Error: 404 страница показывает not-found.tsx | S7-04 |
| OG: /api/og или og:image тег присутствует в <head> | S7-04 |
| Watch Providers: нет провайдеров → fallback link виден | S7-04 |
| Mobile: header не ломается при узком viewport | S7-03 |

Цель: 10+ тестов → итого 75/75 E2E

---

## Env Vars (новые в Sprint 7)

| Переменная | Где | Описание |
|---|---|---|
| `NEXT_PUBLIC_POSTHOG_KEY` | `.env.local` + Vercel | PostHog project API key |
| `NEXT_PUBLIC_POSTHOG_HOST` | `.env.local` + Vercel | `https://eu.posthog.com` |

---

## Definition of Done Sprint 7

- [ ] S7-01: PostHog events поступают, TTW P50 рассчитывается
- [ ] S7-02: Lighthouse Mobile ≥ 85 на `/`, `/quiz`, `/movie/[id]`
- [ ] S7-03: Поиск работает, Anti-Catalog Rule не нарушена
- [ ] S7-04: OG, favicon, OAuth, env vars, error pages — всё на проде
- [ ] S7-05: 20 пользователей, ≥ 50 TTW замеров собраны
- [ ] S7-06: Go/No-Go отчёт готов и подписан Product Owner (Rustem)
- [ ] E2E: 75/75 green
- [ ] Release Rule: PM + QA + UX + Security + Performance + Code Review + Docs + PO approval
