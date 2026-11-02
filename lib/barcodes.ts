import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();
const KEY = "barcodes";

// gameupc.com maps barcodes to BoardGameGeek games. The test server works with the public
// test key; for the production database (/v1) request a key by email.
const GAMEUPC_URL = process.env.GAMEUPC_API_URL ?? "https://api.gameupc.com/test";
const GAMEUPC_KEY = process.env.GAMEUPC_API_KEY ?? "test_test_test_test_test";

// The cover URLs point to BGG's image host; GameUPC copies them from there.
export type Match = { id?: number; name: string; thumbnailUrl?: string; imageUrl?: string };
export type Game = Match & { id: number; year?: string };

// Either a game we are sure about, or suggestions (possibly none) for the user to pick from or search past.
export type Lookup = { found: Match } | { suggestions: Game[]; searchedFor: string };

// Entries from before BGG IDs were stored hold just the name.
type Remembered = Match | string | number;

type UpcInfo = {
  bgg_info_status?: string;
  searched_for?: string;
  bgg_info?: { id: number; name: string; published?: string; thumbnail_url?: string; image_url?: string }[];
};

// Scanners report UPC-A either as 12 digits or as EAN-13 with a leading 0; GameUPC keys on the 12-digit form.
export function normalizeBarcode(code: string): string | null {
  if (!/^\d{12,13}$/.test(code)) return null;
  return code.length === 13 && code.startsWith("0") ? code.slice(1) : code;
}

async function fetchUpc(code: string, search?: string): Promise<UpcInfo> {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  try {
    const res = await fetch(`${GAMEUPC_URL}/upc/${code}${query}`, {
      headers: { "x-api-key": GAMEUPC_KEY },
      signal: AbortSignal.timeout(8000),
    });
    return res.ok ? await res.json() : {};
  } catch {
    return {};
  }
}

// Best match first.
function games(info: UpcInfo): Game[] {
  // GameUPC sends "0" for an unknown year.
  return (info.bgg_info ?? [])
    .slice(0, 5)
    .map(({ id, name, published, thumbnail_url, image_url }) => ({
      id,
      name,
      year: published && published !== "0" ? published : undefined,
      thumbnailUrl: thumbnail_url,
      imageUrl: image_url,
    }));
}

export async function lookupBarcode(code: string): Promise<Lookup> {
  const known = await redis.hget<Remembered>(KEY, code);
  // String(): the client parses stored JSON, so a name like "1830" comes back as a number.
  if (known != null) return { found: typeof known === "object" ? known : { name: String(known) } };

  const info = await fetchUpc(code);
  const suggestions = games(info);
  if (info.bgg_info_status === "verified" && suggestions.length) return { found: suggestions[0] };
  return { suggestions, searchedFor: info.searched_for ?? "" };
}

export async function searchGames(code: string, query: string): Promise<Game[]> {
  return games(await fetchUpc(code, query));
}

export async function rememberBarcode(code: string, game: Match) {
  await redis.hset(KEY, { [code]: game });
}

// Votes for the game the user picked, so the barcode becomes verified for everyone.
// GameUPC wants a stable ID per device with every vote, to undo a misbehaving one.
export async function reportGame(code: string, bggId: number, userId: string) {
  // Adding the game matters more than the vote, so failures only go to the log.
  try {
    const res = await fetch(`${GAMEUPC_URL}/upc/${code}/bgg_id/${bggId}`, {
      method: "POST",
      headers: { "x-api-key": GAMEUPC_KEY, "content-type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.warn(`GameUPC vote for ${code} failed: HTTP ${res.status} ${await res.text()}`);
  } catch (error) {
    console.warn(`GameUPC vote for ${code} failed:`, error);
  }
}
