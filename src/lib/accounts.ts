import {
  generateSalt,
  hashPassword,
  validatePassword,
  verifyPassword,
} from "./passwords";
import { prisma } from "./prisma";
import type { Result } from "./result";

export type AccountRecord = {
  id: string;
  email: string;
  displayName: string;
};

export type CreateAccountInput = {
  email: string;
  password: string;
  displayName: string;
};

export type CreateAccountError =
  | "EMAIL_IN_USE"
  | "EMAIL_INVALID"
  | "PASSWORD_TOO_SHORT"
  | "DISPLAY_NAME_REQUIRED";

export type SignInInput = {
  email: string;
  password: string;
};

export type SignInError = "INVALID_CREDENTIALS";

export type ChangeDisplayNameError = "DISPLAY_NAME_REQUIRED";

// Two addresses differing only in capitalisation are the same address (AC-2),
// so one canonical form is stored and every lookup goes through here.
function canonicalEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isEmailShaped(email: string): boolean {
  const parts = email.split("@");
  return (
    parts.length === 2 &&
    parts.every((part) => part.length > 0) &&
    !/\s/.test(email)
  );
}

function toRecord(account: {
  id: string;
  email: string;
  displayName: string;
}): AccountRecord {
  return {
    id: account.id,
    email: account.email,
    displayName: account.displayName,
  };
}

export async function createAccount(
  input: CreateAccountInput,
): Promise<Result<AccountRecord, CreateAccountError>> {
  const email = canonicalEmail(input.email);
  if (!isEmailShaped(email)) {
    return { ok: false, error: "EMAIL_INVALID" };
  }

  const password = validatePassword(input.password);
  if (!password.ok) {
    return { ok: false, error: "PASSWORD_TOO_SHORT" };
  }

  const displayName = input.displayName.trim();
  if (displayName.length === 0) {
    return { ok: false, error: "DISPLAY_NAME_REQUIRED" };
  }

  const existing = await prisma.account.findUnique({ where: { email } });
  if (existing !== null) {
    return { ok: false, error: "EMAIL_IN_USE" };
  }

  const passwordSalt = generateSalt();
  const account = await prisma.account.create({
    data: {
      email,
      displayName,
      passwordSalt,
      passwordHash: hashPassword(input.password, passwordSalt),
    },
  });

  return { ok: true, value: toRecord(account) };
}

/**
 * Nothing here checks that the account exists: every caller reaches this with
 * an id taken from a live session, so a missing account is an impossible state
 * and is left to throw rather than returned as a value.
 */
export async function changeDisplayName(
  accountId: string,
  displayName: string,
): Promise<Result<AccountRecord, ChangeDisplayNameError>> {
  const trimmed = displayName.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: "DISPLAY_NAME_REQUIRED" };
  }

  const account = await prisma.account.update({
    where: { id: accountId },
    data: { displayName: trimmed },
  });

  return { ok: true, value: toRecord(account) };
}

// AC-5 requires that an unknown email be indistinguishable from a known email
// with the wrong password. Returning early without hashing would make the
// unknown-email case measurably faster and give the answer away, so an unknown
// email is charged the same hashing work against a throwaway salt.
const DECOY_SALT = generateSalt();

export async function signIn(
  input: SignInInput,
): Promise<Result<AccountRecord, SignInError>> {
  const account = await prisma.account.findUnique({
    where: { email: canonicalEmail(input.email) },
  });

  if (account === null) {
    hashPassword(input.password, DECOY_SALT);
    return { ok: false, error: "INVALID_CREDENTIALS" };
  }

  const matches = verifyPassword(
    input.password,
    account.passwordSalt,
    account.passwordHash,
  );
  if (!matches) {
    return { ok: false, error: "INVALID_CREDENTIALS" };
  }

  return { ok: true, value: toRecord(account) };
}
