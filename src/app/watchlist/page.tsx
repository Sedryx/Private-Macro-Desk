import { UserRole } from "@prisma/client";

import { CreateWatchlistForm } from "@/components/watchlist/CreateWatchlistForm";
import { WatchlistBoard } from "@/components/watchlist/WatchlistBoard";
import { PageHeader } from "@/components/ui/PageHeader";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getWatchlistData() {
  try {
    const owner = await prisma.user.findFirst({
      where: { role: UserRole.OWNER },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        watchlists: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            name: true,
            items: {
              orderBy: { asset: { symbol: "asc" } },
              select: {
                id: true,
                assetId: true,
                bias: true,
                importantLevel: true,
                notes: true,
                asset: {
                  select: {
                    id: true,
                    symbol: true,
                    name: true,
                    type: true,
                    currency: true,
                    country: true,
                    exchange: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    const assets = await prisma.asset.findMany({
      orderBy: [{ symbol: "asc" }, { type: "asc" }],
      select: {
        id: true,
        symbol: true,
        name: true,
        type: true,
        currency: true,
        country: true,
        exchange: true,
      },
    });

    return {
      ownerFound: Boolean(owner),
      watchlists: owner?.watchlists ?? [],
      assets,
      databaseError: false,
    };
  } catch (error) {
    console.error("Unable to load watchlists", error);
    return {
      ownerFound: false,
      watchlists: [],
      assets: [],
      databaseError: true,
    };
  }
}

export default async function WatchlistPage() {
  const { ownerFound, watchlists, assets, databaseError } =
    await getWatchlistData();

  return (
    <>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <PageHeader
          eyebrow="Desk / Shared view"
          title="Watchlists"
          description="Shared market map, organised into focused lists."
        />
        {ownerFound ? <CreateWatchlistForm /> : null}
      </div>

      {databaseError ? (
        <EmptyState
          title="Database unavailable"
          message="Start PostgreSQL and check DATABASE_URL, then refresh this page."
        />
      ) : !ownerFound ? (
        <EmptyState
          title="OWNER user not found"
          message="Run the database seed once to create the private desk users."
        />
      ) : watchlists.length === 0 ? (
        <EmptyState
          title="No watchlist created yet"
          message="Create your first watchlist above to start organising the desk."
        />
      ) : (
        <WatchlistBoard watchlists={watchlists} assets={assets} />
      )}
    </>
  );
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <section className="desk-surface px-6 py-16 text-center">
      <span className="mx-auto block h-px w-8 bg-[#56615b]" />
      <h2 className="mt-5 text-[15px] font-semibold text-[#d9ddda]">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-[13px] leading-6 text-[#78827e]">
        {message}
      </p>
    </section>
  );
}
