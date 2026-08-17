import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { Result } from "./result";

export const MINIMUM_PASSWORD_LENGTH = 8;

const SALT_LENGTH_BYTES = 16;
const KEY_LENGTH_BYTES = 64;

export type ValidatePasswordError = "TOO_SHORT";

export function validatePassword(
  password: string,
): Result<void, ValidatePasswordError> {
  if (password.length < MINIMUM_PASSWORD_LENGTH) {
    return { ok: false, error: "TOO_SHORT" };
  }
  return { ok: true, value: undefined };
}

export function generateSalt(): string {
  return randomBytes(SALT_LENGTH_BYTES).toString("hex");
}

export function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, KEY_LENGTH_BYTES).toString("hex");
}

export function verifyPassword(
  password: string,
  salt: string,
  hash: string,
): boolean {
  const stored = Buffer.from(hash, "hex");
  const candidate = scryptSync(password, salt, KEY_LENGTH_BYTES);
  // timingSafeEqual throws when the two buffers differ in length, so a stored
  // hash of the wrong size has to be rejected before the comparison.
  if (stored.length !== candidate.length) {
    return false;
  }
  return timingSafeEqual(stored, candidate);
}
