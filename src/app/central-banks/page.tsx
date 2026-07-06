import {
  InterestRatesDesk,
  type CentralBankRatesView,
} from "@/components/rates/InterestRatesDesk";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const bankConfigs = [
  {
    id: "fed",
    label: "Federal Reserve",
    currency: "USD",
    codes: [{ code: "FEDFUNDS", label: "Effective Federal Funds Rate" }],
  },
  {
    id: "ecb",
    label: "European Central Bank",
    currency: "EUR",
    codes: [
      { code: "ECB_DEPOSIT_RATE", label: "Deposit Facility Rate" },
      { code: "ECB_MAIN_REFINANCING_RATE", label: "Main Refinancing Rate" },
      { code: "ECB_MARGINAL_LENDING_RATE", label: "Marginal Lending Rate" },
    ],
  },
  {
    id: "snb",
    label: "Swiss National Bank",
    currency: "CHF",
    codes: [{ code: "SNB_POLICY_RATE", label: "SNB Policy Rate" }],
  },
] as const;

async function getRates(): Promise<CentralBankRatesView[]> {
  const codes = bankConfigs.flatMap((bank) => bank.codes.map((series) => series.code));
  const indicators = await prisma.macroIndicator.findMany({
    where: { code: { in: [...codes] } },
    include: {
      values: {
        orderBy: { date: "asc" },
        take: 1200,
      },
    },
  });
  const byCode = new Map(indicators.map((indicator) => [indicator.code, indicator]));

  return bankConfigs.map((bank) => ({
    id: bank.id,
    label: bank.label,
    currency: bank.currency,
    series: bank.codes.map((config) => {
      const indicator = byCode.get(config.code);
      return {
        code: config.code,
        label: config.label,
        source: indicator?.source ?? null,
        points: (indicator?.values ?? []).map((point) => ({
          date: point.date.toISOString(),
          value: point.value.toNumber(),
        })),
      };
    }),
  }));
}

export default async function CentralBanksPage() {
  let banks: CentralBankRatesView[] | null = null;

  try {
    banks = await getRates();
  } catch (error) {
    console.error("Unable to load interest rates", error);
  }

  return banks ? (
    <InterestRatesDesk banks={banks} />
  ) : (
    <section className="desk-surface px-6 py-16 text-center text-[12px] text-[#777]">
      Interest-rate data unavailable. Check PostgreSQL and refresh.
    </section>
  );
}
