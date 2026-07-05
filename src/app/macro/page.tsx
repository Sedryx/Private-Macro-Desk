import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";

export default function MacroPage() {
  return <><PageHeader eyebrow="Economy" title="Macro" description="Track the economic backdrop and the indicators that shape the trading regime." /><div className="grid gap-4 lg:grid-cols-2"><SectionCard title="Economic Indicators" description="Rates, inflation, employment, GDP and PMI will be grouped here." /><SectionCard title="Macro Regime" description="A concise view of growth and inflation dynamics will live here." /></div></>;
}
