## Approach

Accounts and Sessions become two Prisma models; passwords are validated and
verified through pure functions in `src/lib/passwords.ts` built on Node's
built-in `crypto`, so no new dependency is needed. The business rules —
creating an account, signing in, changing a display name — live in
`src/lib/accounts.ts` and return `Result` values instead of throwing, per
CLAUDE.md. Signing in issues a random session token stored in a `Session`
row and set as a cookie with no expiry, matching AC-7; signing out deletes
that row and clears the cookie. Server actions under `src/app/signup`,
`src/app/signin`, and `src/app/account` parse form input, call the lib
functions, and render the outcome, while a lightweight middleware redirects
signed-out visitors away from `/account`. Everything fits the layout
CLAUDE.md already defines — no new top-level structure.

## Data model

```prisma
model Account {
  id           String    @id @default(cuid())
  email        String    @unique
  passwordHash String
  passwordSalt String
  displayName  String
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  sessions     Session[]
}

model Session {
  id        String   @id @default(cuid())
  token     String   @unique
  accountId String
  account   Account  @relation(fields: [accountId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
}
```

`token` is a separate random value from `id` so that the record's id never
doubles as the secret placed in the cookie. `Session` has no `expiresAt`
field, because AC-7 requires no automatic sign-out.

## Domain functions

```ts
// src/lib/result.ts
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E }

// src/lib/passwords.ts
type ValidatePasswordError = "TOO_SHORT"
function validatePassword(password: string): Result<void, ValidatePasswordError>
function generateSalt(): string
function hashPassword(password: string, salt: string): string
function verifyPassword(password: string, salt: string, hash: string): boolean

// src/lib/accounts.ts
type AccountRecord = { id: string; email: string; displayName: string }
type CreateAccountInput = { email: string; password: string; displayName: string }
type CreateAccountError = "EMAIL_IN_USE" | "PASSWORD_TOO_SHORT"
function createAccount(input: CreateAccountInput): Promise<Result<AccountRecord, CreateAccountError>>

type SignInInput = { email: string; password: string }
type SignInError = "INVALID_CREDENTIALS"
function signIn(input: SignInInput): Promise<Result<AccountRecord, SignInError>>

function changeDisplayName(accountId: string, displayName: string): Promise<AccountRecord>

// src/lib/sessions.ts
function createSession(accountId: string): Promise<{ token: string }>
function getAccountFromToken(token: string): Promise<AccountRecord | null>
function destroySession(token: string): Promise<void>
```

## Routes and server actions

| Route | Purpose |
| --- | --- |
| `GET /signup` | Renders the sign-up form |
| `GET /signin` | Renders the sign-in form |
| `GET /account` | Shows the signed-in person's display name and a sign-out control; redirects to `/signin` if not signed in |

```ts
// src/app/signup/actions.ts
function signUpAction(formData: FormData): Promise<{ error?: string }>
// calls createAccount, on success calls createSession, sets the session cookie, redirects to /account

// src/app/signin/actions.ts
function signInAction(formData: FormData): Promise<{ error?: string }>
// calls signIn, on success calls createSession, sets the session cookie, redirects to /account

// src/app/account/actions.ts
function signOutAction(): Promise<void>
// reads the session cookie, calls destroySession, clears the cookie, redirects to /signin

function updateDisplayNameAction(formData: FormData): Promise<{ error?: string }>
// reads the session cookie, calls getAccountFromToken then changeDisplayName, re-renders /account
```

`src/middleware.ts` redirects any request to `/account` that has no session
cookie present to `/signin`. It checks presence only; `getAccountFromToken`
is the actual authority and runs inside the page/action.

## UI

- `SignUpForm` — email, password, display name fields; submits to
  `signUpAction`; shows its `error` string, if any, near the field it
  concerns.
- `SignInForm` — email, password fields; submits to `signInAction`; shows
  one fixed error string on failure, regardless of cause (satisfies AC-5).
- `DisplayNameForm` — single display name field, pre-filled with the
  current value; submits to `updateDisplayNameAction`.
- `/account` page — "Signed in as {displayName}", the `DisplayNameForm`,
  and a sign-out button wired to `signOutAction`.

All three are presentational: they receive the relevant server action as a
prop and hold no data access of their own.

## Files

