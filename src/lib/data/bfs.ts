export async function syncBfsSeries(): Promise<never> {
  throw new Error("BFS provider is not used by the current global macro sync.");
}
