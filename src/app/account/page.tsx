import { requireAccount } from "@/app/session";
import { DisplayNameForm } from "@/components/DisplayNameForm";
import { signOutAction, updateDisplayNameAction } from "./actions";

export default async function AccountPage() {
  const account = await requireAccount();

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">Your account</h1>

      <p>
        Signed in as <strong>{account.displayName}</strong>
      </p>
      <p className="text-sm opacity-70">{account.email}</p>

      <DisplayNameForm
        currentDisplayName={account.displayName}
        action={updateDisplayNameAction}
      />

      <form action={signOutAction}>
        <button
          type="submit"
          className="rounded border border-black/20 px-4 py-2 font-medium dark:border-white/25"
        >
          Sign out
        </button>
      </form>
    </main>
  );
}
