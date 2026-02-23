# SiteAge.org

Website age certification platform. Queries Wayback Machine CDX API to determine when a website first appeared, generates SVG badges, supports ownership verification.

## Architecture

- **Monorepo**: pnpm workspace with 4 packages
- **Storage**: Cloudflare D1 (structured data) + KV (caching)
- **Frontend**: Astro + Tailwind CSS v4 (pure Astro components, no React/Vue)
- **Backend**: Cloudflare Workers with Hono
- **Deployment**: Cloudflare Pages (web) + Workers (api, badge)

## Packages

| Package | Path | Description |
|---|---|---|
| `@siteage/shared` | `packages/shared` | Types, utilities, constants |
| `@siteage/api` | `packages/api` | API Worker (api.siteage.org) |
| `@siteage/badge` | `packages/badge` | Badge Worker (badge.siteage.org) |
| `@siteage/web` | `packages/web` | Astro site (siteage.org) |

## Development

```bash
pnpm install              # Install all dependencies
pnpm build:shared         # Build shared package first
pnpm dev                  # Start all services in parallel
pnpm dev:api              # Start API Worker only
pnpm dev:badge            # Start Badge Worker only
pnpm dev:web              # Start Astro dev server only
```

## Conventions

- All timestamps use ISO 8601 with timezone (e.g., `2019-03-15T08:30:00Z`)
- Code, comments, docs, commit messages in English
- Domain status: `active`, `unreachable`, `dead`, `unknown`
- Verification status: `detected`, `pending`, `verified`
- Badge caching: CDN Edge (s-maxage=86400) -> KV (TTL 1h) -> real-time render

## Domain Lookup: Two-Phase Rendering

`[domain].astro` uses a two-phase rendering strategy for optimal UX:

- **Fast path (cached)**: SSR does a quick `GET /api/{domain}`. If cached, renders full result page immediately.
- **Slow path (uncached)**: SSR gets 404, renders a loading skeleton page (`LookupLoading.astro`) instantly. Client-side JS then calls `POST /api/lookup` asynchronously and navigates to the result via `location.replace()` (no history entry for loading page).

Key files: `[domain].astro` (routing logic), `LookupLoading.astro` (skeleton + client JS).

## Environment Variables (secrets)

- `ADMIN_KEY`: Admin authentication key
- `RESEND_API_KEY`: Resend email service API key

## Database

D1 database `siteage-db`. Migrations in `packages/api/src/db/migrations/`.
