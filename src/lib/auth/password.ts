import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SCRYPT_KEY_LENGTH = 64;
const SALT_LENGTH = 16;

export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_LENGTH);
  const derivedKey = scryptSync(password, salt, SCRYPT_KEY_LENGTH);
  return `scrypt:${salt.toString("hex")}:${derivedKey.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") {
    return false;
  }

  const [, saltHex, hashHex] = parts;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");

  if (expected.length !== SCRYPT_KEY_LENGTH) {
    return false;
  }

  const actual = scryptSync(password, salt, SCRYPT_KEY_LENGTH);
  return timingSafeEqual(actual, expected);
}
