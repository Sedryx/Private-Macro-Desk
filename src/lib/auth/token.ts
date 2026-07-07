export const SESSION_COOKIE_NAME = "pmd_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

export type SessionPayload = {
  userId: string;
  exp: number;
};

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is not configured.");
  }

  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function base64UrlEncode(bytes: ArrayBuffer | Uint8Array) {
  const buffer = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (const byte of buffer) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  const key = await getSecretKey();
  const payloadJson = JSON.stringify(payload);
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(payloadJson));
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64));
  const signatureB64 = base64UrlEncode(signature);
  return `${payloadB64}.${signatureB64}`;
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  const [payloadB64, signatureB64] = token.split(".");
  if (!payloadB64 || !signatureB64) return null;

  try {
    const key = await getSecretKey();
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlDecode(signatureB64),
      new TextEncoder().encode(payloadB64),
    );

    if (!valid) return null;

    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadB64))) as SessionPayload;

    if (typeof payload.userId !== "string" || typeof payload.exp !== "number") return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch {
    return null;
  }
}

export async function createSessionToken(userId: string) {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  return signSessionToken({ userId, exp });
}
