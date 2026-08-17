import { randomBytes } from "node:crypto";
import type { AccountRecord } from "./accounts";
import { prisma } from "./prisma";

const TOKEN_LENGTH_BYTES = 32;

/**
 * A session carries no expiry: AC-7 says a person stays signed in until they
 * choose to sign out, so the only thing that ends a session is destroySession.
 */
export async function createSession(
  accountId: string,
): Promise<{ token: string }> {
  // Kept separate from the row's id so the identifier handed to the browser is
  // never the same value used to address the record.
  const token = randomBytes(TOKEN_LENGTH_BYTES).toString("hex");
  await prisma.session.create({ data: { token, accountId } });
  return { token };
}

export async function getAccountFromToken(
  token: string,
): Promise<AccountRecord | null> {
  const session = await prisma.session.findUnique({
    where: { token },
    include: { account: true },
  });
  if (session === null) {
    return null;
  }

  return {
    id: session.account.id,
    email: session.account.email,
    displayName: session.account.displayName,
  };
}

// deleteMany rather than delete: signing out twice, or with a token that has
// already gone, is not an error worth reporting to anyone.
export async function destroySession(token: string): Promise<void> {
  await prisma.session.deleteMany({ where: { token } });
}
