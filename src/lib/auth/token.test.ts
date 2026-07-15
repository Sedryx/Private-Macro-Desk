import { beforeAll, describe, expect, it } from "vitest";

beforeAll(() => {
  process.env.AUTH_SECRET = "test-secret-do-not-use-in-production";
});

describe("session tokens", () => {
  it("round-trips a valid token", async () => {
    const { createSessionToken, verifySessionToken } = await import("@/lib/auth/token");
    const token = await createSessionToken("user-123");
    const payload = await verifySessionToken(token);
    expect(payload?.userId).toBe("user-123");
  });

  it("rejects a tampered token", async () => {
    const { createSessionToken, verifySessionToken } = await import("@/lib/auth/token");
    const token = await createSessionToken("user-123");
    const [payloadB64, signatureB64] = token.split(".");
    const tampered = `${payloadB64}x.${signatureB64}`;
    expect(await verifySessionToken(tampered)).toBeNull();
  });

  it("rejects an expired token", async () => {
    const { signSessionToken, verifySessionToken } = await import("@/lib/auth/token");
    const expired = await signSessionToken({ userId: "user-123", exp: Math.floor(Date.now() / 1000) - 10 });
    expect(await verifySessionToken(expired)).toBeNull();
  });

  it("rejects a malformed token instead of throwing", async () => {
    const { verifySessionToken } = await import("@/lib/auth/token");
    expect(await verifySessionToken("not-a-token")).toBeNull();
    expect(await verifySessionToken("")).toBeNull();
  });
});
