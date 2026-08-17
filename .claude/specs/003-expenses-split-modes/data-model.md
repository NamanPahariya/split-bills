# Phase 1 — Data Model: Expenses and Split Modes

Two new tables. Neither stores any figure that could be read as a balance.

## Schema additions

```prisma
model Expense {
  id            String         @id @default(cuid())
  groupId       String
  group         Group          @relation(fields: [groupId], references: [id], onDelete: Cascade)
  description   String
  amountCents   Int
  payerId       String
  payer         Account        @relation("ExpensesPaid", fields: [payerId], references: [id], onDelete: Cascade)
  recordedById  String
  recordedBy    Account        @relation("ExpensesRecorded", fields: [recordedById], references: [id], onDelete: Cascade)
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  correctedAt   DateTime?
  shares        ExpenseShare[]

  @@index([groupId, createdAt])
}

model ExpenseShare {
  id          String   @id @default(cuid())
  expenseId   String
  expense     Expense  @relation(fields: [expenseId], references: [id], onDelete: Cascade)
  accountId   String
  account     Account  @relation(fields: [accountId], references: [id], onDelete: Cascade)
  shareCents  Int

  @@unique([expenseId, accountId])
  @@index([accountId])
}
```

`Group` gains `expenses Expense[]`. `Account` gains `expensesPaid Expense[] @relation("ExpensesPaid")`,
`expensesRecorded Expense[] @relation("ExpensesRecorded")`, and `expenseShares ExpenseShare[]`.

The two `Account` relations on `Expense` need explicit names because there are
two of them between the same pair of models; Prisma cannot disambiguate
otherwise.

## Fields and the rules they carry

### Expense

| Field | Rule | Requirement |
| --- | --- | --- |
| `groupId` | An expense belongs to exactly one group and cannot be moved. Cascades when the group is deleted, since the group is the only place it could be seen. | FR-025, Edge case "A group that is deleted" |
| `description` | Trimmed; refused when empty or only spaces. No maximum length. | FR-002 |
| `amountCents` | Integer cents, strictly greater than zero. Never a float, never a string. | FR-003, Principle V |
| `payerId` | Exactly one, and a member of the group at the moment of recording or changing. References `Account`, so the expense goes on naming them after they leave. | FR-004, FR-028 |
| `recordedById` | Who wrote it down, taken from the session and never from form input. Kept for display only — it grants no permission, since any member may change or remove any expense. | FR-008, FR-027 |
| `createdAt` | When it was recorded. Also the sort key. | FR-008, FR-014 |
| `updatedAt` | Maintained automatically. Not used to decide whether an expense was corrected. | R6 |
| `correctedAt` | Null until the expense is changed after recording; set on every change thereafter. This, not `updatedAt`, is what the screen reads. | FR-021, SC-006 |

### ExpenseShare

| Field | Rule | Requirement |
| --- | --- | --- |
| `expenseId` | Cascades, so removing an expense takes its shares with it. | FR-024 |
| `accountId` | A member of the group at the moment of recording or changing. References `Account` for the same reason as `payerId`. | FR-005, FR-028 |
| `shareCents` | Integer cents, strictly greater than zero. | FR-012 |

## Invariants

1. **The shares of an expense sum to exactly its `amountCents`.** Enforced by
   construction on both write paths: equal splits come from
   `splitEquallyCents`, which sums to its input by definition, and exact splits
   are refused unless they sum. There is no tolerance and no reconciliation
   step. (FR-013, SC-001, Principle V)
2. **An expense has at least one share.** Written with its shares in a single
   nested create, so a shareless expense is never observable. (FR-005)
3. **A participant appears at most once per expense.** Guaranteed by
   `@@unique([expenseId, accountId])`, not only by the check that produces the
   friendly message. (FR-006)
4. **Every `payerId` and `accountId` was a member of the group when written.**
   Checked against live `GroupMember` rows on every write. Not re-checked on
   read, which is what allows an expense to outlive a departure. (FR-005,
   FR-028, FR-030)
5. **No row stores a total, a net position, or an amount owed.** The only sums
   in this feature are within one expense. (Principle VII)

## Indexes

- `@@index([groupId, createdAt])` on `Expense` — serves the one query the list
  screen makes, filtered by group and ordered by recency.
- `@@unique([expenseId, accountId])` on `ExpenseShare` — invariant 3.
- `@@index([accountId])` on `ExpenseShare` — foreign keys are not indexed
  automatically in SQLite, and the unique index above starts with `expenseId`,
  so it cannot answer "which expenses name this person". Needed by the read
  model that marks departed participants, and by the future balances feature,
  which is not built here.

## Read model

The domain returns hand-written records, never Prisma rows:

```ts
type ExpenseRecord = {
  id: string
  groupId: string
  description: string
  amountCents: number
  payer: PersonRecord
  recordedBy: PersonRecord
  createdAt: Date
  correctedAt: Date | null
  shares: ShareRecord[]
}

type ShareRecord = { person: PersonRecord; shareCents: number }

// stillAMember answers FR-029 without copying anything onto the expense.
type PersonRecord = {
  accountId: string
  displayName: string
  stillAMember: boolean
}
```

`ShareRecord` deliberately has no running total and no per-person figure across
expenses. `ExpenseRecord.shares` sums to `amountCents` and to nothing else.

## Migration and test setup

Generated into `prisma/migrations/<timestamp>_add_expense_and_expense_share/`
and checked in, since the test database is built by replaying the committed
migrations.

`vitest.setup.ts` cleanup becomes, children first:

```ts
await prisma.expenseShare.deleteMany();
await prisma.expense.deleteMany();
await prisma.groupMember.deleteMany();
await prisma.group.deleteMany();
await prisma.session.deleteMany();
await prisma.account.deleteMany();
```
