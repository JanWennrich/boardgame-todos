import { randomUUID } from "node:crypto";
import { Redis } from "@upstash/redis";

// Reads UPSTASH_REDIS_REST_* or the KV_REST_API_* variables set by the Vercel integration.
const redis = Redis.fromEnv();
const KEY = "games";

export type Game = { id: string; name: string; addedAt: number };

export async function listGames(): Promise<Game[]> {
  const games = await redis.hgetall<Record<string, Game>>(KEY);
  return Object.values(games ?? {}).sort((a, b) => a.addedAt - b.addedAt);
}

// Returns the existing game instead of adding a second one with the same name.
export async function addGame(name: string): Promise<{ game: Game; added: boolean }> {
  const games = await listGames();
  const existing = games.find((g) => g.name.toLowerCase() === name.toLowerCase());
  if (existing) return { game: existing, added: false };

  const game: Game = { id: randomUUID(), name, addedAt: Date.now() };
  await redis.hset(KEY, { [game.id]: game });
  return { game, added: true };
}

export async function removeGame(id: string) {
  await redis.hdel(KEY, id);
}
