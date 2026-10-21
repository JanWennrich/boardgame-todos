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

export async function addGame(name: string) {
  const games = await listGames();
  if (games.some((g) => g.name.toLowerCase() === name.toLowerCase())) return;

  const game: Game = { id: randomUUID(), name, addedAt: Date.now() };
  await redis.hset(KEY, { [game.id]: game });
}

export async function removeGame(id: string) {
  await redis.hdel(KEY, id);
}
