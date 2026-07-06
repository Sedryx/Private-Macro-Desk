"use server";

import { AssetType, Bias } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

const OWNER_EMAIL = "joachim@private-macro-desk.local";

export type WatchlistActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export type UpdateWatchlistItemState = WatchlistActionState;

export async function createWatchlist(
  _previousState: WatchlistActionState,
  formData: FormData,
): Promise<WatchlistActionState> {
  const name = getString(formData, "name").trim();
  if (!name) return error("Watchlist name is required.");
  if (name.length > 80) return error("Watchlist name is limited to 80 characters.");

  try {
    const owner = await prisma.user.findUnique({ where: { email: OWNER_EMAIL } });
    if (!owner) return error("OWNER user not found. Run the database seed.");

    const duplicate = await prisma.watchlist.findFirst({
      where: { userId: owner.id, name: { equals: name, mode: "insensitive" } },
      select: { id: true },
    });
    if (duplicate) return error("A watchlist with this name already exists.");

    await prisma.watchlist.create({ data: { name, userId: owner.id } });
    revalidateWatchlist();
    return success("Watchlist created.");
  } catch (caught) {
    return actionFailure("Unable to create watchlist", caught);
  }
}

export async function renameWatchlist(
  _previousState: WatchlistActionState,
  formData: FormData,
): Promise<WatchlistActionState> {
  const watchlistId = getString(formData, "watchlistId");
  const name = getString(formData, "name").trim();
  if (!watchlistId || !name) return error("Watchlist and name are required.");
  if (name.length > 80) return error("Watchlist name is limited to 80 characters.");

  try {
    const watchlist = await findOwnedWatchlist(watchlistId);
    if (!watchlist) return error("Watchlist not found.");

    const duplicate = await prisma.watchlist.findFirst({
      where: {
        userId: watchlist.userId,
        id: { not: watchlist.id },
        name: { equals: name, mode: "insensitive" },
      },
      select: { id: true },
    });
    if (duplicate) return error("A watchlist with this name already exists.");

    await prisma.watchlist.update({ where: { id: watchlist.id }, data: { name } });
    revalidateWatchlist();
    return success("Watchlist renamed.");
  } catch (caught) {
    return actionFailure("Unable to rename watchlist", caught);
  }
}

export async function deleteWatchlist(
  _previousState: WatchlistActionState,
  formData: FormData,
): Promise<WatchlistActionState> {
  const watchlistId = getString(formData, "watchlistId");
  if (!watchlistId) return error("Watchlist is required.");

  try {
    const watchlist = await findOwnedWatchlist(watchlistId);
    if (!watchlist) return error("Watchlist not found.");

    await prisma.watchlist.delete({ where: { id: watchlist.id } });
    revalidateWatchlist();
    return success("Watchlist deleted.");
  } catch (caught) {
    return actionFailure("Unable to delete watchlist", caught);
  }
}

export async function addAssetToWatchlist(
  _previousState: WatchlistActionState,
  formData: FormData,
): Promise<WatchlistActionState> {
  const watchlistId = getString(formData, "watchlistId");
  const assetId = getString(formData, "assetId");
  if (!watchlistId || !assetId) return error("Select an asset first.");

  try {
    const watchlist = await findOwnedWatchlist(watchlistId);
    if (!watchlist) return error("Watchlist not found.");

    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      select: { id: true, symbol: true },
    });
    if (!asset) return error("Asset not found.");

    const existing = await prisma.watchlistItem.findUnique({
      where: { watchlistId_assetId: { watchlistId, assetId } },
      select: { id: true },
    });
    if (existing) return error(`${asset.symbol} is already in this watchlist.`);

    await prisma.watchlistItem.create({ data: { watchlistId, assetId } });
    revalidateWatchlist();
    return success(`${asset.symbol} added.`);
  } catch (caught) {
    return actionFailure("Unable to add asset", caught);
  }
}

