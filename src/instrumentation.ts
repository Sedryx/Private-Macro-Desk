export async function register() {
  if (
    process.env.NEXT_RUNTIME !== "nodejs" ||
    process.env.NEXT_PHASE === "phase-production-build"
  ) {
    return;
  }

  const { ensureDefaultUsers } = await import("@/lib/auth/bootstrap");
  await ensureDefaultUsers();

  const { startFredScheduler } = await import("@/lib/data/fredScheduler");
  startFredScheduler();
}
