"use server";

import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  DailyTrend,
  EntrySignal,
  EntryZone,
  Prisma,
  TradeDirection,
  TradeStatus,
} from "@prisma/client";
import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/actionState";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const SESSION_EXPIRED_MESSAGE = "Your session has expired. Please log in again.";

const MAX_SCREENSHOTS = 3;
const MAX_SCREENSHOT_SIZE = 5 * 1024 * 1024;
const SCREENSHOT_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);
const SCREENSHOT_DIRECTORY = path.join(process.cwd(), "public", "uploads", "trade-notes");

export type JournalActionState = ActionState;

export async function createTrade(
  _previousState: JournalActionState,
  formData: FormData,
): Promise<JournalActionState> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { status: "error", message: SESSION_EXPIRED_MESSAGE };
  }

  const assetId = getString(formData, "assetId");
  const direction = parseEnum(getString(formData, "direction"), TradeDirection);
  const status = parseEnum(getString(formData, "status"), TradeStatus);
  const thesis = getString(formData, "thesis").trim();
  const invalidation = getString(formData, "invalidation").trim();
  const strategyCode = getString(formData, "strategyCode").trim();
  const dailyTrend = parseOptionalEnum(getString(formData, "dailyTrend"), DailyTrend);
  const entryZone = parseOptionalEnum(getString(formData, "entryZone"), EntryZone);
  const entrySignal = parseOptionalEnum(getString(formData, "entrySignal"), EntrySignal);
  const setupValid = Boolean(dailyTrend) && Boolean(entryZone) && Boolean(entrySignal);

  if (!assetId || !direction) {
    return { status: "error", message: "Asset and direction are required." };
  }

  if (!status) {
    return { status: "error", message: "Choose a valid trade status." };
  }

  if (!thesis) {
    return { status: "error", message: "Write a thesis before saving the trade." };
  }

  if (thesis.length > 5_000 || invalidation.length > 2_000) {
    return { status: "error", message: "The thesis or invalidation text is too long." };
  }

  const decimalFields = [
    parseOptionalDecimal(formData, "entryPrice", "Entry price"),
    parseOptionalDecimal(formData, "stopLoss", "Stop loss"),
    parseOptionalDecimal(formData, "takeProfit", "Take profit"),
    parseOptionalDecimal(formData, "riskPercent", "Risk percent"),
  ] as const;

  const invalidDecimal = decimalFields.find((field) => field.error);

  if (invalidDecimal?.error) {
    return { status: "error", message: invalidDecimal.error };
  }

  try {
    const asset = await prisma.asset.findUnique({ where: { id: assetId }, select: { id: true } });

    if (!asset) {
      return { status: "error", message: "The selected asset no longer exists." };
    }

    const now = new Date();

    await prisma.trade.create({
      data: {
        assetId,
        userId: user.id,
        direction,
        status,
        entryPrice: decimalFields[0].value,
        stopLoss: decimalFields[1].value,
        takeProfit: decimalFields[2].value,
        riskPercent: decimalFields[3].value,
        thesis,
        invalidation: invalidation || null,
        strategyCode: strategyCode || null,
        dailyTrend,
        entryZone,
        entrySignal,
        setupValid,
        openedAt: status === TradeStatus.OPEN ? now : null,
        closedAt: status === TradeStatus.CLOSED ? now : null,
      },
    });

    revalidatePath("/journal");
    revalidatePath("/dashboard");
    return { status: "success", message: "Trade idea added to the journal." };
  } catch (error) {
    console.error("Unable to create trade", error);
    return { status: "error", message: "The trade could not be saved. Check PostgreSQL." };
  }
}

export async function updateTradeStatus(
  _previousState: JournalActionState,
  formData: FormData,
): Promise<JournalActionState> {
  try {
    await requireUser();
  } catch {
    return { status: "error", message: SESSION_EXPIRED_MESSAGE };
  }

  const tradeId = getString(formData, "tradeId");
  const status = parseEnum(getString(formData, "status"), TradeStatus);

  if (!tradeId || !status) {
    return { status: "error", message: "Trade and status are required." };
  }

  try {
    const trade = await prisma.trade.findUnique({
      where: { id: tradeId },
      select: { id: true, openedAt: true, closedAt: true },
    });

    if (!trade) {
      return { status: "error", message: "Trade not found." };
    }

    const now = new Date();

    await prisma.trade.update({
      where: { id: trade.id },
      data: {
        status,
        openedAt: status === TradeStatus.OPEN && !trade.openedAt ? now : undefined,
        closedAt: status === TradeStatus.CLOSED && !trade.closedAt ? now : undefined,
      },
    });

    revalidatePath("/journal");
    revalidatePath("/dashboard");
    return { status: "success", message: "Status updated." };
  } catch (error) {
    console.error("Unable to update trade status", error);
    return { status: "error", message: "The status could not be updated." };
  }
}

