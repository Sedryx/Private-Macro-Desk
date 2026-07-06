import "dotenv/config";

import { DocumentType } from "@prisma/client";

import { prisma } from "../src/lib/prisma";

type SecTickerEntry = {
  cik_str: number;
  ticker: string;
  title: string;
};

type SecCompanyTickers = Record<string, SecTickerEntry>;

type SecSubmissions = {
  cik: string;
  name: string;
  filings: {
    recent: {
      accessionNumber: string[];
      filingDate: string[];
      reportDate: string[];
      form: string[];
      primaryDocument: string[];
      primaryDocDescription?: string[];
    };
  };
};

const provider = "SEC EDGAR";
const ownerEmail = "joachim@private-macro-desk.local";

async function main() {
  const userAgent = process.env.SEC_USER_AGENT;

  if (!userAgent) {
    throw new Error("SEC_USER_AGENT is required. Example: Private Macro Desk your-email@example.com");
  }

  const tickers = parseList(process.env.SEC_RESEARCH_TICKERS ?? "AAPL,MSFT,NVDA,TSLA,META,AMZN,GOOGL");
  const forms = new Set(parseList(process.env.SEC_RESEARCH_FORMS ?? "10-K,10-Q,8-K"));
  const limitPerTicker = Number(process.env.SEC_RESEARCH_LIMIT_PER_TICKER ?? "12");
  const uploadedById = await getSyncUserId();

  if (tickers.length === 0) {
    throw new Error("SEC_RESEARCH_TICKERS is empty.");
  }

  const tickerDirectory = await fetchSecJson<SecCompanyTickers>("https://www.sec.gov/files/company_tickers.json", userAgent);
  const byTicker = new Map(
    Object.values(tickerDirectory).map((entry) => [entry.ticker.toUpperCase(), entry]),
  );

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const ticker of tickers) {
    const company = byTicker.get(ticker.toUpperCase());

    if (!company) {
      console.warn(`Skipped ${ticker}: ticker not found in SEC directory.`);
      skipped += 1;
      continue;
    }

    const cik = String(company.cik_str).padStart(10, "0");
    const submissions = await fetchSecJson<SecSubmissions>(`https://data.sec.gov/submissions/CIK${cik}.json`, userAgent);
    const rows = normalizeRecentFilings(submissions, company.ticker, company.title, forms).slice(0, limitPerTicker);

    for (const row of rows) {
      const result = await prisma.researchDocument.upsert({
        where: {
          provider_externalId: {
            provider,
            externalId: row.externalId,
          },
        },
        create: {
          externalId: row.externalId,
          provider,
          ticker: row.ticker,
          companyName: row.companyName,
          formType: row.formType,
          filedAt: row.filedAt,
          reportDate: row.reportDate,
          sourceUrl: row.sourceUrl,
          title: row.title,
          type: DocumentType.FILING,
          source: provider,
          fileUrl: row.sourceUrl,
          uploadedById,
        },
        update: {
          companyName: row.companyName,
          formType: row.formType,
          filedAt: row.filedAt,
          reportDate: row.reportDate,
          sourceUrl: row.sourceUrl,
          title: row.title,
          source: provider,
          fileUrl: row.sourceUrl,
        },
        select: { createdAt: true, updatedAt: true },
      });

      if (result.createdAt.getTime() === result.updatedAt.getTime()) {
        created += 1;
      } else {
        updated += 1;
      }
    }
  }

  console.log(`SEC EDGAR research sync complete: ${created} created, ${updated} updated, ${skipped} skipped.`);
}

function normalizeRecentFilings(
  submissions: SecSubmissions,
  ticker: string,
  fallbackCompanyName: string,
  forms: Set<string>,
) {
  const recent = submissions.filings.recent;
  const rows = [];

  for (let index = 0; index < recent.accessionNumber.length; index += 1) {
    const formType = recent.form[index];
    const accessionNumber = recent.accessionNumber[index];
    const primaryDocument = recent.primaryDocument[index];

    if (!forms.has(formType) || !accessionNumber || !primaryDocument) continue;

    const cikNoLeadingZeroes = String(Number(submissions.cik));
    const accessionNoDashes = accessionNumber.replaceAll("-", "");
    const sourceUrl = `https://www.sec.gov/Archives/edgar/data/${cikNoLeadingZeroes}/${accessionNoDashes}/${primaryDocument}`;
    const companyName = submissions.name || fallbackCompanyName;
    const reportDate = parseSecDate(recent.reportDate[index]);

    rows.push({
      externalId: `${submissions.cik}-${accessionNumber}`,
      ticker: ticker.toUpperCase(),
      companyName,
      formType,
      filedAt: parseSecDate(recent.filingDate[index]),
      reportDate,
      sourceUrl,
      title: `${companyName} ${formType}${reportDate ? ` / ${recent.reportDate[index]}` : ""}`,
    });
  }

  return rows;
}

async function getSyncUserId() {
  const user = await prisma.user.findFirst({
    where: { email: ownerEmail },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  }) ?? await prisma.user.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (!user) {
    throw new Error("No user found. Run npx prisma db seed first.");
  }

  return user.id;
}

async function fetchSecJson<T>(url: string, userAgent: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      "Accept-Encoding": "gzip, deflate",
      "User-Agent": userAgent,
    },
  });

  if (!response.ok) {
    throw new Error(`SEC request failed ${response.status}: ${url}`);
  }

  return response.json() as Promise<T>;
}

function parseList(value: string) {
  return value.split(",").map((item) => item.trim().toUpperCase()).filter(Boolean);
}

function parseSecDate(value: string | undefined) {
  if (!value) return null;
  const date = new Date(`${value}T12:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

