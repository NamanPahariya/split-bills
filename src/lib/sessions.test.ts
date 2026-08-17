import { afterEach, describe, expect, it, vi } from "vitest";
import { createAccount } from "./accounts";
import {
  createSession,
  destroySession,
  getAccountFromToken,
} from "./sessions";

async function anAccount() {
  const created = await createAccount({
    email: "ada@example.com",
    password: "longenough",
    displayName: "Ada",
  });
  if (!created.ok) throw new Error("setup failed");
  return created.value;
}

afterEach(() => {
  vi.useRealTimers();
});

describe("createSession", () => {
  it("returns a token that resolves back to the account", async () => {
    const account = await anAccount();

    const { token } = await createSession(account.id);

    expect(await getAccountFromToken(token)).toEqual(account);
  });

  it("returns a different token for each session", async () => {
    const account = await anAccount();

    const first = await createSession(account.id);
    const second = await createSession(account.id);

    expect(first.token).not.toEqual(second.token);
  });
});

describe("getAccountFromToken", () => {
  it("returns nothing for a token that belongs to no session", async () => {
    expect(await getAccountFromToken("not-a-real-token")).toBeNull();
  });
});

describe("destroySession", () => {
  // AC-6
  it("makes the token stop resolving to the account", async () => {
    const account = await anAccount();
    const { token } = await createSession(account.id);

    await destroySession(token);

    expect(await getAccountFromToken(token)).toBeNull();
  });

  // AC-6
  it("leaves the person's other sessions alone", async () => {
    const account = await anAccount();
    const signedOut = await createSession(account.id);
    const stillOpen = await createSession(account.id);

    await destroySession(signedOut.token);

    expect(await getAccountFromToken(stillOpen.token)).toEqual(account);
  });

  it("does nothing when the token has already gone", async () => {
    await expect(destroySession("not-a-real-token")).resolves.toBeUndefined();
  });
});

describe("staying signed in", () => {
  // AC-7. Only Date is faked; faking timers wholesale would stall the database
  // calls this test has to make.
  it("still resolves the account ten years later", async () => {
    const account = await anAccount();
    const { token } = await createSession(account.id);

    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2036-08-13T00:00:00.000Z"));

    expect(await getAccountFromToken(token)).toEqual(account);
  });
});
