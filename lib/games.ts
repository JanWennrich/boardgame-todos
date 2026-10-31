import { randomUUID } from "node:crypto";
import { Redis } from "@upstash/redis";

// Reads UPSTASH_REDIS_REST_* or the KV_REST_API_* variables set by the Vercel integration.
const redis = Redis.fromEnv();
const KEY = "games";

export type Game = { id: string; name: string; addedAt: number; playedAt?: number };

export async function listGames(): Promise<Game[]> {
  const games = await redis.hgetall<Record<string, Game>>(KEY);
  return Object.values(games ?? {}).sort((a, b) => a.addedAt - b.addedAt);
}

// Returns the existing game instead of adding a second one with the same name.
// A game that was already played goes back on the list.
export async function addGame(name: string): Promise<{ game: Game; added: boolean }> {
  const games = await listGames();
  const existing = games.find((g) => g.name.toLowerCase() === name.toLowerCase());
  if (existing && !existing.playedAt) return { game: existing, added: false };

  const game: Game = { id: existing?.id ?? randomUUID(), name: existing?.name ?? name, addedAt: Date.now() };
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