export async function updateTrade(
  _previousState: JournalActionState,
  formData: FormData,
): Promise<JournalActionState> {
  try {
    await requireUser();
  } catch {
    return { status: "error", message: SESSION_EXPIRED_MESSAGE };
  }

  const tradeId = getString(formData, "tradeId");
  if (!tradeId) {
    return { status: "error", message: "Trade is required." };
  }

  const thesis = getString(formData, "thesis").trim();
  const invalidation = getString(formData, "invalidation").trim();
  const strategyCode = getString(formData, "strategyCode").trim();
  const result = getString(formData, "result").trim();
  const mistakeTags = getString(formData, "mistakeTags")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  if (!thesis) {
    return { status: "error", message: "Write a thesis before saving the trade." };
  }

  if (thesis.length > 5_000 || invalidation.length > 2_000) {
    return { status: "error", message: "The thesis or invalidation text is too long." };
  }

  if (result.length > 2_000) {
    return { status: "error", message: "Result is too long." };
  }

  const decimalFields = [
    parseOptionalDecimal(formData, "entryPrice", "Entry price"),
    parseOptionalDecimal(formData, "stopLoss", "Stop loss"),
    parseOptionalDecimal(formData, "takeProfit", "Take profit"),
    parseOptionalDecimal(formData, "riskPercent", "Risk percent"),
  ] as const;

  const invalidDecimal = decimalFields.find((field) => field.error);

  if (invalidDecimal?.error) {
    return { status: "error", message: invalidDecimal.error };
  }

  try {
    const trade = await prisma.trade.findUnique({ where: { id: tradeId }, select: { id: true } });

    if (!trade) {
      return { status: "error", message: "Trade not found." };
    }

    // Asset and direction are deliberately not editable here — they define what the trade
    // actually was, and letting them change after the fact would make the journal's history
    // unreliable. Only correction-oriented fields (thesis, prices, and post-trade review
    // fields) can be revised.
    await prisma.trade.update({
      where: { id: trade.id },
      data: {
        thesis,
        invalidation: invalidation || null,
        strategyCode: strategyCode || null,
        result: result || null,
        mistakeTags,
        entryPrice: decimalFields[0].value,
        stopLoss: decimalFields[1].value,
        takeProfit: decimalFields[2].value,
        riskPercent: decimalFields[3].value,
      },
    });

    revalidatePath("/journal");
    revalidatePath("/dashboard");
    return { status: "success", message: "Trade updated." };
  } catch (error) {
    console.error("Unable to update trade", error);
    return { status: "error", message: "The trade could not be updated." };
  }
}

