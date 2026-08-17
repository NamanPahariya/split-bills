"use server";

import { redirect } from "next/navigation";
import { setSessionCookie } from "@/app/session";
import { signIn } from "@/lib/accounts";
import { createSession } from "@/lib/sessions";

export type SignInState = { error?: string };

// AC-5: one message, whether the email belongs to no account at all or to an
// account with a different password. There is deliberately no second branch
// here for anyone to add a more helpful message to.
const SIGN_IN_FAILED = "Your email or password is incorrect.";

export async function signInAction(
  _previous: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const result = await signIn({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });

  if (!result.ok) {
    return { error: SIGN_IN_FAILED };
  }

  const { token } = await createSession(result.value.id);
  await setSessionCookie(token);
  redirect("/account");
}
