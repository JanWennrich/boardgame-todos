import { randomUUID } from "node:crypto";
import { Redis } from "@upstash/redis";

// Reads UPSTASH_REDIS_REST_* or the KV_REST_API_* variables set by the Vercel integration.
const redis = Redis.fromEnv();
const KEY = "games";

// What a barcode scan found out about the game; all of it is missing for games added by name.
export type Details = { barcode?: string; bggId?: number; thumbnailUrl?: string; imageUrl?: string };
export type Game = Details & { id: string; name: string; addedAt: number; playedAt?: number };

export async function listGames(): Promise<Game[]> {
  const games = await redis.hgetall<Record<string, Game>>(KEY);
  return Object.values(games ?? {}).sort((a, b) => a.addedAt - b.addedAt);
}

// Returns the existing game instead of adding a second one with the same name.
// A game that was already played goes back on the list.
export async function addGame(name: string, details: Details = {}): Promise<{ game: Game; added: boolean }> {
  const games = await listGames();
  const existing = games.find((g) => g.name.toLowerCase() === name.toLowerCase());
  if (existing && !existing.playedAt) return { game: existing, added: false };

  // Without a new scan, a game back from the played list keeps what its last scan found.
  const { barcode, bggId, thumbnailUrl, imageUrl } = details.barcode || !existing ? details : existing;
  const game: Game = {
    id: existing?.id ?? randomUUID(),
    name: existing?.name ?? name,
    addedAt: Date.now(),
    barcode,
    bggId,
    thumbnailUrl,
    imageUrl,
  };
  await redis.hset(KEY, { [game.id]: game });
  return { game, added: true };
}

export async function markPlayed(id: string) {
  const game = await redis.hget<Game>(KEY, id);
  if (!game || game.playedAt) return;
  await redis.hset(KEY, { [id]: { ...game, playedAt: Date.now() } });
}

// Puts a played game back in its old place on the list.
export async function markUnplayed(id: string) {
  const game = await redis.hget<Game>(KEY, id);
  if (!game?.playedAt) return;
  const { playedAt, ...rest } = game;
  await redis.hset(KEY, { [id]: rest });
}

export async function deleteGame(id: string) {
  await redis.hdel(KEY, id);
}
