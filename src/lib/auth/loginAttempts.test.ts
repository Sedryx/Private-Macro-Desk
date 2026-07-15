import { beforeEach, describe, expect, it, vi } from "vitest";

import { clearLoginAttempts, getLockoutRemainingSeconds, recordFailedLogin } from "@/lib/auth/loginAttempts";

const EMAIL = "trader@private-macro-desk.local";

describe("login attempt lockout", () => {
  beforeEach(() => {
    clearLoginAttempts(EMAIL);
    vi.useRealTimers();
  });

  it("is not locked out before the failure threshold is reached", () => {
    for (let i = 0; i < 4; i += 1) recordFailedLogin(EMAIL);
    expect(getLockoutRemainingSeconds(EMAIL)).toBe(0);
  });

  it("locks out after 5 failed attempts within the window", () => {
    for (let i = 0; i < 5; i += 1) recordFailedLogin(EMAIL);
    expect(getLockoutRemainingSeconds(EMAIL)).toBeGreaterThan(0);
  });

  it("is case-insensitive on email", () => {
    for (let i = 0; i < 5; i += 1) recordFailedLogin(EMAIL.toUpperCase());
    expect(getLockoutRemainingSeconds(EMAIL)).toBeGreaterThan(0);
  });

  it("clears the lockout for a fresh login attempt", () => {
    for (let i = 0; i < 5; i += 1) recordFailedLogin(EMAIL);
    expect(getLockoutRemainingSeconds(EMAIL)).toBeGreaterThan(0);
    clearLoginAttempts(EMAIL);
    expect(getLockoutRemainingSeconds(EMAIL)).toBe(0);
  });

  it("does not lock out an unrelated email", () => {
    for (let i = 0; i < 5; i += 1) recordFailedLogin(EMAIL);
    expect(getLockoutRemainingSeconds("someone-else@private-macro-desk.local")).toBe(0);
  });
});
