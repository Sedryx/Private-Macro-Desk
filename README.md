# Private Macro Desk

Private trading cockpit for two traders sharing the same trading account. Dashboard, watchlist, trade journal, economic calendar, research library and a macro terminal with live central bank, inflation, labour, growth and bond-yield data for the US, Euro Area, UK, Switzerland and Japan.

## Setup

Requires Node.js 20.9+, PostgreSQL, and Docker (optional, for local Postgres).

```bash
npm install
docker compose up -d        # local Postgres on :5432
npx prisma migrate deploy
npx prisma db seed
npm run auth:set-password -- <email> <password>
```

Create a `.env` file (see `prisma/schema.prisma` for the datasource) with:

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Yes | `postgresql://postgres:postgres@localhost:5432/private_macro_desk` for the default docker-compose setup |
| `AUTH_SECRET` | Yes | Random string used to sign session tokens |
| `FRED_API_KEY` | Yes | Free key from [fred.stlouisfed.org](https://fred.stlouisfed.org/docs/api/api_key.html) — powers US data plus fallback for the Euro Area |
| `FOREX_FACTORY_CALENDAR_URL` | No | Defaults to the public weekly calendar feed |
| `SEC_USER_AGENT` | No | Required by SEC EDGAR if research sync is enabled |
| `SEC_RESEARCH_TICKERS` / `SEC_RESEARCH_FORMS` / `SEC_RESEARCH_LIMIT_PER_TICKER` | No | Tune the research sync scope |

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The home page redirects to `/dashboard`.

## Macro data sources

The Macro tab is hydrated server-side from PostgreSQL, populated by scheduled/manual syncs — no data is fabricated in the UI.

| Region | Central bank / rates | Inflation, labour, growth | Yields |
| --- | --- | --- | --- |
| United States | FRED | FRED | 1Y / 5Y / 10Y (FRED) |
| Euro Area | ECB Data Portal | Eurostat (FRED fallback) | Germany 1Y/5Y/10Y, France & Italy 10Y (Bundesbank + FRED/OECD) |
| Switzerland | SNB | SNB | 1Y / 5Y / 10Y (SNB) |
| United Kingdom | Bank of England | ONS | 5Y / 10Y (BoE) |
| Japan | Bank of Japan | DBnomics / FRED-OECD | 1Y / 5Y (Japan MOF), 10Y (FRED/OECD) |

A background scheduler refreshes all of the above every 2 hours once the app server starts (`src/instrumentation.ts`). Data can also be refreshed on demand:

```bash
npm run data:fred            # US FRED series only
npm run data:macro           # US + Euro Area
npm run data:macro:global    # Switzerland, UK, Japan, and the extra Euro Area yields
npm run data:macro:verify    # read-only health check against the DB
npm run data:calendar        # Forex Factory economic calendar
npm run data:research        # SEC EDGAR filings (requires SEC_USER_AGENT)
```

## Language

The Settings tab is fully translated (EN/FR) via a shared dictionary (`src/lib/i18n/settings.ts`); the rest of the app is English-only.

## Checks

```bash
npm run lint
npm run build
```
