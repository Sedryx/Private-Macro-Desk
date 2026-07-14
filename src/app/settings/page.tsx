import { SettingsForm } from "@/components/settings/SettingsForm";
import { TraderSettingsList, type TraderSettingsUser } from "@/components/settings/TraderSettingsList";
import { PageHeader } from "@/components/ui/PageHeader";
import { getSettingsCopy } from "@/lib/i18n/settings";
import { getOrCreateWorkspaceSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getSettingsPageData() {
  try {
    const [settings, users] = await Promise.all([
      getOrCreateWorkspaceSettings(),
      prisma.user.findMany({ orderBy: { createdAt: "asc" }, select: { id: true, name: true, email: true, role: true } }),
    ]);

    return {
      settings,
      users: users.map((user): TraderSettingsUser => ({ ...user })),
    };
  } catch (error) {
    console.error("Unable to load settings", error);
    return null;
  }
}

export default async function SettingsPage() {
  const data = await getSettingsPageData();
  const language = data?.settings.language === "fr" ? "fr" : "en";
  const pageCopy = getSettingsCopy(language).page;

  return (
    <>
      <PageHeader eyebrow={pageCopy.eyebrow} title={pageCopy.title} />

      {!data ? (
        <section className="desk-surface px-6 py-16 text-center">
          <span className="mx-auto block h-px w-8 bg-[#56615b]" />
          <h2 className="mt-5 text-[15px] font-semibold text-[#d9ddda]">{pageCopy.unavailableTitle}</h2>
          <p className="mx-auto mt-2 max-w-lg text-[13px] leading-6 text-[#78827e]">
            {pageCopy.unavailableDescription}
          </p>
        </section>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <SettingsForm settings={data.settings} />
          <TraderSettingsList users={data.users} language={language} />
        </div>
      )}
    </>
  );
}
