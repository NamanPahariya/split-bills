"use client";

import { useActionState } from "react";

type DisplayNameState = { error?: string; saved?: boolean };

export function DisplayNameForm({
  currentDisplayName,
  action,
}: {
  currentDisplayName: string;
  action: (
    state: DisplayNameState,
    formData: FormData,
  ) => Promise<DisplayNameState>;
}) {
  const [state, submit, pending] = useActionState(action, {});

  return (
    <form action={submit} className="flex flex-col gap-2">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Display name</span>
        <input
          name="displayName"
          type="text"
          autoComplete="name"
          defaultValue={currentDisplayName}
          className="rounded border border-black/20 px-3 py-2 dark:border-white/25"
        />
      </label>

      {state.error !== undefined && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}

      {state.saved === true && state.error === undefined && (
        <p role="status" className="text-sm opacity-70">
          Saved.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded border border-black/20 px-4 py-2 font-medium disabled:opacity-50 dark:border-white/25"
      >
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
