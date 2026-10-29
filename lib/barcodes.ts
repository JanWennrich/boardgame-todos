import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();
const KEY = "barcodes";

// gameupc.com maps barcodes to BoardGameGeek games. The test server works with the public
// test key; for the production database (/v1) request a key by email.
const GAMEUPC_URL = process.env.GAMEUPC_API_URL ?? "https://api.gameupc.com/test";
const GAMEUPC_KEY = process.env.GAMEUPC_API_KEY ?? "test_test_test_test_test";

// Scanners report UPC-A either as 12 digits or as EAN-13 with a leading 0; GameUPC keys on the 12-digit form.
export function normalizeBarcode(code: string): string | null {
  if (!/^\d{12,13}$/.test(code)) return null;
  return code.length === 13 && code.startsWith("0") ? code.slice(1) : code;
}

// Returns candidate game names, best match first.
export async function lookupBarcode(code: string): Promise<string[]> {
  const known = await redis.hget<string>(KEY, code);
  // String(): the client parses stored JSON, so a name like "1830" comes back as a number.
  if (known != null) return [String(known)];

  try {
    const res = await fetch(`${GAMEUPC_URL}/upc/${code}`, {
      headers: { "x-api-key": GAMEUPC_KEY },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data: { bgg_info?: { name: string }[] } = await res.json();
    return [...new Set((data.bgg_info ?? []).map((g) => g.name))].slice(0, 5);
  } catch {
    return [];
  }
}

export async function rememberBarcode(code: string, name: string) {
  await redis.hset(KEY, { [code]: name });
}
