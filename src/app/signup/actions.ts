"use server";

import { redirect } from "next/navigation";
import { setSessionCookie } from "@/app/session";
import type { CreateAccountError } from "@/lib/accounts";
import { createAccount } from "@/lib/accounts";
import { MINIMUM_PASSWORD_LENGTH } from "@/lib/passwords";
import { createSession } from "@/lib/sessions";

export type SignUpState = { error?: string };

const MESSAGES: Record<CreateAccountError, string> = {
  EMAIL_IN_USE: "That email address already has an account. Sign in instead.",
  EMAIL_INVALID: "That does not look like an email address.",
  PASSWORD_TOO_SHORT: `Your password needs at least ${MINIMUM_PASSWORD_LENGTH} characters.`,
  DISPLAY_NAME_REQUIRED: "Please enter a display name.",
};

export async function signUpAction(
  _previous: SignUpState,
  formData: FormData,
): Promise<SignUpState> {
  const result = await createAccount({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    displayName: String(formData.get("displayName") ?? ""),
  });

  if (!result.ok) {
    return { error: MESSAGES[result.error] };
  }

  const { token } = await createSession(result.value.id);
  await setSessionCookie(token);
  redirect("/account");
}