| File | Status | Purpose |
| --- | --- | --- |
| `prisma/schema.prisma` | EDIT | Add `Account` and `Session` models |
| `src/lib/prisma.ts` | NEW | Shared Prisma client instance |
| `src/lib/result.ts` | NEW | `Result<T, E>` type |
| `src/lib/passwords.ts` | NEW | Password validation, hashing, verification |
| `src/lib/passwords.test.ts` | NEW | Tests for the above |
| `src/lib/accounts.ts` | NEW | `createAccount`, `signIn`, `changeDisplayName` |
| `src/lib/accounts.test.ts` | NEW | Tests for the above |
| `src/lib/sessions.ts` | NEW | `createSession`, `getAccountFromToken`, `destroySession` |
| `src/lib/sessions.test.ts` | NEW | Tests for the above |
| `src/app/signup/page.tsx` | NEW | Sign-up page |
| `src/app/signup/actions.ts` | NEW | `signUpAction` |
| `src/app/signin/page.tsx` | NEW | Sign-in page |
| `src/app/signin/actions.ts` | NEW | `signInAction` |
| `src/app/account/page.tsx` | NEW | Account page |
| `src/app/account/actions.ts` | NEW | `signOutAction`, `updateDisplayNameAction` |
| `src/components/SignUpForm.tsx` | NEW | Sign-up form |
| `src/components/SignInForm.tsx` | NEW | Sign-in form |
| `src/components/DisplayNameForm.tsx` | NEW | Display-name form |
| `src/middleware.ts` | NEW | Redirects signed-out visitors away from `/account` |
| `package.json` | EDIT | Add a `test` script (currently missing) |
| `vitest.config.ts` | NEW | Vitest configuration (currently missing) |

## Test plan

| AC | Test |
| --- | --- |
| AC-1 | `accounts.test.ts`: `createAccount` succeeds given an unused email, an 8+ character password, and a display name |
| AC-2 | `accounts.test.ts`: `createAccount` returns `EMAIL_IN_USE` when the email already belongs to an account |
| AC-3 | `passwords.test.ts`: `validatePassword` returns `TOO_SHORT` under 8 characters; `accounts.test.ts`: `createAccount` returns `PASSWORD_TOO_SHORT` for the same case |
| AC-4 | `accounts.test.ts`: `signIn` succeeds and returns the account given the correct email and password |
| AC-5 (domain) | `accounts.test.ts`: `signIn` returns the same `INVALID_CREDENTIALS` value both for an unknown email and for a known email with the wrong password |
| AC-5 (wording) | Cannot be automated in this stack (no component-rendering test tool is installed). `SignInForm` has exactly one error branch, so no code path can show a different message for the two cases — verified by inspection, not by a test |
| AC-6 (session) | `sessions.test.ts`: after `destroySession`, `getAccountFromToken` returns `null` for that token |
| AC-6 (redirect) | Cannot be automated in this stack (no route/e2e runner is installed). Verified manually: sign out, then load `/account` and confirm it redirects to `/signin` |
| AC-7 | `sessions.test.ts`: using fake timers to advance time well past any plausible expiry, `getAccountFromToken` still resolves the account, since `Session` carries no `expiresAt` |
| AC-8 | `accounts.test.ts`: `createAccount` succeeds for two different emails that both request the same display name |
| AC-9 | `accounts.test.ts`: `changeDisplayName` persists a new display name that a subsequent lookup reflects |

## Risks

- **No new dependency is proposed.** Password hashing uses Node's built-in
  `crypto` (`scrypt`) instead of a package like `bcrypt`; sessions use a
  plain random token instead of a library like `next-auth`. Both fit inside
  "Next.js + TypeScript + Prisma + SQLite + Tailwind + Vitest. Nothing
  else." If either turns out to be insufficient, I will ask before adding
  anything.
- `package.json` has no `test` script and there is no `vitest.config.ts` yet
  — this plan adds both. Confirming this is wanted before I touch
  `package.json`.
- The tests above need a real SQLite file to run `src/lib` functions
  against Prisma; without a separate test database, they would read and
  write `dev.db`. This plan assumes a dedicated test database file, set
  through an environment variable, but the exact setup isn't nailed down
  yet.
- `src/middleware.ts` only checks that a session cookie is present, not that
  it is valid — an expired-looking but tampered cookie would still reach
  the page, which then correctly rejects it via `getAccountFromToken`. This
  is intentional (middleware stays cheap; the page is the real gate) but
  worth flagging as a design choice rather than an oversight.
