import Link from "next/link";

import type { CalendarBriefingEvent } from "@/lib/dashboard";

type CalendarBriefingWidgetProps = {
  events: CalendarBriefingEvent[];
  todayKey: string;
  tomorrowKey: string;
};

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Zurich",
});

export function CalendarBriefingWidget({ events, todayKey, tomorrowKey }: CalendarBriefingWidgetProps) {
  const todayEvents = events.filter((event) => event.dayKey === todayKey);
  const tomorrowEvents = events.filter((event) => event.dayKey === tomorrowKey);

  return (
    <article className="desk-surface overflow-hidden">
      <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] px-4 py-4">
        <div>
          <p className="terminal-label">Calendar</p>
          <h3 className="mt-2 text-[14px] font-semibold text-[#dfe4e0]">Today / Tomorrow Calendar</h3>
        </div>
        <Link href="/calendar" className="text-[10px] font-medium text-[#aeb8b2] transition hover:text-white">
          Open calendar -&gt;
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="px-4 py-8 text-center text-[12px] text-[#68736e]">No high or medium impact events for today or tomorrow.</div>
      ) : (
        <div className="divide-y divide-[var(--line)]">
          <EventDay title="Today" events={todayEvents} />
          <EventDay title="Tomorrow" events={tomorrowEvents} />
        </div>
      )}
    </article>
  );
}

function EventDay({ title, events }: { title: string; events: CalendarBriefingEvent[] }) {
  return (
    <div className="px-4 py-3">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7f8b84]">{title}</p>
      {events.length === 0 ? (
        <p className="py-3 text-[11px] text-[#68736e]">No events.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-[11px]">
            <thead className="text-[9px] uppercase tracking-[0.12em] text-[#5f6965]">
              <tr>
                <th className="w-[58px] py-2 font-medium">Time</th>
                <th className="w-[54px] py-2 font-medium">CCY</th>
                <th className="py-2 font-medium">Event</th>
                <th className="w-[74px] py-2 font-medium">Impact</th>
                <th className="w-[170px] py-2 text-right font-medium">A / F / P</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#20282d]">
              {events.map((event) => (
                <tr key={event.id} className={event.importance === "HIGH" ? "bg-[#231717]/50" : undefined}>
                  <td className="py-2 font-mono text-[#a6aea9]">{timeFormatter.format(new Date(event.eventTime))}</td>
                  <td className="py-2 font-semibold text-[#dfe4e0]">{event.currency ?? event.country ?? "-"}</td>
                  <td className="py-2 text-[#cbd2ce]">{event.title}</td>
                  <td className="py-2"><ImpactBadge impact={event.importance} /></td>
                  <td className="py-2 text-right font-mono text-[#8b958f]">
                    {event.actualValue ?? "-"} / {event.forecastValue ?? "-"} / {event.previousValue ?? "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ImpactBadge({ impact }: { impact: CalendarBriefingEvent["importance"] }) {
  const classes = {
    HIGH: "border-[#5f2b2b] bg-[#251313] text-[#ff8b8b]",
    MEDIUM: "border-[#594823] bg-[#211b11] text-[#e0bd73]",
    LOW: "border-[#333b3a] bg-[#12191b] text-[#8e9994]",
  };

  return <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${classes[impact]}`}>{impact}</span>;
}
