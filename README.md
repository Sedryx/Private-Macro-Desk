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

If the app starts against a completely empty database (no seed run yet), it auto-creates two default accounts on first boot so you can log in immediately: `user1` / `user1` (owner) and `user2` / `user2` (member). Rename them from Settings once you're in — see the account migration note below.

Create a `.env` file (see `prisma/schema.prisma` for the datasource) with:

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Yes | `postgresql://postgres:postgres@localhost:5432/private_macro_desk` for the default docker-compose setup |
| `AUTH_SECRET` | Yes | Random string used to sign session tokens |
| `FRED_API_KEY` | Yes | Free key from [fred.stlouisfed.org](https://fred.stlouisfed.org/docs/api/api_key.html) — powers US data, the currency volatility chart, plus fallback for the Euro Area |
| `GEMINI_API_KEY` | No | Free key from [Google AI Studio](https://aistudio.google.com/apikey) — powers the AI daily macro brief and Research key takeaways. Without it, those features render an empty state instead of breaking. |
| `GEMINI_MODEL` | No | Defaults to `gemini-2.5-flash` |
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
  risk-sentiment score. Shown on the Macro overview tab, labelled "AI take" with the generation timestamp. Runs on
  the same 2-hour scheduler tick as everything else, but only actually calls the model once per day.
- **Research key takeaways** — when a new Fed or ECB statement is synced, Gemini extracts 3–6 bullet takeaways from
  the full statement text (stored in `ResearchChunk`). Only runs on newly created documents, not on every refresh,
  to keep API usage low. Falls back to the existing mechanical summary if unset.

## Language

The Settings tab is fully translated (EN/FR) via a shared dictionary (`src/lib/i18n/settings.ts`); the rest of the app is English-only.

## Checks

```bash
npm run lint
npm run build
```
