import type { MacroPulse } from "@/lib/dashboard";

const pulseRows = [
  { key: "ratesPressure", label: "Rates pressure" },
  { key: "inflationPulse", label: "Inflation pulse" },
  { key: "laborPulse", label: "Labor pulse" },
  { key: "usdPressure", label: "USD pressure" },
] as const;

export function MacroPulseCard({ pulse }: { pulse: MacroPulse }) {
  return (
    <article className="desk-surface p-4">
      <div>
        <p className="terminal-label">Macro Pulse</p>
        <h3 className="mt-2 text-[14px] font-semibold text-[#dfe4e0]">Real DB signals</h3>
      </div>

      <div className="mt-5 space-y-3">
        {pulseRows.map((row) => (
          <div key={row.key} className="rounded-lg border border-[var(--line)] bg-[#0f1519] px-3 py-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[10px] text-[#7f8984]">{row.label}</span>
              <span className={"text-right text-[11px] font-semibold " + getTone(pulse[row.key])}>{pulse[row.key]}</span>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function getTone(value: string) {
  if (value === "Not connected") return "text-[#626d68]";
  if (value.includes("Rising") || value.includes("Heating") || value.includes("Stronger") || value.includes("Softening")) return "text-[#e0bd73]";
  if (value.includes("Falling") || value.includes("Cooling") || value.includes("Softer")) return "text-[#9db89b]";
  return "text-[#cbd2ce]";
}

