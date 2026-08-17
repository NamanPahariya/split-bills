# Phase 0 — Research: Expenses and Split Modes

Seven questions had to be settled before the design could be written. The three
product-level ones were answered by the author and are recorded in the spec's
Decisions section; the five below are technical consequences of those answers
and of the constitution.

## R1 — How leftover cents are handed out

**Decision**: `splitEquallyCents(amountCents, participantCount)` returns an array
of shares. Each share is `floor(amountCents / participantCount)`, and the
remainder — `amountCents - base * participantCount`, always smaller than the
participant count — is handed out one cent each to the first participants in the
order given. The caller supplies participants in the group's own member order
(joined earliest first, id as tiebreak), so the same expense recorded twice
produces identical shares.

**Rationale**: The constitution requires that no cent is dropped and that the
rule assigning the remainder be written down and tested. Integer floor plus a
one-cent distribution sums to the input by construction — the sum is
`base * n + remainder`, which is `amountCents` by the definition of remainder —
so the property holds for every input rather than for the examples that happen
to be tested. Taking the order from the caller keeps the function pure and
makes repeatability the caller's stated ordering rather than a hidden rule.

**Alternatives considered**: Rounding each share to the nearest cent and
adjusting the largest — needs a second pass and can move more than one cent.
Giving the whole remainder to the payer — punishes whoever paid, and is
surprising when the payer is not a participant. Distributing at random for
"fairness" over time — unrepeatable, and directly contradicts SC-003.

## R2 — Representing a member who has left, without a second source of truth

**Decision**: `Expense.payerId` and `ExpenseShare.accountId` reference `Account`,
not `GroupMember`. Membership is checked at the moment of recording or changing,
against the live `GroupMember` rows. Nothing is copied onto the expense. Whether
a person named in an expense is still a member is answered at read time by
looking for their `GroupMember` row in that group.

**Rationale**: The author's decision is that an expense goes on naming a member
who has left. If the expense pointed at `GroupMember`, the row would be deleted
the moment they leave — feature 002 hard-deletes membership — and the expense
would lose its payer. Pointing at `Account` lets the record stay true while
`GroupMember` remains the single answer to "who is in this group", satisfying
Principle II. Copying a display name onto the expense would create a second,
staler source of truth for a person's name and is rejected for the same reason.

**Alternatives considered**: Soft-deleting `GroupMember` with a `leftAt` date —
rejected in feature 002 for reasons that still hold, and it would make every
membership query carry a filter that is a security bug when forgotten. Denormalising
the payer's display name onto the expense — breaks when somebody renames
themselves, which feature 001 explicitly allows.

## R3 — Authorisation without duplicating the membership rule

**Decision**: Every domain function in `expenses.ts` fetches through the group
relation in a single query, for example
`prisma.expense.findFirst({ where: { id: expenseId, group: { members: { some: { accountId } } } } })`.
Failure is reported as `EXPENSE_NOT_FOUND`. Listing uses the same shape against
the group. `groups.ts` does not need to export its private guard.

**Rationale**: Principle IV requires the authorisation predicate to be in the
same query as the fetch, and Principle II forbids a second copy of a rule. These
pull in opposite directions only if "the rule" is taken to be the SQL; it is
not. The rule — that membership is a `GroupMember` row for that group and
account — stays owned by the groups feature and its schema. Expenses navigate
that relation rather than reimplementing what membership means, so there is
nothing to drift.

**Alternatives considered**: Exporting `memberGroup` from `groups.ts` and calling
it first — two queries with a gap between them, and it lets a caller check
membership for one group and then read an expense from another. A shared
`assertMember` helper in a new module — a fourth layer in all but name, which
Principle I forbids without an amendment.

## R4 — Ordering, and why it is specified rather than left to the database

**Decision**: Expenses in a group are ordered `createdAt` descending with `id`
descending as a tiebreak. Shares within an expense, and members within the
participant picker, follow the group's member order: `joinedAt` ascending, `id`
ascending.

**Rationale**: SQLite's `DATETIME` granularity lets two rows written in the same
request share a timestamp, and FR-014 requires "most recent first" to be a
stable answer rather than one that reshuffles between renders. The share
ordering matters more than it looks: R1 hands leftover cents to the earliest
participants, so an unstable member order would make SC-003 false.

**Alternatives considered**: Ordering by `id` alone — cuid is not
time-ordered in a way this may rely on. Leaving the order unspecified — makes
the remainder rule unrepeatable, which the constitution forbids.

## R5 — Transaction boundaries

**Decision**: Recording an expense writes the expense and all its shares as one
nested create, so an expense with no shares is never observable. Changing an
expense deletes its existing shares and writes the new set inside one
`prisma.$transaction` together with the update to the expense itself. Removing
an expense is a single `deleteMany`, with the shares following by cascade.

**Rationale**: An expense whose shares do not add up to its amount would violate
Principle V, and a half-applied correction is exactly how that state comes
about. Replacing the share set wholesale rather than diffing it keeps the
invariant a property of one write, and means a correction that changes the
participant list needs no special case. `deleteMany` for removal keeps a
double-submitted confirmation harmless, matching `destroySession` and
`deleteGroup`.

**Alternatives considered**: Diffing shares — more code, and every diff bug is a
lost cent. Recording an audit row per correction — rejected by the author's
third decision; the correction timestamp on the expense is what was asked for.

## R6 — What a correction records

**Decision**: `Expense` carries `updatedAt`, maintained automatically, and a
nullable `correctedAt` set explicitly the first and every subsequent time an
expense is changed after it was recorded. The screen shows "corrected" with that
timestamp when it is present. No previous values are kept.

**Rationale**: The author's decision is that a correction records that it
happened and when, and no more. `updatedAt` alone is not enough: it moves for
any write, so it cannot distinguish "never touched since it was recorded" from
"corrected", which is exactly the distinction FR-021 and SC-006 require. A
separate explicit field states the intent and is not disturbed by unrelated
writes.

**Alternatives considered**: Comparing `updatedAt` with `createdAt` — fragile,
since they differ by microseconds on creation in some drivers, and it encodes a
rule in an inequality nobody can read. A full version table — a feature of its
own, explicitly not this one.

## R7 — Testing the money rule properly

**Decision**: `money.test.ts` tests `splitEquallyCents` exhaustively over a wide
grid — every amount from 0 to a few hundred cents across participant counts from
1 to 12 — asserting for every case that the shares sum to exactly the amount and
that no two shares differ by more than one cent. `expenses.test.ts` covers the
database-backed rules with the project's existing `// FR-n` comment convention.

**Rationale**: Principle V is a claim about every input, not about four
examples, and the pure function makes checking thousands of cases cheap.
Splitting the arithmetic out of `expenses.ts` is what buys this; that is the
justification for the extra module recorded in the plan's Constitution Check.

**Alternatives considered**: A handful of example tests — would pass while the
remainder rule was subtly wrong for, say, three people and a one-cent remainder.
A property-testing library — a new dependency, and the input space here is small
enough to enumerate outright.
