import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/app/session-cookie";
import type { AccountRecord } from "@/lib/accounts";
import { getAccountFromToken } from "@/lib/sessions";

// AC-7 says nothing signs a person out on its own. A cookie with no lifetime of
// its own would still vanish when the browser closes, so it is given the
// longest life that is practically "until you sign out". The session record
// behind it remains the real authority and never expires.
const TEN_YEARS_IN_SECONDS = 60 * 60 * 24 * 365 * 10;

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TEN_YEARS_IN_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function readSessionToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value;
}

export async function currentAccount(): Promise<AccountRecord | null> {
  const token = await readSessionToken();
  if (token === undefined) {
    return null;
  }
  return getAccountFromToken(token);
}

export async function requireAccount(): Promise<AccountRecord> {
  const account = await currentAccount();
  if (account === null) {
    redirect("/signin");
  }
  return account;
}
