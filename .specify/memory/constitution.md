<!--
Sync Impact Report
Version change: (unfilled template) → 1.0.0
Rationale: Initial ratification. The prior file contained only unreplaced
placeholder tokens, so there is no earlier governance to amend.

Modified principles: none (no previous principles existed)

Added sections:
  - Core Principles I. Simple Architecture
  - Core Principles II. Reuse Before Building
  - Core Principles III. Protect Shipped Behaviour
  - Core Principles IV. Authorisation On The Server (NON-NEGOTIABLE)
  - Core Principles V. Money Is Exact (NON-NEGOTIABLE)
  - Core Principles VI. Tests For Business Rules
  - Core Principles VII. Features Stay Independent
  - Technology And Data Constraints
  - Development Workflow
  - Governance

Removed sections: none

Notes:
  - The template offers five principle slots; seven are used, one per distinct
    rule the project requires. Each is separately checkable.
  - Follow-up TODOs: none. RATIFICATION_DATE is today, this being the first
    adoption of a filled constitution.
-->

# Splitsy Constitution

Splitsy remembers who paid for what when a group of people share costs, and
works out the smallest set of payments that settles everybody up. It serves
small fixed groups who spend money together and trust each other. It is not a
payment processor and guarantees nobody's money.

## Core Principles

### I. Simple Architecture

The codebase has exactly three layers and MUST NOT grow a fourth:

- `src/app` — routes, pages, and server actions. Parses input, calls `src/lib`,
  renders the outcome. Owns anything that touches cookies, headers, or
  redirects.
- `src/lib` — all business rules, as pure functions. MUST NOT import from
  `src/app`.
- `src/components` — presentational only. MUST NOT reach any database.

Failures a caller is expected to handle MUST be returned as values from
`src/lib`, never thrown. `Result<T, E>` with a SCREAMING_SNAKE error union is
the only shape for this. Throwing is reserved for states that are impossible
by construction, and each such site MUST carry a comment saying why the state
cannot occur.

No service layer, repository layer, dependency-injection container, event bus,
or new top-level directory may be introduced without an amendment to this
document. Adding one is a governance change, not a design choice.

**Rationale**: The product is small and its rules are the interesting part.
Every layer added between a form and a business rule is a place for the rules
to hide.

### II. Reuse Before Building

Before writing a function, the author MUST search `src/lib` for one that
already does the job, and reuse or extend it in preference to writing a second.

Any rule that answers the same question in two places MUST live in exactly one
module. "What counts as the same email address" is the standing example: it is
answered once, in `src/lib/accounts.ts`, and every caller goes through that
module rather than re-implementing the comparison. Two copies of a rule are
treated as a defect the moment they exist, not when they drift.

Adding a dependency requires asking first, naming the package and stating why
the standard library and the existing stack cannot do the job. Silence is not
approval.

**Rationale**: A duplicated rule does not fail loudly. It fails the day the two
copies disagree, in whichever copy nobody remembered to change.

### III. Protect Shipped Behaviour

Every acceptance criterion of a shipped feature MUST remain true. New work does
not get to make old work wrong.

- Existing tests MUST NOT be deleted, skipped, or weakened to make new code
  pass. A failing existing test means the new code is wrong until proven
  otherwise.
- Changing the behaviour of a shipped acceptance criterion requires amending
  that feature's `spec.md` first, in a separate commit, with the reason.
- `npm test` and `npx tsc --noEmit` MUST both pass, with the real output
  shown, before any task is reported as done.
- History is never rewritten silently: correcting a record MUST leave a trace
  rather than overwrite what was there.

**Rationale**: People trust Splitsy with a shared account of who owes whom. A
regression here is not a bug in a screen; it is a wrong answer about money that
somebody may already have acted on.

### IV. Authorisation On The Server (NON-NEGOTIABLE)

Every server action MUST establish the acting person itself, by calling
`requireAccount()`. It MUST NOT accept an account identifier from form data, a
query parameter, a header, or any other client-supplied value.

Authorisation MUST be enforced inside `src/lib`, in the same query that fetches
the record — never as a lookup followed by a separate permission check, and
never in the component or the page alone. Middleware is a convenience that
redirects obvious cases; it is never the gate.

A refusal MUST NOT leak the existence of a record the person may not see. The
error code is named for what the caller is permitted to learn — `GROUP_NOT_FOUND`,
not `NOT_A_MEMBER` — and a record that does not exist is answered identically
to one the person is not party to. Authorisation runs before input validation,
so that no outsider can probe the rules of a record they cannot see, and so
that a refused call leaves the record unchanged.

**Rationale**: Hiding a control in the UI is not a restriction. Anything not
checked on the server, in the query, is not checked.

### V. Money Is Exact (NON-NEGOTIABLE)

Money is always an integer number of cents. Never a float, never a string,
never a `Decimal`. Every money field, variable, parameter, and column name ends
in `Cents`. Formatting to "$12.34" happens only in `src/components`.

The parts of a split MUST add up to exactly the whole. Where a division leaves
a remainder, the remainder MUST be assigned to specific participants by a rule
that is written down and tested — never dropped, never absorbed silently, never
left to floating-point. Input whose parts cannot be made to sum to the whole
MUST be refused as a returned error rather than accepted and reconciled.

Zero-value and negative-value amounts MUST be addressed explicitly in every
feature specification that touches money, either by defining the behaviour or
by declaring it out of scope.

**Rationale**: Never lose a rupee. A rounding difference that Splitsy absorbs
is a number the people using it cannot reconcile against what they actually
paid, and they will trust their own arithmetic over ours — correctly.

