"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  clearSessionCookie,
  readSessionToken,
  requireAccount,
} from "@/app/session";
import type { ChangeDisplayNameError } from "@/lib/accounts";
import { changeDisplayName } from "@/lib/accounts";
import { destroySession } from "@/lib/sessions";

export type DisplayNameState = { error?: string; saved?: boolean };

const MESSAGES: Record<ChangeDisplayNameError, string> = {
  DISPLAY_NAME_REQUIRED: "Please enter a display name.",
};

export async function signOutAction(): Promise<void> {
  const token = await readSessionToken();
  // The session record goes first: clearing only the cookie would leave a token
  // that still works for anyone who kept a copy of it.
  if (token !== undefined) {
    await destroySession(token);
  }
  await clearSessionCookie();
  redirect("/signin");
}

export async function updateDisplayNameAction(
  _previous: DisplayNameState,
  formData: FormData,
): Promise<DisplayNameState> {
  const account = await requireAccount();

  const result = await changeDisplayName(
    account.id,
    String(formData.get("displayName") ?? ""),
  );

  if (!result.ok) {
    return { error: MESSAGES[result.error] };
  }

  revalidatePath("/account");
  return { saved: true };
}
