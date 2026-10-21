"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, isValidPassword, isValidSession, sessionToken } from "@/lib/auth";
import * as games from "@/lib/games";

// Server actions are reachable by POST, so check the session here as well as in proxy.ts.
async function requireSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!isValidSession(token)) redirect("/login");
}

export async function addGame(formData: FormData) {
  await requireSession();
  const name = String(formData.get("name") ?? "").trim().slice(0, 200);
  if (name) await games.addGame(name);
  revalidatePath("/");
}

export async function markPlayed(id: string) {
  await requireSession();
  await games.removeGame(id);
  revalidatePath("/");
}

export async function login(formData: FormData) {
  if (!isValidPassword(String(formData.get("password") ?? ""))) {
    redirect("/login?error=1");
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

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
