import { MacroCommandCenter } from "@/components/macro/MacroCommandCenter";
import { getLatestDailyBrief } from "@/lib/ai/dailyBrief";
import { getCurrencyVolatilitySeries } from "@/lib/data/currencyVolatility.server";
import { getMacroProfiles } from "@/lib/macroProfiles.server";

export const dynamic = "force-dynamic";

export default async function MacroPage() {
  const [profiles, dailyBrief, currencySeries] = await Promise.all([
    getMacroProfiles(),
    getLatestDailyBrief(),
    getCurrencyVolatilitySeries(),
  ]);

  return <MacroCommandCenter profiles={profiles} dailyBrief={dailyBrief} currencySeries={currencySeries} />;
}
