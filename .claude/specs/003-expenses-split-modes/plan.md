# Implementation Plan: Expenses and Split Modes

**Branch**: `feature/expenses` | **Date**: 2026-08-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `.claude/specs/003-expenses-split-modes/spec.md`

## Summary

A member of a group records what money went on, how much it was, who paid, and
which members it was spent on, split either equally or by exact shares. Any
member of the group can then read, correct, or remove it. Two tables carry the
feature — an expense and one share per participant — and the arithmetic that
guarantees the shares add up to exactly the amount lives in a pure function with
no database near it.

The feature deliberately stops at the fact. It records what happened and never
computes what anybody owes; balances are a separate feature and this one does
not anticipate it.

## Technical Context

**Language/Version**: TypeScript 5, React 19, Next.js 16.3 (App Router)

**Primary Dependencies**: Prisma 7 with the better-sqlite3 driver adapter,
Tailwind 4. No new dependency is proposed.

**Storage**: SQLite via Prisma, migrations generated and checked in under
`prisma/migrations` and replayed by the test setup.

**Testing**: Vitest 4, running `src/**/*.test.ts` against a real SQLite file per
test file.

**Target Platform**: Web application rendered on the server; no separate client
data layer, no route handlers, no client-side fetching.

**Project Type**: Single Next.js application with a three-layer internal split
(`src/app`, `src/lib`, `src/components`).

**Performance Goals**: A group's expense list renders in one page load with no
pagination. Groups are small and fixed — the product exists for flatmates and
trips, not for accounts with thousands of records.

**Constraints**: Money is an integer number of cents throughout; the parts of a
split add up to exactly the whole, always. Authorisation is enforced in the same
query that fetches the record. Nothing in this feature computes a balance.

**Scale/Scope**: Two new tables, one new pure module, one new domain module, two
new screens, five new components, one migration.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | How this plan satisfies it | Verdict |
| --- | --- | --- |
| I. Simple Architecture | Rules in `src/lib/expenses.ts` and `src/lib/money.ts`; screens and actions in `src/app/groups/[groupId]/expenses`; presentational components only. No new layer, no new top-level directory. Failures returned as `Result` values. | PASS |
| II. Reuse Before Building | Membership is not re-implemented: expenses reach it through the group relation, so `GroupMember` stays the single answer to "who is in this group". `Result`, `prisma`, `requireAccount()`, and the existing form and Tailwind conventions are reused as they are. | PASS |
| III. Protect Shipped Behaviour | Nothing in features 001 or 002 changes behaviour. Leaving a group stays immediate and unconfirmed (AC-13 of 002) — the leaver decision was made specifically so that this feature does not have to weaken it. `npm test` and `npx tsc --noEmit` gate every task. | PASS |
| IV. Authorisation On The Server | Every action calls `requireAccount()` itself. Every domain function fetches the expense and the membership in one query, and reports `EXPENSE_NOT_FOUND` so a non-member cannot tell a missing expense from one they may not see. | PASS |
| V. Money Is Exact | Every amount is an integer number of cents named `...Cents`. `splitEquallyCents` returns shares that sum to the input by construction, with the remainder handed out one cent at a time in a fixed order. Exact-share entry is refused unless it sums exactly. Formatting to "$12.34" happens only in components. | PASS |
| VI. Tests For Business Rules | `money.test.ts` beside `money.ts`, `expenses.test.ts` beside `expenses.ts`, one `// FR-n` comment per requirement proved. Requirements that cannot be tested in this stack are named in the test plan with the manual check that covers them. | PASS |
| VII. Features Stay Independent | No module here imports a balances module; none exists. No expense or share row stores a running total, an amount owed, or a net position. Nothing sums shares across expenses anywhere in this feature. | PASS |

No violations. The Complexity Tracking table is therefore empty and omitted.

One judgement worth recording: `splitEquallyCents` lives in its own
`src/lib/money.ts` rather than inside `expenses.ts`. It is pure arithmetic with
no database, so it can be tested exhaustively over hundreds of amount and
participant combinations in milliseconds, which is the only practical way to
prove Principle V holds for every input rather than for four examples.

## Project Structure

### Documentation (this feature)

```text
.claude/specs/003-expenses-split-modes/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── domain-functions.md
│   └── server-actions.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Created by /speckit-tasks, not by this command
```

### Source Code (repository root)

```text
prisma/
├── schema.prisma                       # EDIT: Expense, ExpenseShare
└── migrations/<ts>_add_expense_and_expense_share/
    └── migration.sql                   # NEW

src/
├── lib/
│   ├── money.ts                        # NEW: splitEquallyCents, validateExactSharesCents
│   ├── money.test.ts                   # NEW
│   ├── expenses.ts                     # NEW: record, list, read, change, remove
│   ├── expenses.test.ts                # NEW
│   ├── groups.ts                       # (feature 002, unchanged)
│   └── accounts.ts                     # (feature 001, unchanged)
├── app/
│   └── groups/[groupId]/
│       ├── page.tsx                    # EDIT: link to the group's expenses
│       └── expenses/
│           ├── page.tsx                # NEW: the group's expenses, most recent first
│           ├── actions.ts              # NEW: record, change, remove
│           └── [expenseId]/
│               └── page.tsx            # NEW: one expense, with its shares
└── components/
    ├── ExpenseForm.tsx                 # NEW: used for recording and for correcting
    ├── ExpenseList.tsx                 # NEW
    ├── ExpenseShares.tsx               # NEW
    ├── ParticipantPicker.tsx           # NEW: members, with departed ones marked
    └── DeleteExpenseButton.tsx         # NEW: confirm/decline

vitest.setup.ts                          # EDIT: clear the two new tables
```

**Structure Decision**: The existing three-layer layout is used unchanged.
Expenses live under the group route because an expense cannot exist outside a
group, so the group id is always a route parameter rather than a form field —
which is also what makes it safe to trust, since the membership guard is what
validates it.

## Phase 0 — Research

Complete. See [research.md](./research.md). It resolves the equal-split
remainder rule, how a departed member is represented without a second source of
truth about membership, how authorisation reuses the group relation without
duplicating it, the ordering rules, and the transaction boundaries for recording
and correcting.

## Phase 1 — Design

Complete. See:

- [data-model.md](./data-model.md) — `Expense` and `ExpenseShare`, their fields,
  relations, constraints, and the rules each field carries.
- [contracts/domain-functions.md](./contracts/domain-functions.md) — every
  exported function of `src/lib/money.ts` and `src/lib/expenses.ts`, with its
  input, its result, its error union, and the requirements it satisfies.
- [contracts/server-actions.md](./contracts/server-actions.md) — the routes, the
  server actions, their form fields, and the wording each error code becomes.
- [quickstart.md](./quickstart.md) — how to run and prove the feature end to end,
  automated and by hand.

### Constitution re-check after design

Re-evaluated against the finished design: all seven principles still PASS. Two
places were tightened by the design rather than assumed:

- **Principle V** — the design refuses an exact-share set that does not sum to
  the amount rather than adjusting it, and `splitEquallyCents` is total: it
  returns shares for every valid input rather than failing on awkward ones.
- **Principle VII** — the read model returns shares per expense and never a
  figure per person across expenses, so there is no shape in this feature that a
  balance could be read out of by accident.

## Complexity Tracking

No constitution violations to justify.
