import { WatchlistTable } from "@/components/watchlist/WatchlistTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const OWNER_EMAIL = "joachim@private-macro-desk.local";
const MAIN_WATCHLIST_NAME = "Main Watchlist";

async function getMainWatchlist() {
  try {
    const watchlist = await prisma.watchlist.findFirst({
      where: {
        name: MAIN_WATCHLIST_NAME,
        user: { email: OWNER_EMAIL },
      },
      select: {
        id: true,
        name: true,
        items: {
          orderBy: { asset: { symbol: "asc" } },
          select: {
            id: true,
            bias: true,
            importantLevel: true,
            notes: true,
            asset: {
              select: {
                symbol: true,
                name: true,
                type: true,
                currency: true,
                country: true,
              },
            },
          },
        },
      },
    });

    return { watchlist, databaseError: false };
  } catch (error) {
    console.error("Unable to load the main watchlist", error);
    return { watchlist: null, databaseError: true };
  }
}

export default async function WatchlistPage() {
  const { watchlist, databaseError } = await getMainWatchlist();

  return (
    <>
      <PageHeader
        eyebrow="Desk / Shared view"
        title="Watchlist"
        description="Keep the shared market map in one place: what matters, where it matters and how the desk currently sees it."
      />

      {databaseError ? (
        <EmptyState
          title="Database unavailable"
          message="The desk cannot reach PostgreSQL right now. Start the database and check DATABASE_URL, then refresh this page."
        />
      ) : !watchlist ? (
        <EmptyState
          title="No watchlist found"
          message="Run the database seed once to create the shared Main Watchlist for this workspace."
        />
      ) : (
        <section className="desk-surface w-full min-w-0 max-w-full overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-[var(--line)] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7f8d83]">
                Shared market map
              </p>
              <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-[#e8ebe8]">{watchlist.name}</h2>
              <p className="mt-1 text-[12px] text-[#77817d]">
                {watchlist.items.length} tracked {watchlist.items.length === 1 ? "asset" : "assets"}
              </p>
            </div>
            <div className="flex w-fit items-center gap-2 rounded-full border border-[var(--line)] bg-[#0f1519] px-3 py-1.5 text-[10px] text-[#85908b]">
              <span className="size-1.5 rounded-full bg-[#9bad90]" />
              Saved to the shared desk
            </div>
          </div>

          {watchlist.items.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-[14px] font-medium text-[#d5dad7]">This watchlist is still empty.</p>
              <p className="mx-auto mt-2 max-w-md text-[12px] leading-5 text-[#717b77]">
                Run the latest seed to attach the starter instruments. They will appear here with their shared bias and notes.
              </p>
            </div>
          ) : (
            <WatchlistTable items={watchlist.items} />
          )}
        </section>
      )}
    </>
  );
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <section className="desk-surface px-6 py-16 text-center">
      <span className="mx-auto block h-px w-8 bg-[#56615b]" />
      <h2 className="mt-5 text-[15px] font-semibold text-[#d9ddda]">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-[13px] leading-6 text-[#78827e]">{message}</p>
    </section>
  );
}
