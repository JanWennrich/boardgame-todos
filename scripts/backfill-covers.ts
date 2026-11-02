// One-off: finds barcode, BGG ID and cover for games added before those were stored, through the
// barcode cache and GameUPC. Shows what it would change; pass --write to store it. See README.

import { Redis } from "@upstash/redis";
import type { Game } from "../lib/games";

const redis = Redis.fromEnv();
const GAMEUPC_URL = process.env.GAMEUPC_API_URL ?? "https://api.gameupc.com/test";
const GAMEUPC_KEY = process.env.GAMEUPC_API_KEY ?? "test_test_test_test_test";
const write = process.argv.includes("--write");

type Remembered = { id?: number; name: string } | string | number;
type Info = { id: number; name: string; thumbnail_url?: string; image_url?: string };
type UpcInfo = { bgg_info_status?: string; bgg_info?: Info[] };

async function fetchUpc(code: string, search?: string): Promise<UpcInfo> {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  const res = await fetch(`${GAMEUPC_URL}/upc/${code}${query}`, {
    headers: { "x-api-key": GAMEUPC_KEY },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`GameUPC: HTTP ${res.status}`);
  return res.json();
}

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

// With a BGG ID only that game counts. Without one, the barcode must be verified at GameUPC or a
// search by name must find exactly one game of that name.
async function findGame(code: string, name: string, bggId?: number): Promise<[Info, string] | null> {
  const plain = await fetchUpc(code);
  if (bggId) {
    const hit = plain.bgg_info?.find((i) => i.id === bggId) ?? (await fetchUpc(code, name)).bgg_info?.find((i) => i.id === bggId);
    return hit ? [hit, "BGG-ID"] : null;
  }
  const first = plain.bgg_info?.[0];
  if (plain.bgg_info_status === "verified" && first) return [first, "verifiziert"];
  const named = (await fetchUpc(code, name)).bgg_info?.filter((i) => same(i.name, name)) ?? [];
  return named.length === 1 ? [named[0], "Name"] : null;
}

console.log(`GameUPC: ${GAMEUPC_URL}${write ? "" : " (Probelauf, --write speichert)"}\n`);

const games = Object.values((await redis.hgetall<Record<string, Game>>("games")) ?? {});
// String(): the client parses stored JSON, so a name like "1830" comes back as a number.
const cache = Object.entries((await redis.hgetall<Record<string, Remembered>>("barcodes")) ?? {}).map(
  ([code, v]) => [code, typeof v === "object" ? v : { name: String(v) }] as const,
);

for (const game of games.filter((g) => !g.thumbnailUrl)) {
  const cached = cache.find(([code, v]) => (game.barcode ? code === game.barcode : same(v.name, game.name)));
  const code = game.barcode ?? cached?.[0];
  if (!code) {
    console.log(`–  ${game.name}: kein Barcode bekannt`);
    continue;
  }
  const bggId = game.bggId ?? cached?.[1].id;
  let found;
  try {
    found = await findGame(code, game.name, bggId);
  } catch (error) {
    console.log(`!  ${game.name} (${code}): ${error}`);
    continue;
  }
  if (!found) {
    console.log(`–  ${game.name} (${code}): kein sicherer Treffer bei GameUPC`);
    continue;
  }

  const [info, via] = found;
  const details = { barcode: code, bggId: info.id, thumbnailUrl: info.thumbnail_url, imageUrl: info.image_url };
  console.log(`✓  ${game.name} (${code}) → ${info.name}, BGG ${info.id} [${via}]`);
  if (!write) continue;

  // Read again right before writing, so a change made in the app meanwhile isn't lost.
  const current = await redis.hget<Game>("games", game.id);
  if (current) await redis.hset("games", { [game.id]: { ...current, ...details } });
  if (cached) {
    const { thumbnailUrl, imageUrl } = details;
    await redis.hset("barcodes", { [code]: { id: info.id, name: cached[1].name, thumbnailUrl, imageUrl } });
  }
}
