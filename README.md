# Private Macro Desk

A private trading cockpit for two traders sharing the same account: dashboard, watchlist, trade journal,
economic calendar, research library, and a macro terminal with live central bank, inflation, labour, growth
and bond-yield data for the US, Euro Area, UK, Switzerland and Japan.

This is a personal project, built for real day-to-day use by its two traders — not a commercial product. Every
data point in the app either comes from a real, cited free source or is clearly labelled as not connected;
nothing is fabricated to make a screen look more finished than the data actually is. That principle shapes a lot
of the detail in this README.

**Status: v1-alpha** — feature-complete for daily use by its two intended traders, dockerized, with automated
backups and CI. See [Project status](#project-status) for what's deliberately out of scope for now.

## What's inside

- **Dashboard** — desk-wide snapshot: today's/tomorrow's calendar events, an AI-generated daily macro recap,
  a macro snapshot strip, watchlist and trade activity, open-risk visuals, and a personal pre-trade checklist.
- **Watchlist** — shared list of assets with bias, key levels and notes, editable by either trader.
- **Trade journal** — trade ideas through to close: thesis, invalidation, setup checklist, prices, risk sizing,
  post-trade result and mistake tags (all editable after the fact), threaded notes with screenshot uploads.
- **Economic calendar** — Forex Factory feed with sparklines, a real "Actual" column backfilled from FRED where
  possible, and a per-event FX price chart around the release date.
- **Research library** — Fed and ECB monetary policy statements, auto-synced, with AI-generated key takeaways
  and a summary/takeaways toggle, sortable by date.
- **Macro terminal** — five regional profiles (US, Euro Area, Switzerland, UK, Japan) with central bank rates,
  inflation, labour, growth and bond yields, a computed policy-trend badge, and a global overview tab with an
  FX volatility chart and a risk sentiment gauge.
- **Two-trader auth** — session-based login, brute-force lockout, per-trader password management, and a
  first-run bootstrap so the app is usable the moment the database is empty.
- **Bilingual settings** — the Settings tab is fully translated (EN/FR); the rest of the app is English-only
  for now (see [Language](#language)).

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router, Turbopack, Server Actions) + React 19 + TypeScript
- [Prisma 7](https://www.prisma.io) with the `@prisma/adapter-pg` driver adapter, on PostgreSQL
- Tailwind CSS 4
- [Google Gemini API](https://ai.google.dev) (free tier) for the optional AI features
- [Vitest](https://vitest.dev) for unit tests, GitHub Actions for CI
- Docker / docker-compose for deployment

## Quick start (local)

Requires Node.js 20.9+ and PostgreSQL. Docker is optional here — it can just run Postgres locally, or the
whole app (see [Run with Docker](#run-with-docker)).

```bash
npm install
docker compose up -d postgres   # local Postgres on :5432
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the home page redirects to `/dashboard`.

If the app starts against a completely empty database (no seed run yet), it auto-creates two default accounts
on first boot so you can log in immediately: `user1` / `user1` (owner) and `user2` / `user2` (member). A
banner reminds you to change these from Settings until you do — see [Security notes](#security-notes).

## Run with Docker

The whole app (not just Postgres) can run in Docker — this is the recommended way to run it day-to-day:

```bash
cp .env.example .env   # fill in AUTH_SECRET, FRED_API_KEY, etc.
docker compose up --build -d
```

This starts three services:

- **`postgres`** — same as before, on `:5432`.
- **`app`** — builds the Next.js app, runs `prisma migrate deploy` automatically on every startup (so a
  `git pull` with a new migration just works on next restart), then serves on `:3000`. The default-account
  bootstrap still runs the first time the database is empty. Ships with a container `HEALTHCHECK` against
  `/login`.
- **`backup`** — periodic `pg_dump` to `./backups/` on the host, controlled by `BACKUP_INTERVAL` in `.env`
  (accepts `4h`, `1d`, `7d`, ...; defaults to `1d`). Dumps older than 14 days are pruned automatically. Restore
  one with:
  ```bash
  docker compose exec -T postgres pg_restore -U postgres -d private_macro_desk --clean < backups/backup_YYYYMMDD_HHMMSS.dump
  ```

Trade screenshots persist across container rebuilds via a bind mount to `./public/uploads`. The manual
data-sync scripts (`npm run data:*`) aren't included in the runtime image — run those locally against the same
`DATABASE_URL` if you need to trigger a sync outside the normal 2-hour scheduler.

The image runs as root deliberately (not a security best practice in general, but matching a non-root user's
UID to whatever owns the bind-mounted `./public/uploads` on the host adds fragility that isn't worth it for a
two-user private app on a trusted host).

## Environment variables

Create a `.env` file (`.env.example` has the same list, ready to copy):

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Yes | `postgresql://postgres:postgres@localhost:5432/private_macro_desk` for the default docker-compose setup |
| `AUTH_SECRET` | Yes | Random string used to sign session tokens |
| `FRED_API_KEY` | Yes | Free key from [fred.stlouisfed.org](https://fred.stlouisfed.org/docs/api/api_key.html) — powers US data, the currency volatility chart, plus fallback for the Euro Area |
| `GEMINI_API_KEY` | No | Free key from [Google AI Studio](https://aistudio.google.com/apikey) — powers the AI daily macro brief and Research key takeaways. Without it, those features render an empty state instead of breaking. |
| `GEMINI_MODEL` | No | Defaults to `gemini-3.1-flash-lite`. Google periodically retires free-tier models for new API keys — if the daily brief starts logging a 404 "no longer available" error, run `npx tsx -e` against `ai.models.list()` (or check [ai.google.dev/gemini-api/docs/models](https://ai.google.dev/gemini-api/docs/models)) and set this to a current flash-tier model. |
| `FOREX_FACTORY_CALENDAR_URL` | No | Defaults to the public weekly calendar feed |
| `SEC_USER_AGENT` | No | Only needed for the optional, manual SEC EDGAR sync (`npm run data:research:sec`) — not used by the default research sync |
| `SEC_RESEARCH_TICKERS` / `SEC_RESEARCH_FORMS` / `SEC_RESEARCH_LIMIT_PER_TICKER` | No | Tune the optional SEC EDGAR sync scope |
| `BACKUP_INTERVAL` | No | Docker only — how often the `backup` service dumps the database (e.g. `4h`, `1d`, `7d`). Defaults to `1d`. |

## Macro data sources

The Macro tab is hydrated server-side from PostgreSQL, populated by scheduled/manual syncs — no data is fabricated in the UI.

| Region | Central bank / rates | Inflation, labour, growth | Yields |
| --- | --- | --- | --- |
| United States | FRED | FRED | 1Y / 5Y / 10Y (FRED) |
| Euro Area | ECB Data Portal | Eurostat (FRED fallback) | Germany 1Y/5Y/10Y, France & Italy 10Y (Bundesbank + FRED/OECD) |
| Switzerland | SNB | SNB | 1Y / 5Y / 10Y (SNB) |
| United Kingdom | Bank of England | ONS | 5Y / 10Y (BoE) |
| Japan | Bank of Japan | DBnomics / FRED-OECD | 1Y / 5Y (Japan MOF), 10Y (FRED/OECD) |

All yield sources above are free official APIs — none require a paid subscription. That said, coverage has real gaps:

- **UK 1Y and France 1Y/5Y have no free source at all.** The BoE and DMO only publish 5Y/10Y/20Y headline gilt yields; Banque de France discontinued its free OAT yield feed in July 2024 and the AFT site is not scrapable. A paid market-data vendor (Bloomberg, Refinitiv, ICE) would be required to fill these two gaps.
- **Switzerland's 1Y/5Y/10Y yields are effectively frozen.** The SNB's free `rendoblid` cube has not been updated since **July 2025** — every chart for these three series will show one clustered batch of history and then go flat. This is an upstream SNB data-portal limitation, not a bug in this app. A paid feed (again Bloomberg/Refinitiv/ICE, or a dedicated Swiss market-data provider) is the only way to get a live, complete Swiss yield curve.

### Central bank stance and next meeting

Each region's central bank card shows a "policy trend" badge (Tightening / Easing / Flat), calculated by comparing
the latest policy rate to its value three months earlier — a factual read of the recent trend, not a predictive
"hawkish/dovish" judgement call. If a region's policy rate hasn't updated recently (e.g. Switzerland's SNB feed,
frozen since July 2025 — see above), it falls back to a data-health badge instead of asserting a trend from stale
data.

"Next meeting" is looked up from the same synced Forex Factory calendar used for the Actual column. This is a real
limitation worth knowing: Forex Factory's free feed only ever exposes the current week (verified — no next-week or
next-month export exists for free), so this only shows a date when the region's decision happens to fall within the
week that's currently synced. The rest of the time it honestly says so rather than guessing.

### Economic calendar "Actual" column

Forex Factory's free `ff_calendar_thisweek.json` export never includes an `actual` field at all — verified
directly against the live feed, it only ever carries `title`/`country`/`date`/`impact`/`forecast`/`previous`, even
for releases from the day before. That export is a schedule/forecast feed, not a live results feed, and there is no
free tier of a proper results API.

To avoid a permanently empty Actual column for the releases that matter most, `syncForexFactoryCalendar()` also
cross-references a list of marquee US releases (CPI y/y & m/m, Core CPI y/y & m/m, PPI Final Demand m/m, Core PPI
Final Demand m/m, Retail Sales, Initial Claims, Unemployment Rate, Non-Farm Payrolls, UoM Consumer Sentiment)
against the real values already synced from FRED, matching by release rank rather than date math. Only mappings
with a clean 1:1 release cadence are included — GDP is deliberately excluded, since Forex Factory carries 2-3
releases per quarter (advance/second/third estimate) against a single FRED quarterly figure, which would
misattribute the value to the wrong release. Backfilled values carry a small `FRED` badge in the calendar so it's
clear they're cross-referenced rather than natively provided. Everything else (other currencies, housing data,
regional surveys, speeches) stays blank, since there is no free, correctly-scoped source for it — an AI-grounded
lookup (Gemini's Google Search tool) was evaluated for wider coverage but currently requires a billing-enabled
Google Cloud project even to stay within the free quota, so it isn't wired in. The sparkline "Trend" column on the
calendar reads from this same backfilled data, so it fills in gradually as more weeks of history accumulate.

### Event price reaction chart

Expanding a calendar event also shows a small daily price chart for the event's currency (the relevant FX pair
against USD, or the broad Dollar Index for USD events), covering roughly 5 days before and after the release, with
a marker on the event date. This reuses the same FRED FX data that powers the currency volatility chart on the
Macro tab — a true intraday/tick-level reaction chart around the exact release time is not available from any free
data source (would require a paid vendor such as Bloomberg, Refinitiv, or OANDA).

A background scheduler refreshes all of the above every 2 hours once the app server starts (`src/instrumentation.ts`). Data can also be refreshed on demand:

```bash
npm run data:fred            # US FRED series only
npm run data:macro           # US + Euro Area
npm run data:macro:global    # Switzerland, UK, Japan, and the extra Euro Area yields
npm run data:fx              # 8-currency FX series for the volatility chart (FRED, free)
npm run data:macro:verify    # read-only health check against the DB
npm run data:calendar        # Forex Factory economic calendar
npm run data:research        # Fed + ECB monetary policy statements
npm run data:research:fed    # Fed statements only
npm run data:research:ecb    # ECB statements only
npm run data:research:sec    # optional: SEC EDGAR company filings (requires SEC_USER_AGENT)
npm run data:ai:brief        # generate today's AI macro brief (requires GEMINI_API_KEY)
```

## AI features (optional)

Set `GEMINI_API_KEY` (free tier, see above) to enable two Gemini-powered features. Both fail gracefully to an
empty state if the key is missing or a call fails — nothing else in the app depends on them.

- **Daily macro brief** — once a day, grounded only in the latest real Fed/ECB statement text and this week's
  economic calendar, Gemini writes a short recap, 2–3 weighted drivers, a base/bull/bear scenario breakdown, and a
  risk-sentiment score. Shown on the Dashboard and Macro overview tab, labelled "AI take" with the generation
  timestamp. Runs on the same 2-hour scheduler tick as everything else, but only actually calls the model once
  per day.
- **Research key takeaways** — when a new Fed or ECB statement is synced, Gemini extracts 3–6 bullet takeaways from
  the full statement text (stored in `ResearchChunk`). Only runs on newly created documents, not on every refresh,
  to keep API usage low. Falls back to the existing mechanical summary if unset.

## Language

The Settings tab is fully translated (EN/FR) via a shared dictionary (`src/lib/i18n/settings.ts`); the rest of the app is English-only.

## Development & checks

```bash
npm run lint
npm run build
npm run test
```

These three also run automatically on every push/PR to `main` via GitHub Actions (`.github/workflows/ci.yml`).

## Security notes

- Login is rate-limited: 5 failed attempts for a given email locks it out for 15 minutes (in-memory, resets on
  server restart — fine for a two-user private app, not meant to survive a multi-instance deployment).
- Passwords can be changed from Settings (per-trader, or by the OWNER for either account) without needing shell
  access to the server. `npm run auth:set-password` still works as a fallback if a password is ever fully lost.
- A banner appears after login while an account still has its bootstrap default password (`user1`/`user2`) —
  it disappears automatically once that trader sets a real password.
- No secrets are baked into the Docker image — `.env*` is excluded from the build context (`.dockerignore`),
  and the placeholder `DATABASE_URL` used at build time (for `prisma generate`/`next build`) is never a real
  connection string; the real one is only supplied at container startup.

## Project status

This is the **v1-alpha** milestone: daily-use-ready for its two traders, with real data throughout, Docker
deployment, automated backups, and CI. Deliberately not in scope yet:

- Full French translation (Settings only is translated today)
- Trading analytics (win rate, P&L over time, R-multiple) — would need new schema fields (`exitPrice`,
  `realizedPnl`, `rMultiple`) that don't exist yet
- Live price quotes / price alerts on the watchlist — would require a paid market-data feed, which this project
  deliberately avoids
- Mobile-optimized layout — the UI is desk/wide-screen first (dense tables, a fullscreen mode on the calendar)

## License

Personal project, shared publicly for reference. No open-source license is granted — please don't redistribute
or use this commercially. No warranty of any kind.
