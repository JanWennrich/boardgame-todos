"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { SESSION_COOKIE, isValidPassword, isValidSession, sessionToken } from "@/lib/auth";
import * as games from "@/lib/games";
import * as barcodes from "@/lib/barcodes";

const DEVICE_COOKIE = "device";

// Server actions are reachable by POST, so check the session here as well as in proxy.ts.
async function requireSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!isValidSession(token)) redirect("/login");
}

// Identifies this device in GameUPC votes; created on the first vote.
async function deviceId() {
  const jar = await cookies();
  const existing = jar.get(DEVICE_COOKIE)?.value;
  if (existing) return existing;
  const id = randomUUID();
  jar.set(DEVICE_COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365 * 5,
    path: "/",
  });
  return id;
}

export async function addGame(formData: FormData) {
  await requireSession();
  const name = String(formData.get("name") ?? "").trim().slice(0, 200);
  if (!name) return null;
  const result = await games.addGame(name);
  const code = barcodes.normalizeBarcode(String(formData.get("barcode") ?? ""));
  if (code) {
    const bggId = Number(formData.get("bgg_id"));
    const id = Number.isSafeInteger(bggId) && bggId > 0 ? bggId : undefined;
    await barcodes.rememberBarcode(code, { id, name });
    // Set for games picked from suggestions or search results; verified ones need no vote.
    if (id && formData.get("report")) {
      const userId = await deviceId();
      after(() => barcodes.reportGame(code, id, userId));
    }
  }
  revalidatePath("/");
  return result;
}

export async function lookupBarcode(barcode: string): Promise<barcodes.Lookup> {
  await requireSession();
  const code = barcodes.normalizeBarcode(barcode);
  return code ? barcodes.lookupBarcode(code) : { suggestions: [], searchedFor: "" };
}

export async function searchGames(barcode: string, query: string): Promise<barcodes.Game[]> {
  await requireSession();
  const code = barcodes.normalizeBarcode(barcode);
  const q = query.trim().slice(0, 200);
  return code && q ? barcodes.searchGames(code, q) : [];
}

export async function markPlayed(id: string) {
  await requireSession();
  await games.markPlayed(id);
  revalidatePath("/");
}

export async function markUnplayed(id: string) {
  await requireSession();
  await games.markUnplayed(id);
  revalidatePath("/");
}

export async function deleteGame(id: string) {
  await requireSession();
  await games.deleteGame(id);
  revalidatePath("/");
}

export async function login(formData: FormData) {
  if (!isValidPassword(String(formData.get("password") ?? ""))) {
    // A new value each time, so the form remounts and shakes again on every wrong attempt.
    redirect(`/login?error=${Date.now()}`);
  }
  (await cookies()).set(SESSION_COOKIE, sessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 90,
    path: "/",
  });
  redirect("/");
}
