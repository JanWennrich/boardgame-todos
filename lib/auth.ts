import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "session";

function appPassword() {
  const password = process.env.APP_PASSWORD;
  if (!password) throw new Error("APP_PASSWORD ist nicht gesetzt");
  return password;
}

// Derived from the password, so changing APP_PASSWORD logs everyone out.
export function sessionToken() {
  return createHmac("sha256", appPassword()).update("boardgame-todos-session").digest("hex");
}

function safeEqual(a: string, b: string) {
  const hash = (s: string) => createHash("sha256").update(s).digest();
  return timingSafeEqual(hash(a), hash(b));
}

export function isValidSession(token: string | undefined) {
  return token !== undefined && safeEqual(token, sessionToken());
}

export function isValidPassword(input: string) {
  return safeEqual(input, appPassword());
}
