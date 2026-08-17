import { describe, expect, it } from "vitest";
import { changeDisplayName, createAccount, signIn } from "./accounts";
import { prisma } from "./prisma";

const VALID = {
  email: "ada@example.com",
  password: "longenough",
  displayName: "Ada",
};

describe("createAccount", () => {
  // AC-1
  it("creates an account from an unused email, a long enough password, and a display name", async () => {
    const result = await createAccount(VALID);

    expect(result).toMatchObject({
      ok: true,
      value: { email: "ada@example.com", displayName: "Ada" },
    });
  });

  // AC-1
  it("stores the account so it can be found again", async () => {
    await createAccount(VALID);

    const stored = await prisma.account.findUnique({
      where: { email: "ada@example.com" },
    });
    expect(stored?.displayName).toBe("Ada");
  });

  it("never stores the password itself", async () => {
    await createAccount(VALID);

    const stored = await prisma.account.findUnique({
      where: { email: "ada@example.com" },
    });
    expect(stored?.passwordHash).not.toBe("longenough");
    expect(stored?.passwordHash).not.toContain("longenough");
  });

  // AC-2
  it("refuses an email that is already tied to an account", async () => {
    await createAccount(VALID);

    const result = await createAccount({ ...VALID, displayName: "Impostor" });

    expect(result).toEqual({ ok: false, error: "EMAIL_IN_USE" });
  });

  // AC-2
  it("refuses an email that differs from an existing one only in capitalisation", async () => {
    await createAccount(VALID);

    const result = await createAccount({ ...VALID, email: "Ada@Example.COM" });

    expect(result).toEqual({ ok: false, error: "EMAIL_IN_USE" });
  });

  // AC-3
  it("refuses a password shorter than eight characters", async () => {
    const result = await createAccount({ ...VALID, password: "short7c" });

    expect(result).toEqual({ ok: false, error: "PASSWORD_TOO_SHORT" });
  });

  // AC-3
  it("creates no account when the password is too short", async () => {
    await createAccount({ ...VALID, password: "short7c" });

    expect(await prisma.account.count()).toBe(0);
  });

  // AC-10
  it.each([
    ["no at sign", "adaexample.com"],
    ["nothing before the at sign", "@example.com"],
    ["nothing after the at sign", "ada@"],
    ["a space", "ada smith@example.com"],
  ])("refuses an email with %s", async (_reason, email) => {
    const result = await createAccount({ ...VALID, email });

    expect(result).toEqual({ ok: false, error: "EMAIL_INVALID" });
  });

  // AC-11
  it.each([
    ["empty", ""],
    ["only spaces", "   "],
  ])("refuses a display name that is %s", async (_reason, displayName) => {
    const result = await createAccount({ ...VALID, displayName });

    expect(result).toEqual({ ok: false, error: "DISPLAY_NAME_REQUIRED" });
  });

  it("stores a display name without its surrounding spaces", async () => {
    const result = await createAccount({ ...VALID, displayName: "  Ada  " });

    expect(result).toMatchObject({ ok: true, value: { displayName: "Ada" } });
  });
});

describe("createAccount display names", () => {
  // AC-8
  it("lets two people with different emails choose the same display name", async () => {
    const first = await createAccount(VALID);
    const second = await createAccount({
      ...VALID,
      email: "grace@example.com",
    });

    expect(first).toMatchObject({ ok: true, value: { displayName: "Ada" } });
    expect(second).toMatchObject({ ok: true, value: { displayName: "Ada" } });
  });

  // AC-8
  it("keeps both accounts when the display name is shared", async () => {
    await createAccount(VALID);
    await createAccount({ ...VALID, email: "grace@example.com" });

    expect(await prisma.account.count()).toBe(2);
  });
});

describe("changeDisplayName", () => {
  // AC-9
  it("changes the display name on the account", async () => {
    const created = await createAccount(VALID);
    if (!created.ok) throw new Error("setup failed");

    const result = await changeDisplayName(created.value.id, "Ada Lovelace");

    expect(result).toMatchObject({
      ok: true,
      value: { displayName: "Ada Lovelace" },
    });
  });

  // AC-9
  it("shows the new display name from then on", async () => {
    const created = await createAccount(VALID);
    if (!created.ok) throw new Error("setup failed");

    await changeDisplayName(created.value.id, "Ada Lovelace");

    const stored = await prisma.account.findUnique({
      where: { id: created.value.id },
    });
    expect(stored?.displayName).toBe("Ada Lovelace");
  });

  it("drops spaces from around the new display name", async () => {
    const created = await createAccount(VALID);
    if (!created.ok) throw new Error("setup failed");

    const result = await changeDisplayName(created.value.id, "  Ada L  ");

    expect(result).toMatchObject({ ok: true, value: { displayName: "Ada L" } });
  });

  // AC-11
  it.each([
    ["empty", ""],
    ["only spaces", "   "],
  ])("refuses a new display name that is %s", async (_reason, displayName) => {
    const created = await createAccount(VALID);
    if (!created.ok) throw new Error("setup failed");

    const result = await changeDisplayName(created.value.id, displayName);

    expect(result).toEqual({ ok: false, error: "DISPLAY_NAME_REQUIRED" });
  });

  // AC-11
  it("leaves the old display name in place when the new one is blank", async () => {
    const created = await createAccount(VALID);
    if (!created.ok) throw new Error("setup failed");

    await changeDisplayName(created.value.id, "   ");

    const stored = await prisma.account.findUnique({
      where: { id: created.value.id },
    });
    expect(stored?.displayName).toBe("Ada");
  });
});

describe("signIn", () => {
  // AC-4
  it("signs in with the correct email and password", async () => {
    await createAccount(VALID);

    const result = await signIn({
      email: VALID.email,
      password: VALID.password,
    });

    expect(result).toMatchObject({
      ok: true,
      value: { email: "ada@example.com", displayName: "Ada" },
    });
  });

  // AC-4
  it("signs in whatever the capitalisation of the email", async () => {
    await createAccount(VALID);

    const result = await signIn({
      email: "Ada@Example.COM",
      password: VALID.password,
    });

    expect(result).toMatchObject({ ok: true });
  });

  // AC-5
  it("refuses an email that belongs to no account", async () => {
    const result = await signIn({
      email: "nobody@example.com",
      password: VALID.password,
    });

    expect(result).toEqual({ ok: false, error: "INVALID_CREDENTIALS" });
  });

  // AC-5
  it("refuses a known email with the wrong password", async () => {
    await createAccount(VALID);

    const result = await signIn({
      email: VALID.email,
      password: "wrongpassword",
    });

    expect(result).toEqual({ ok: false, error: "INVALID_CREDENTIALS" });
  });

  // AC-5: the whole point is that these two are indistinguishable.
  it("fails identically whether the email is unknown or the password is wrong", async () => {
    await createAccount(VALID);

    const unknownEmail = await signIn({
      email: "nobody@example.com",
      password: VALID.password,
    });
    const wrongPassword = await signIn({
      email: VALID.email,
      password: "wrongpassword",
    });

    expect(unknownEmail).toEqual(wrongPassword);
  });
});