export async function createCustomAssetAndAddToWatchlist(
  _previousState: WatchlistActionState,
  formData: FormData,
): Promise<WatchlistActionState> {
  const watchlistId = getString(formData, "watchlistId");
  const symbol = normalizeSymbol(getString(formData, "symbol"));
  const name = getString(formData, "name").trim();
  const type = parseAssetType(getString(formData, "type"));
  const currency = getString(formData, "currency").trim().toUpperCase();
  const country = getString(formData, "country").trim().toUpperCase();
  const exchange = getString(formData, "exchange").trim().toUpperCase();

  if (!watchlistId) return error("Watchlist is required.");
  if (!symbol) return error("Symbol is required.");
  if (!/^[A-Z0-9._:/-]+$/.test(symbol)) {
    return error("Symbol contains unsupported characters.");
  }
  if (symbol.length > 30) return error("Symbol is limited to 30 characters.");
  if (!name) return error("Asset name is required.");
  if (name.length > 100) return error("Asset name is limited to 100 characters.");
  if (!type) return error("Select a valid asset type.");
  if (currency.length > 12 || country.length > 12 || exchange.length > 40) {
    return error("One of the optional fields is too long.");
  }

  try {
    const watchlist = await findOwnedWatchlist(watchlistId);
    if (!watchlist) return error("Watchlist not found.");

    const result = await prisma.$transaction(async (transaction) => {
      const existingAsset = await transaction.asset.findUnique({
        where: { symbol_type: { symbol, type } },
      });
      const asset =
        existingAsset ??
        (await transaction.asset.create({
          data: {
            symbol,
            name,
            type,
            currency: currency || null,
            country: country || null,
            exchange: exchange || null,
          },
        }));
      const existingItem = await transaction.watchlistItem.findUnique({
        where: {
          watchlistId_assetId: { watchlistId: watchlist.id, assetId: asset.id },
        },
      });

      if (existingItem) return { asset, created: !existingAsset, added: false };

      await transaction.watchlistItem.create({
        data: { watchlistId: watchlist.id, assetId: asset.id },
      });
      return { asset, created: !existingAsset, added: true };
    });

    if (!result.added) {
      return error(`${result.asset.symbol} already exists in this watchlist.`);
    }

    revalidateWatchlist();
    return success(
      result.created
        ? `${result.asset.symbol} created and added.`
        : `${result.asset.symbol} already existed and was added.`,
    );
  } catch (caught) {
    return actionFailure("Unable to create custom asset", caught);
  }
}

export async function removeAssetFromWatchlist(
  _previousState: WatchlistActionState,
  formData: FormData,
): Promise<WatchlistActionState> {
  const itemId = getString(formData, "itemId");
  if (!itemId) return error("Missing watchlist item.");

  try {
    const item = await findOwnedItem(itemId);
    if (!item) return error("Watchlist item not found.");

    await prisma.watchlistItem.delete({ where: { id: item.id } });
    revalidateWatchlist();
    return success("Asset removed from this watchlist.");
  } catch (caught) {
    return actionFailure("Unable to remove asset", caught);
  }
}

export async function updateWatchlistItem(
  _previousState: UpdateWatchlistItemState,
  formData: FormData,
): Promise<UpdateWatchlistItemState> {
  const itemId = getString(formData, "itemId");
  const rawBias = getString(formData, "bias");
  const importantLevel = getString(formData, "importantLevel").trim();
  const notes = getString(formData, "notes").trim();

  if (!itemId) return error("Missing watchlist item.");
  const bias = rawBias === "" ? null : parseBias(rawBias);
  if (rawBias !== "" && bias === null) return error("Invalid bias value.");
  if (importantLevel.length > 100) {
    return error("Important level is limited to 100 characters.");
  }
  if (notes.length > 2_000) return error("Notes are limited to 2,000 characters.");

  try {
    const item = await findOwnedItem(itemId);
    if (!item) return error("Watchlist item not found.");

    await prisma.watchlistItem.update({
      where: { id: item.id },
      data: {
        bias,
        importantLevel: importantLevel || null,
        notes: notes || null,
      },
    });
    revalidateWatchlist();
    return success("Changes saved.");
  } catch (caught) {
    return actionFailure("Unable to update watchlist item", caught);
  }
}

async function findOwnedWatchlist(id: string) {
  return prisma.watchlist.findFirst({
    where: { id, user: { email: OWNER_EMAIL } },
    select: { id: true, userId: true },
  });
}

async function findOwnedItem(id: string) {
  return prisma.watchlistItem.findFirst({
    where: { id, watchlist: { user: { email: OWNER_EMAIL } } },
    select: { id: true },
  });
}

function normalizeSymbol(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function parseBias(value: string): Bias | null {
  return Object.values(Bias).includes(value as Bias) ? (value as Bias) : null;
}

function parseAssetType(value: string): AssetType | null {
  return Object.values(AssetType).includes(value as AssetType)
    ? (value as AssetType)
    : null;
}

function revalidateWatchlist() {
  revalidatePath("/watchlist");
  revalidatePath("/dashboard");
}

function success(message: string): WatchlistActionState {
  return { status: "success", message };
}

function error(message: string): WatchlistActionState {
  return { status: "error", message };
}

function actionFailure(label: string, caught: unknown): WatchlistActionState {
  console.error(label, caught);
  return error("Database action failed. Check the connection and try again.");
}