### VI. Tests For Business Rules

Every exported function in `src/lib` MUST have a test beside it, named
`<name>.test.ts`.

- Every acceptance criterion provable in the domain MUST have a test carrying
  an `// AC-n` comment naming it.
- Acceptance criteria that cannot be tested in this stack — exact on-screen
  wording, confirmation dialogs, redirects — MUST be listed explicitly in the
  feature's plan with the reason they cannot be automated and the manual check
  that covers them instead. They MUST NOT be quietly omitted.
- Domain tests run against a real database, not a mocked one, so that
  constraints, cascades, and uniqueness are exercised rather than assumed.
- A test MUST assert the persisted result where the rule is about persistence.
  A function's return value is not evidence that the row changed.

Presentational components carry no business rules and therefore need no unit
tests; anything in a component worth testing belongs in `src/lib` instead.

**Rationale**: The rules are the product. A rule with no test is a rule the
next change is free to break.

### VII. Features Stay Independent

Features MUST be buildable, testable, and reviewable one at a time. A feature
MUST NOT require a later, unbuilt feature in order to be correct.

Specifically, and non-negotiably: **Expenses MUST NOT know about Balances.**

- An expense records what happened — who paid, how much, for whom, and how it
  was split. It is the fact.
- A balance is derived from expenses and settlements at the time it is asked
  for. It is a conclusion.
- No module under expenses may import from a balances module, and no expense,
  participant, or share row may store a running total, an amount owed, a net
  position, or any other precomputed balance figure.
- Introducing a stored or cached balance requires an amendment to this
  document, stating how it is invalidated and how it is proved to agree with
  the expenses it summarises.

The same separation applies generally: a feature owns its own data and its own
rules, and reads other features through their exported functions rather than
their tables.

**Rationale**: A stored balance is two sources of truth for the same number,
and the stale one is indistinguishable from the correct one until somebody
disputes it. Deriving it is cheap at this scale; reconciling it after the fact
is not.

## Technology And Data Constraints

The stack is fixed: Next.js (App Router), TypeScript, Prisma, SQLite, Tailwind,
Vitest. Nothing else without the approval required by Principle II.

- No `any`. No non-null assertion (`!`) unless the line carries a comment
  explaining why the value cannot be null there.
- Comments explain *why*, never *what*.
- Database migrations MUST be generated and checked into `prisma/migrations`.
  `db push` MUST NOT be used: the test database is built by replaying the
  committed migrations, so an uncommitted schema change does not exist as far
  as the tests are concerned.
- A new table MUST be added to the cleanup in `vitest.setup.ts`, in
  foreign-key-safe order, in the same task that introduces it.
- Constraints that protect a rule (uniqueness, cascades) MUST exist in the
  schema and not only in application code, and their effect MUST be asserted
  rather than assumed.
- The vocabulary in `.claude/specs/000-product/spec.md` is binding in code and
  on screen: Member, Expense, Payer, Participant, Share, Balance, Settlement,
  Settle up. The banned synonyms — "bill", "debt", "transaction", "user" on
  screen, and "split" as a noun — MUST NOT appear in user-facing text.

## Development Workflow

Work proceeds specification first: `spec.md`, then `plan.md`, then `tasks.md`,
each under `.claude/specs/<NNN>-<slug>/`.

- A specification is written in product language and contains no technology
  terminology. It states its acceptance criteria in Given / When / Then form
  and addresses money and rounding, empty state, duplicate input, deletion,
  zero values, and negative values — each either as defined behaviour or as an
  explicit out-of-scope declaration.
- Uncertainty MUST be recorded as an open question and answered by the author
  of the product before implementation. A sensible default MUST NOT be chosen
  quietly in order to keep going. If a specification is ambiguous, stop and
  ask.
- A plan names the files it will touch and how each acceptance criterion will
  be proved, including the ones that cannot be automated.
- One task is one commit, with the message format `feat(NNN): <what it does>`.
  Work stays inside the scope of the task given — unrelated files are not
  edited, even to improve them.
- Before any task is reported complete, `npm test` and `npx tsc --noEmit` are
  run and their real output shown. Claiming completion without that output is
  a violation of this constitution, not a stylistic lapse.

## Governance

This constitution governs how Splitsy is built. Where a practice, habit, or
convenience conflicts with it, this document wins.

`CLAUDE.md` remains binding for day-to-day mechanics and is written to agree
with this document. Where the two appear to conflict, work MUST stop and the
conflict MUST be raised with the project author rather than resolved by
picking whichever seems more sensible. The same applies where a direct
instruction conflicts with a principle here: raise it, do not silently choose.

**Amendment procedure**: an amendment is proposed as a change to this file in
its own commit, stating what changes, why, and what existing code becomes
non-compliant as a result. Any code left non-compliant MUST be listed with the
plan to bring it into line. Amendments take effect once committed.

**Versioning policy**: this document is versioned semantically.

- MAJOR — a principle is removed, or redefined so that previously compliant
  code becomes non-compliant.
- MINOR — a principle or section is added, or existing guidance is materially
  expanded.
- PATCH — clarification, rewording, or a correction that changes no rule.

**Compliance review**: every plan states which principles constrain it, and
every review checks the change against them. The two non-negotiable principles
— Authorisation On The Server, and Money Is Exact — are checked on every change
that touches authorisation or an amount, without exception. Complexity beyond
what a principle allows MUST be justified in the plan at the time it is
proposed, not defended afterwards.

**Version**: 1.0.0 | **Ratified**: 2026-08-17 | **Last Amended**: 2026-08-17
