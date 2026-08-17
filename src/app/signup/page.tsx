import { redirect } from "next/navigation";
import { currentAccount } from "@/app/session";
import { SignUpForm } from "@/components/SignUpForm";
import { signUpAction } from "./actions";

export default async function SignUpPage() {
  if ((await currentAccount()) !== null) {
    redirect("/account");
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <SignUpForm action={signUpAction} />
    </main>
  );
}