export async function deleteTrade(
  _previousState: JournalActionState,
  formData: FormData,
): Promise<JournalActionState> {
  try {
    await requireUser();
  } catch {
    return { status: "error", message: SESSION_EXPIRED_MESSAGE };
  }

  const tradeId = getString(formData, "tradeId");

  if (!tradeId) {
    return { status: "error", message: "Trade is required." };
  }

  try {
    const trade = await prisma.trade.findUnique({
      where: { id: tradeId },
      select: {
        id: true,
        notes: { select: { screenshotUrls: true } },
      },
    });

    if (!trade) {
      return { status: "error", message: "Trade not found." };
    }

    const screenshotUrls = trade.notes.flatMap((note) => note.screenshotUrls);

    await prisma.trade.delete({ where: { id: trade.id } });
    await removeScreenshots(screenshotUrls);

    revalidatePath("/journal");
    revalidatePath("/dashboard");
    return { status: "success", message: "Trade deleted." };
  } catch (error) {
    console.error("Unable to delete trade", error);
    return { status: "error", message: "The trade could not be deleted." };
  }
}
export async function addTradeNote(
  _previousState: JournalActionState,
  formData: FormData,
): Promise<JournalActionState> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { status: "error", message: SESSION_EXPIRED_MESSAGE };
  }

  const tradeId = getString(formData, "tradeId");
  const clientRequestId = getString(formData, "requestId");
  const content = getString(formData, "content").trim();
  const screenshots = getScreenshotFiles(formData);

  if (!tradeId || !clientRequestId) {
    return { status: "error", message: "Trade and request ID are required." };
  }

  if (!content && screenshots.length === 0) {
    return { status: "error", message: "Write a note or add at least one screenshot." };
  }

  if (content.length > 2_000) {
    return { status: "error", message: "Notes are limited to 2,000 characters." };
  }

  const screenshotError = validateScreenshots(screenshots);

  if (screenshotError) {
    return { status: "error", message: screenshotError };
  }

  let screenshotUrls: string[] = [];

  try {
    const existingNote = await prisma.tradeNote.findUnique({
      where: { clientRequestId },
      select: { id: true, screenshotUrls: true },
    });

    if (existingNote) {
      revalidatePath("/journal");
      return {
        status: "success",
        message: existingNote.screenshotUrls.length > 0 ? "Screenshot note already saved." : "Note already saved.",
      };
    }

    const trade = await prisma.trade.findUnique({ where: { id: tradeId }, select: { id: true } });

    if (!trade) {
      return { status: "error", message: "The trade no longer exists." };
    }

    screenshotUrls = await saveScreenshots(screenshots);

    await prisma.tradeNote.create({
      data: { tradeId: trade.id, userId: user.id, content, screenshotUrls, clientRequestId },
    });

    revalidatePath("/journal");
    return {
      status: "success",
      message: screenshotUrls.length > 0 ? "Screenshot note saved." : "Note added.",
    };
  } catch (error) {
    await removeScreenshots(screenshotUrls);

    if (isUniqueConstraintError(error)) {
      revalidatePath("/journal");
      return { status: "success", message: "Note already saved." };
    }

    console.error("Unable to add trade note", error);
    return { status: "error", message: "The note could not be saved." };
  }
}

function isUniqueConstraintError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getScreenshotFiles(formData: FormData) {
  return formData
    .getAll("screenshots")
    .filter((entry): entry is File => typeof entry !== "string" && entry.size > 0);
}

function validateScreenshots(files: File[]) {
  if (files.length > MAX_SCREENSHOTS) {
    return `Add no more than ${MAX_SCREENSHOTS} screenshots per note.`;
  }

  for (const file of files) {
    if (!SCREENSHOT_TYPES.has(file.type)) {
      return "Screenshots must be PNG, JPEG or WebP images.";
    }

    if (file.size > MAX_SCREENSHOT_SIZE) {
      return "Each screenshot must be 5 MB or smaller.";
    }
  }

  return null;
}

async function saveScreenshots(files: File[]) {
  if (files.length === 0) {
    return [];
  }

  await mkdir(SCREENSHOT_DIRECTORY, { recursive: true });
  const savedUrls: string[] = [];

  try {
    for (const file of files) {
      const extension = SCREENSHOT_TYPES.get(file.type);

      if (!extension) {
        throw new Error("Unsupported screenshot type.");
      }

      const filename = `${Date.now()}-${randomUUID()}.${extension}`;
      await writeFile(
        path.join(SCREENSHOT_DIRECTORY, filename),
        Buffer.from(await file.arrayBuffer()),
      );
      savedUrls.push(`/uploads/trade-notes/${filename}`);
    }

    return savedUrls;
  } catch (error) {
    await removeScreenshots(savedUrls);
    throw error;
  }
}

async function removeScreenshots(urls: string[]) {
  await Promise.all(
    urls.map((url) =>
      unlink(path.join(SCREENSHOT_DIRECTORY, path.basename(url))).catch(() => undefined),
    ),
  );
}

function parseEnum<T extends Record<string, string>>(value: string, enumObject: T) {
  return Object.values(enumObject).includes(value) ? (value as T[keyof T]) : null;
}

function parseOptionalEnum<T extends Record<string, string>>(value: string, enumObject: T) {
  if (!value || value === "NONE") return null;
  return Object.values(enumObject).includes(value) ? (value as T[keyof T]) : null;
}

function parseOptionalDecimal(formData: FormData, key: string, label: string) {
  const rawValue = getString(formData, key).trim().replace(",", ".");

  if (!rawValue) {
    return { value: null, error: null };
  }

  if (!Number.isFinite(Number(rawValue))) {
    return { value: null, error: `${label} must be a number or left empty.` };
  }

  try {
    return { value: new Prisma.Decimal(rawValue), error: null };
  } catch {
    return { value: null, error: `${label} must be a valid number.` };
  }
}
