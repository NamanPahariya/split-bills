import { redirect } from "next/navigation";
import { currentAccount } from "@/app/session";
import { SignInForm } from "@/components/SignInForm";
import { signInAction } from "./actions";

export default async function SignInPage() {
  if ((await currentAccount()) !== null) {
    redirect("/account");
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <SignInForm action={signInAction} />
    </main>
  );
}
