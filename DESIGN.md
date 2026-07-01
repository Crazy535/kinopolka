# Design System: Кинополка (Kinopolka)

## 1. Visual Theme & Atmosphere

A dark, cinematic "movie theater at night" atmosphere — deep near-black backgrounds (`.dark` is hardcoded on `<html>`, there is no light mode in practice), a single warm crimson-red accent for primary actions, and gold/amber reserved for ratings and premium moments (Roulette, streaks). Density is "Daily App Balanced": comfortable poster grids, not a data-dense dashboard. Motion is "Fluid CSS/Framer" — spring-based, staggered reveals, tactile press feedback — never static, never gratuitously cinematic-heavy.

## 2. Color Palette & Roles

Defined as OKLCH CSS variables in `src/app/globals.css` (`.dark` block is the real theme):

- **Background** `oklch(0.09 0.025 265)` — near-black, cool undertone. Never pure `#000000`.
- **Card / Surface** `oklch(0.13 0.022 265)` / `--surface: oklch(0.14 0.020 265)` — poster cards, panels.
- **Foreground** `oklch(0.97 0.006 265)` — primary text.
- **Muted Foreground** `oklch(0.65 0.012 265)` — secondary text, metadata, descriptions.
- **Primary (crimson accent)** `oklch(0.58 0.22 18)` — the single accent. CTAs, active nav pill, focus rings, quiz progress.
- **Gold** `oklch(0.80 0.13 80)` — ratings, roulette wheel, premium/streak moments only. Never used interchangeably with primary.
- **Rating High/Mid/Low** `oklch(0.72 0.17 145)` / `oklch(0.80 0.13 80)` / `oklch(0.62 0.18 30)` — match-score badges only.
- **Border** `oklch(1 0 0 / 0.09)` — hairline dividers, always low-opacity white, never a solid gray.

**Rules:** one accent (crimson) for actions, gold is reserved semantically for ratings/premium — do not blend the two. All colors are OKLCH tokens in `globals.css`; never hardcode a new hex/oklch color inline in a component — add a token if a new role is genuinely needed.

## 3. Typography Rules

- **Display/Headings** (`font-heading` → `--font-playfair`): Playfair Display, bold/black weight only (700/900). Used for H1/H2 page and section titles. `text-wrap: balance` is applied globally to h1–h3.
- **Body/UI** (`font-sans` → `--font-manrope`): Manrope. Chosen specifically because it has full Cyrillic coverage in `next/font` — **do not swap in DM Sans or other fonts without checking Cyrillic subset support first** (see `feedback_dm_sans_cyrillic` history).
- **Mono** (`--font-geist-mono`): Geist Mono — used sparingly (timestamps, code-like data), not for general UI numbers.
- **Banned:** Inter (not used and should stay that way — Manrope is the established sans), generic serif fallbacks for headings (Playfair only).

## 4. Component Stylings

- **Buttons:** flat fills using `--primary`, `active:scale-[0.96]` tactile feedback (see `button.tsx`, `.btn-link` utility), no neon outer glow. Ghost/outline for secondary actions.
- **Cards:** `rounded-xl`/`rounded-2xl`, tinted crimson glow shadow (`--card-glow`) on hover/focus, not a generic drop shadow. Poster cards always `aspect-[2/3]` with `object-cover`.
- **Loading states:** skeleton shapes matching real layout (`.animate-shimmer`), never a generic spinner.
- **Motion:** Framer Motion spring transitions (`stiffness: 400, damping: 30` for nav pill; `ease: [0.19,1,0.22,1]` "expo out" for cards/reveals). Staggered `delayChildren`/`staggerChildren` for list/grid entrances. Always respects `prefers-reduced-motion` (global CSS override + `<MotionConfig reducedMotion="user">`).

## 5. Layout Principles

- Tailwind v4 CSS-based theme (`@theme inline` in `globals.css`), standard breakpoints (`sm` 640px, `md` 768px used as the mobile/desktop split for nav — bottom nav is `md:hidden`, desktop nav appears at `md:`).
- Main content container: `max-w-7xl` centered, `px-4 sm:px-6`.
- **No horizontal overflow on mobile — zero tolerance.** If a flex row has a heading next to fixed-width controls (e.g. carousel header + "Показать все" pill), the heading **must** get `min-w-0` so it can wrap/shrink instead of forcing the row wider than the viewport. Cause of a real shipped bug: `category-carousel.tsx` header row overflowed at 360px because the `<h2>` had no `min-w-0`.
- **Full-viewport-fit sections must use `dvh`, never `vh` or `min-h-screen`/`h-screen`.** iOS Safari's collapsing address bar makes `100vh` taller than the real visible viewport, causing a jump/whitespace flash. `swipe-deck.tsx` learned this the hard way — see Anti-Patterns.
- **Never hand-tune a `calc(100dvh - <magic number>)` height budget for content sandwiched between a fixed header and fixed bottom nav.** It silently drifts wrong the moment any sibling element's height changes (this exact bug hid the swipe screen's action buttons behind the bottom nav on iPhone SE/12/13/14 — the reserved constant didn't account for the page heading block). Instead: give the *outer* container a computed height (header + main padding, that part is a real fixed constant), then make the one flexible element `flex-1 min-h-0` inside a `flex flex-col` — every sibling that must stay visible gets `shrink-0`, and the flexible element absorbs all the slack automatically. Add a small `min-h-[Npx]` floor only as an absolute safety net for extreme cases (e.g. landscape), never as the primary sizing mechanism.

## 6. Responsive Rules

- **Touch targets: minimum 44×44px.** Known offenders to fix opportunistically when touched: header search/avatar buttons (36px, `search-bar.tsx` / `user-menu.tsx`), quiz-results "⋯" menu (30px). When bumping to 44px, grow the clickable padding, not necessarily the visual icon size.
- **Safe-area insets are wired up** (`app/layout.tsx` sets `viewport: { viewportFit: 'cover' }`). `bottom-nav.tsx` adds `pb-[env(safe-area-inset-bottom)]`, `header-shell.tsx` adds `pt-[env(safe-area-inset-top)]`. Any new fixed/sticky full-width element (bottom sheets, toasts, modals anchored to an edge) must add the matching `env(safe-area-inset-*)` padding itself — it is not inherited automatically.
- Bottom nav (`bottom-nav.tsx`) is mobile-only (`md:hidden`, fixed, `h-16` + safe-area padding); `<main>` reserves `pb-[calc(6rem+env(safe-area-inset-bottom))]` on mobile / `md:pb-8` on desktop specifically to clear it — any new full-bleed mobile screen must respect this existing reserved space (including the safe-area term, see `swipe/page.tsx`'s height calc) rather than fighting it with its own height math.

## 7. Anti-Patterns (Banned)

- No `100vh`/`h-screen`/`min-h-screen` for anything meant to exactly fill the visible viewport on mobile — use `dvh`.
- No magic-number `calc(100dvh - N)` height budgets for multi-sibling layouts — use `flex-1 min-h-0` distribution instead.
- No flex row combining a text heading with fixed-width controls without `min-w-0` on the text side.
- No interactive element under 44×44px touch target.
- No new hardcoded color — add an OKLCH token to `globals.css` instead.
- No pure black (`#000000`) — background is `oklch(0.09 0.025 265)`.
- No Inter font, no generic serif for headings (Playfair Display only).
- No plain circular spinners for loading states — skeleton shapes matching the real layout.
- No motion that ignores `prefers-reduced-motion`.
