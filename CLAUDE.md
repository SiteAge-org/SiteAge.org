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
- Verification methods: `dns_txt` (DNS TXT record), `meta_tag` (HTML meta tag), `well_known` (/.well-known/siteage-verify.txt file)
- Verification success: API returns `magicKey` for immediate redirect to manage page; email sent asynchronously as backup
- Birth date display priority: `verified_birth_at` (admin-reviewed evidence) > `birth_at` (CDX auto-detected). Admin domains page shows ✓ prefix for verified dates.
- Badge caching: CDN Edge (s-maxage=86400) -> KV (TTL 1h) -> real-time render
- Lookup caching: KV (TTL 24h for success, 5min for CDX failures). CDX failures are NOT persisted to D1.
- Force refresh: `POST /lookup` with `{ force: true }` clears KV + D1 and re-queries CDX. Rate limited to once per 5 minutes per domain.
- Cross-worker cache clearing: API Worker binds both `API_CACHE` and `BADGE_CACHE` KV namespaces. On domain data changes (admin approval, verification, force refresh, status update), all caches (badge, domain, OG) are cleared via `Promise.all`.
- DNS verification help: Collapsible `<details>` guide with provider-specific steps (Cloudflare, Namecheap, GoDaddy, Squarespace, Name.com, Vercel, Other). Provider dashboard URLs use SSR-interpolated `{domain}`. Chip-based provider selector with toggle behavior.
- DNS verification: Queries Cloudflare, Google, and AliDNS DoH in parallel; falls back to system DNS (`node:dns`, 5s timeout) when all DoH fail. Handles multi-segment TXT records (`"seg1" "seg2"` → concatenated).
- Email sending: `fetch` (primary, works in production) → `node:https` fallback (local dev with `nodejs_compat`). Mirrors DNS DoH → system DNS fallback pattern.
- Diagnostic log prefixes: `[DNS]` for DoH queries/results, `[Verify]` for verification method lifecycle, `[Email]` for email sending attempts/results.
- Admin DNS diagnostic: `GET /admin/dns-check/:domain` returns raw TXT records from both resolvers + pending verification tokens. Protected by `X-Admin-Key`.
- Smart birth date update: `POST /manage/:domain/birth-date` auto-approves non-suspicious changes (date >= baseline or within 365-day tolerance), returns `requires_evidence` for suspicious ones, rejects future dates. Baseline = `birth_at` ?? `created_at`.
- Admin domains page: `GET /admin/domains` returns `magic_key` and `email` from latest verified verification record via subquery. Verified column shows clickable "Verified ↗" link (`/manage/{domain}?key={magicKey}`, `target="_blank"`) when magic_key exists; falls back to plain "Yes" text otherwise.
- Badge customization: Three query params — `?style=` controls visual style, `?type=` (`since` | `established`) controls message text, `?format=` (`year` | `month` | `date` | `age` | `days`) controls time display. 10 styles total: `flat`, `flat-square`, `for-the-badge`, `plastic`, `social` (all users) + `gold`, `vintage`, `dark`, `seal`, `minimal` (verified-only via `BADGE_VERIFIED_STYLES`). `established` type and `month`/`date`/`age`/`days` formats are verified-only; unverified sites auto-downgrade to `since` + `year` + `flat`. `gold`/`vintage` ignore `?color=` param (fixed color scheme). `seal` is 24px tall with ✦ prefix. `minimal` has transparent background. Defaults: verified → `established` + `year`, unverified → `since` + `year`.
- Badge cache key format: `badge:{domain}:{style}:{color}:{label}:{type}:{format}` (use `"default"` for omitted type/format).
- OG image: `GET badge.siteage.org/og/:domain` generates 1200×630 PNG certificate image for social sharing. Uses `@resvg/resvg-wasm` for SVG→PNG. Three templates: active (certificate), dead (tombstone), unknown (pending). KV cache key: `og:{domain}` (TTL 1h). CDN: `s-maxage=86400`.
- Social sharing: `ShareButtons.astro` provides X/LinkedIn/Facebook/Copy Link buttons with context-aware share text. `CertificateCard.astro` includes a "Download Certificate" button that fetches the OG image.
- Meta tags: `Base.astro` accepts `ogImage`, `ogTitle`, `ogDescription` props for OG + Twitter Card tags. `[domain].astro` passes dynamic domain-specific meta. Default OG image: `/og-default.png`.

### Design System Conventions

- **Cards**: Use `.card-base` (gradient bg + border + shadow + hover lift) for all content containers. Use `.card-title` for section headings inside cards.
- **Buttons**: Use `.btn-primary` (dark gradient) for primary actions, `.btn-seal` (gold gradient) for premium/highlight actions. Do not use raw Tailwind color utilities (e.g., `bg-blue-600`) for buttons.
- **Forms**: Use `.input-archival` for text inputs and textareas, `.select-archival` for select dropdowns. Do not use generic Tailwind form classes (e.g., `rounded-lg`, `border-gray-300`).
- **Decorative**: Use `.ornament-line` (single) and `.ornament-line-double` (double) for dividers. Use `.decorative-frame` for inner border overlays. Use `.noise-overlay` on hero/certificate sections.
- **Colors**: Always use design system colors (`ink`, `seal`, `azure`, `parchment`, `divider`, `tombstone`). Do not use raw Tailwind colors (e.g., `gray-200`, `blue-600`, `green-100`, `red-100`).
- **Shadows**: Use theme tokens (`--shadow-card`, `--shadow-card-hover`, `--shadow-certificate`, `--shadow-seal-glow`) instead of arbitrary shadow values.

## Domain Lookup: Two-Phase Rendering

`[domain].astro` uses a two-phase rendering strategy for optimal UX:

- **Fast path (cached)**: SSR does a quick `GET /api/{domain}`. If cached, renders full result page immediately.
- **Slow path (uncached)**: SSR gets 404, renders a loading skeleton page (`LookupLoading.astro`) instantly. Client-side JS then calls `POST /api/lookup` asynchronously and navigates to the result via `location.replace()` (no history entry for loading page).

Key files: `[domain].astro` (routing logic), `LookupLoading.astro` (skeleton + client JS).

## Environment Variables (secrets)

- `ADMIN_KEY`: Admin authentication key
- `RESEND_API_KEY`: Resend email service API key
- `API_URL`: (Badge Worker only) Override API base URL. Set in `packages/badge/.dev.vars` for local dev (e.g., `http://localhost:8788`). Defaults to `https://api.siteage.org` in production.

## Database

D1 database `siteage-db`. Migrations in `packages/api/src/db/migrations/`.

## CI/CD

**GitHub Actions** (`.github/workflows/deploy.yml`): Triggers on push to `main`.

```
push to main → [build] → [deploy-api] + [deploy-badge] + [deploy-web] (parallel)
```

- **build**: `pnpm install` → `build:shared` → `typecheck`, uploads shared dist as artifact
- **deploy-api**: D1 migrations → `wrangler deploy` (api.siteage.org)
- **deploy-badge**: `wrangler deploy` (badge.siteage.org)
- **deploy-web**: `astro build` → `wrangler pages deploy` (siteage.org)

**GitHub Secrets required**: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`

**Worker secrets** (set via `wrangler secret put`, not in CI): `ADMIN_KEY`, `RESEND_API_KEY`
