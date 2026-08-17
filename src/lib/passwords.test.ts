import { describe, expect, it } from "vitest";
import {
  generateSalt,
  hashPassword,
  validatePassword,
  verifyPassword,
} from "./passwords";

describe("validatePassword", () => {
  // AC-3
  it("rejects a password shorter than eight characters", () => {
    expect(validatePassword("short7c")).toEqual({
      ok: false,
      error: "TOO_SHORT",
    });
  });

  // AC-3
  it("accepts a password of exactly eight characters", () => {
    expect(validatePassword("eight888")).toEqual({
      ok: true,
      value: undefined,
    });
  });

  it("rejects an empty password", () => {
    expect(validatePassword("")).toEqual({ ok: false, error: "TOO_SHORT" });
  });
});

describe("generateSalt", () => {
  it("returns a different salt each time", () => {
    expect(generateSalt()).not.toEqual(generateSalt());
  });
});

describe("hashPassword", () => {
  it("returns the same hash for the same password and salt", () => {
    const salt = generateSalt();
    expect(hashPassword("correct horse", salt)).toEqual(
      hashPassword("correct horse", salt),
    );
  });

  it("returns a different hash for the same password under a different salt", () => {
    expect(hashPassword("correct horse", generateSalt())).not.toEqual(
      hashPassword("correct horse", generateSalt()),
    );
  });

  it("never returns the password itself", () => {
    expect(hashPassword("correct horse", generateSalt())).not.toContain(
      "correct horse",
    );
  });
});

describe("verifyPassword", () => {
  it("accepts the password that produced the hash", () => {
    const salt = generateSalt();
    const hash = hashPassword("correct horse", salt);
    expect(verifyPassword("correct horse", salt, hash)).toBe(true);
  });

  it("rejects a different password", () => {
    const salt = generateSalt();
    const hash = hashPassword("correct horse", salt);
    expect(verifyPassword("wrong horse", salt, hash)).toBe(false);
  });

  it("rejects the right password under the wrong salt", () => {
    const hash = hashPassword("correct horse", generateSalt());
    expect(verifyPassword("correct horse", generateSalt(), hash)).toBe(false);
  });

  it("rejects a stored hash of the wrong length instead of throwing", () => {
    const salt = generateSalt();
    expect(verifyPassword("correct horse", salt, "abcd")).toBe(false);
  });
});
