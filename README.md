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
| `SEC_USER_AGENT` | No | Only needed for the optional, manual SEC EDGAR sync (`npm run data:research:sec`) — not used by the default research sync |
| `SEC_RESEARCH_TICKERS` / `SEC_RESEARCH_FORMS` / `SEC_RESEARCH_LIMIT_PER_TICKER` | No | Tune the optional SEC EDGAR sync scope |

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

All yield sources above are free official APIs — none require a paid subscription. That said, coverage has real gaps:

- **UK 1Y and France 1Y/5Y have no free source at all.** The BoE and DMO only publish 5Y/10Y/20Y headline gilt yields; Banque de France discontinued its free OAT yield feed in July 2024 and the AFT site is not scrapable. A paid market-data vendor (Bloomberg, Refinitiv, ICE) would be required to fill these two gaps.
- **Switzerland's 1Y/5Y/10Y yields are effectively frozen.** The SNB's free `rendoblid` cube has not been updated since **July 2025** — every chart for these three series will show one clustered batch of history and then go flat. This is an upstream SNB data-portal limitation, not a bug in this app. A paid feed (again Bloomberg/Refinitiv/ICE, or a dedicated Swiss market-data provider) is the only way to get a live, complete Swiss yield curve.

A background scheduler refreshes all of the above every 2 hours once the app server starts (`src/instrumentation.ts`). Data can also be refreshed on demand:

```bash
npm run data:fred            # US FRED series only
npm run data:macro           # US + Euro Area
npm run data:macro:global    # Switzerland, UK, Japan, and the extra Euro Area yields
npm run data:macro:verify    # read-only health check against the DB
npm run data:calendar        # Forex Factory economic calendar
npm run data:research        # Fed + ECB monetary policy statements
npm run data:research:fed    # Fed statements only
npm run data:research:ecb    # ECB statements only
npm run data:research:sec    # optional: SEC EDGAR company filings (requires SEC_USER_AGENT)
```

## Language

The Settings tab is fully translated (EN/FR) via a shared dictionary (`src/lib/i18n/settings.ts`); the rest of the app is English-only.

## Checks

```bash
npm run lint
npm run build
```
