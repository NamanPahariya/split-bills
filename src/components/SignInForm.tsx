"use client";

import Link from "next/link";
import { useActionState } from "react";

type SignInState = { error?: string };

export function SignInForm({
  action,
}: {
  action: (state: SignInState, formData: FormData) => Promise<SignInState>;
}) {
  const [state, submit, pending] = useActionState(action, {});

  return (
    <form action={submit} className="flex w-full max-w-sm flex-col gap-4">
      <h1 className="text-2xl font-semibold">Sign in</h1>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="rounded border border-black/20 px-3 py-2 dark:border-white/25"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="rounded border border-black/20 px-3 py-2 dark:border-white/25"
        />
      </label>

      {state.error !== undefined && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-foreground px-4 py-2 font-medium text-background disabled:opacity-50"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>

      <p className="text-sm">
        No account yet?{" "}
        <Link href="/signup" className="underline">
          Create one
        </Link>
      </p>
    </form>
  );
}
