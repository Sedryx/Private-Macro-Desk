import { DataSourceStatusCards, type DataSourceStatus } from "@/components/settings/DataSourceStatusCards";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { TraderSettingsList, type TraderSettingsUser } from "@/components/settings/TraderSettingsList";
import { PageHeader } from "@/components/ui/PageHeader";
import { getOrCreateWorkspaceSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getSettingsPageData() {
  try {
    const [settings, users, macroStats, calendarStats, secStats] = await Promise.all([
      getOrCreateWorkspaceSettings(),
      prisma.user.findMany({ orderBy: { createdAt: "asc" }, select: { id: true, name: true, email: true, role: true } }),
      prisma.macroValue.aggregate({ _count: { _all: true }, _max: { createdAt: true } }),
      prisma.economicEvent.findFirst({
        where: { OR: [{ provider: { not: null } }, { source: { not: null } }] },
        orderBy: { updatedAt: "desc" },
        select: { updatedAt: true, provider: true, source: true },
      }),
      prisma.researchDocument.findFirst({
        where: { provider: { contains: "SEC" } },
        orderBy: { updatedAt: "desc" },
        select: { updatedAt: true, provider: true },
      }),
    ]);

    const sources: DataSourceStatus[] = [
      {
        name: "FRED / Macro",
        connected: macroStats._count._all > 0,
        detail: `${macroStats._count._all} macro values stored`,
        latestSyncedAt: macroStats._max.createdAt?.toISOString() ?? null,
      },
      {
        name: "Forex Factory",
        connected: Boolean(calendarStats),
        detail: calendarStats?.provider ?? calendarStats?.source ?? "No events synced yet",
        latestSyncedAt: calendarStats?.updatedAt.toISOString() ?? null,
      },
      {
        name: "SEC EDGAR",
        connected: Boolean(secStats),
        detail: secStats?.provider ?? "No official docs synced yet",
        latestSyncedAt: secStats?.updatedAt.toISOString() ?? null,
      },
    ];

    return {
      settings,
      users: users.map((user): TraderSettingsUser => ({ ...user })),
      sources,
    };
  } catch (error) {
    console.error("Unable to load settings", error);
    return null;
  }
}

export default async function SettingsPage() {
  const data = await getSettingsPageData();

  return (
    <>
      <PageHeader
        eyebrow="Workspace / Settings"
        title="Desk settings"
        description="Private workspace preferences for display, traders and source visibility. No secrets are shown here."
      />

      {!data ? (
        <section className="desk-surface px-6 py-16 text-center">
          <span className="mx-auto block h-px w-8 bg-[#56615b]" />
          <h2 className="mt-5 text-[15px] font-semibold text-[#d9ddda]">Settings unavailable</h2>
          <p className="mx-auto mt-2 max-w-lg text-[13px] leading-6 text-[#78827e]">
            The app cannot reach PostgreSQL. Start the database and check DATABASE_URL, then refresh this page.
          </p>
        </section>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <SettingsForm settings={data.settings} />
          <div className="space-y-5">
            <TraderSettingsList users={data.users} />
            <DataSourceStatusCards sources={data.sources} />
          </div>
        </div>
      )}
    </>
  );
}

