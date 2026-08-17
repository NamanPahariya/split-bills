## Tasks

- [ ] T01 [P] — Add Account and Session models plus migration — files: prisma/schema.prisma — proves: —
- [ ] T02 [P] — Add vitest config and a test script — files: vitest.config.ts, package.json — proves: —
- [ ] T03 — Add a shared Prisma client singleton and the Result type — files: src/lib/prisma.ts, src/lib/result.ts — proves: —
- [ ] T04 — Add password validation, hashing, and verification with tests — files: src/lib/passwords.ts, src/lib/passwords.test.ts — proves:

AC-3

- [ ] T05 — Add createAccount with tests for success, duplicate email, and short password — files: src/lib/accounts.ts, src/lib/accounts.test.ts — proves: AC-1, AC-2, AC-3
- [ ] T06 — Add signIn with tests for success and identical failure on both invalid causes — files: src/lib/accounts.ts, src/lib/accounts.test.ts — proves: AC-4, AC-5
- [ ] T07 — Add changeDisplayName with tests for persistence and duplicate display names — files: src/lib/accounts.ts, src/lib/accounts.test.ts — proves: AC-8, AC-9
- [ ] T08 — Add session create/lookup/destroy with tests for revocation and no automatic expiry — files: src/lib/sessions.ts, src/lib/sessions.test.ts — proves: AC-6, AC-7
- [ ] T09 — Add the sign-up screen — files: src/app/signup/page.tsx, src/app/signup/actions.ts, src/components/SignUpForm.tsx — proves: AC-1, AC-2, AC-3
- [ ] T10 — Add the sign-in screen — files: src/app/signin/page.tsx, src/app/signin/actions.ts, src/components/SignInForm.tsx — proves: AC-4, AC-5
- [ ] T11 — Add the account screen and sign-out — files: src/app/account/page.tsx, src/app/account/actions.ts — proves: AC-6
- [ ] T12 — Add display-name editing to the account screen — files: src/app/account/actions.ts, src/app/account/page.tsx, src/components/DisplayNameForm.tsx — proves: AC-9
- [ ] T13 — Add middleware guarding /account — files: src/middleware.ts — proves: AC-6

## Coverage

| AC   | Tasks         |
| ---- | ------------- |
| AC-1 | T05, T09      |
| AC-2 | T05, T09      |
| AC-3 | T04, T05, T09 |
| AC-4 | T06, T10      |
| AC-5 | T06, T10      |
| AC-6 | T08, T11, T13 |
| AC-7 | T08           |
| AC-8 | T07           |
| AC-9 | T07, T12      |
