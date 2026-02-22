# SiteAge.org

Website age certification platform. Discover when any website first appeared on the internet and get a certified age badge powered by the Wayback Machine.

## Features

- **Instant Lookup** — Query any domain to find its earliest Wayback Machine snapshot
- **Age Certificates** — Beautiful certificate pages with birth date, longevity ranking, and timeline
- **Embeddable Badges** — SVG badges in 3 styles (flat, flat-square, for-the-badge)
- **Owner Verification** — Claim your domain via DNS TXT or meta tag, earn a gold "Established" badge
- **Health Monitoring** — Automated daily checks with priority scoring
- **Tombstone System** — Memorial pages for domains that have gone offline
- **Admin Dashboard** — Manage domains, review evidence submissions

## Architecture

- **Monorepo**: pnpm workspace
- **Backend**: Cloudflare Workers + Hono
- **Frontend**: Astro + Tailwind CSS v4
- **Storage**: Cloudflare D1 + KV
- **Email**: Resend API

## Packages

| Package | Description |
|---|---|
| `@siteage/shared` | Shared types, utilities, constants |
| `@siteage/api` | API Worker — api.siteage.org |
| `@siteage/badge` | Badge Worker — badge.siteage.org |
| `@siteage/web` | Astro site — siteage.org |

## Development

```bash
pnpm install          # Install dependencies
pnpm build:shared     # Build shared package
pnpm dev              # Start all services
pnpm dev:api          # Start API Worker only
pnpm dev:web          # Start Astro dev server only
```

## Deployment

```bash
pnpm deploy:api       # Deploy API Worker
pnpm deploy:badge     # Deploy Badge Worker
pnpm deploy:web       # Build and deploy Astro site to CF Pages
```

### Required Secrets

Set via `wrangler secret put`:

- `ADMIN_KEY` — Admin authentication key
- `RESEND_API_KEY` — Resend email service API key

### Required Resources

- D1 database `siteage-db` — Run migrations with `pnpm --filter @siteage/api db:migrate`
- KV namespace `API_CACHE` — For API response caching
- KV namespace `BADGE_CACHE` — For badge SVG caching

## License

MIT
