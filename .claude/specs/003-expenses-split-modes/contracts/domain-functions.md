# Contract — Domain functions (`src/lib`)

Every function returns failures as values. Errors are SCREAMING_SNAKE literal
unions exported beside the function. Impossible states throw, with a comment
saying why they are impossible.

## `src/lib/money.ts`

Pure arithmetic. No database, no async, no imports from anywhere else in the
project.

```ts
/**
 * Shares that sum to exactly amountCents. The remainder — always fewer cents
 * than there are participants — goes one each to the earliest participants, so
 * the caller's ordering decides who carries it and the same input always gives
 * the same answer.
 */
export function splitEquallyCents(
  amountCents: number,
  participantCount: number,
): number[]

export type ExactSharesError = "SHARES_OVER" | "SHARES_UNDER" | "SHARE_NOT_POSITIVE"

/**
 * Confirms a hand-entered set of shares. differenceCents is how far the entry
 * is from the amount, so the screen can say "10.00 short" rather than "wrong".
 */
export function validateExactSharesCents(
  amountCents: number,
  shareCents: number[],
): Result<void, { code: ExactSharesError; differenceCents: number }>
```

| Function | Requirements | Notes |
| --- | --- | --- |
| `splitEquallyCents` | FR-010, FR-013, SC-001, SC-003 | Total: defined for every `amountCents > 0` and `participantCount >= 1`. Throws on a participant count below 1 — an impossible state, since FR-005 refuses an expense with no participants before this is reached. |
| `validateExactSharesCents` | FR-011, FR-012, FR-013 | Checks every share is positive before comparing the sum, so a set containing a zero is reported as a zero rather than as being short. |

## `src/lib/expenses.ts`

```ts
export type PersonRecord = { accountId: string; displayName: string; stillAMember: boolean }
export type ShareRecord = { person: PersonRecord; shareCents: number }
export type ExpenseRecord = {
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

export type SplitInput =
  | { mode: "EQUALLY"; participantIds: string[] }
  | { mode: "EXACT"; shares: { accountId: string; shareCents: number }[] }

export type RecordExpenseInput = {
  accountId: string        // the person doing it, from the session
  groupId: string
  description: string
  amountCents: number
  payerId: string
  split: SplitInput
}

export type RecordExpenseError =
  | "GROUP_NOT_FOUND"
  | "DESCRIPTION_REQUIRED"
  | "AMOUNT_NOT_POSITIVE"
  | "PAYER_NOT_A_MEMBER"
  | "PARTICIPANTS_REQUIRED"
  | "PARTICIPANT_NOT_A_MEMBER"
  | "SHARES_OVER"
  | "SHARES_UNDER"
  | "SHARE_NOT_POSITIVE"

export async function recordExpense(
  input: RecordExpenseInput,
): Promise<Result<ExpenseRecord, RecordExpenseError>>

export type ChangeExpenseInput = Omit<RecordExpenseInput, "groupId"> & { expenseId: string }
export type ChangeExpenseError = Exclude<RecordExpenseError, "GROUP_NOT_FOUND"> | "EXPENSE_NOT_FOUND"

export async function changeExpense(
  input: ChangeExpenseInput,
): Promise<Result<ExpenseRecord, ChangeExpenseError>>

export type RemoveExpenseError = "EXPENSE_NOT_FOUND"
export async function removeExpense(
  input: { accountId: string; expenseId: string },
): Promise<Result<null, RemoveExpenseError>>

export type ListExpensesError = "GROUP_NOT_FOUND"
export async function listExpensesForGroup(
  input: { accountId: string; groupId: string },
): Promise<Result<ExpenseRecord[], ListExpensesError>>

export type GetExpenseError = "EXPENSE_NOT_FOUND"
export async function getExpenseForAccount(
  input: { accountId: string; expenseId: string },
): Promise<Result<ExpenseRecord, GetExpenseError>>
```

### Behaviour each function guarantees

| Function | Requirements | Contract |
| --- | --- | --- |
| `recordExpense` | FR-001 to FR-013 | Order: membership guard on the group → description trimmed and non-empty → amount positive → payer is a current member → at least one participant → participants are current members and de-duplicated → split computed or validated → single nested write of expense and shares. Any failure writes nothing. |
| `changeExpense` | FR-018 to FR-021 | The same rules in the same order as recording, per FR-019 — a change cannot leave an expense in a state recording would have refused. Replaces the whole share set inside one transaction and sets `correctedAt`. On failure the expense keeps every previous value. |
| `removeExpense` | FR-022, FR-024 | Guard, then `deleteMany` so a double confirmation is harmless. Shares go by cascade. Takes no `confirmed` flag: the confirmation is a state of the screen, not a business rule. |
| `listExpensesForGroup` | FR-014, FR-016, FR-017 | Most recent first, `id` descending as tiebreak. Returns an empty array for a group with no expenses — that is an ordinary answer, and the "nothing recorded yet" message is the screen's decision. |
| `getExpenseForAccount` | FR-015 | Returns the expense with every share and the person carrying it. |

### Authorisation contract

Every function above fetches through the group relation in one query:

```ts
where: { id: expenseId, group: { members: { some: { accountId } } } }
```

- A person who is not a member gets `EXPENSE_NOT_FOUND` — identical to the
  answer for an expense that never existed. The code is named for what the
  caller may learn, so it cannot leak existence when it reaches a message map.
  (FR-026, SC-007, Principle IV)
- The guard runs before description, amount, and share validation, so an
  outsider cannot probe the input rules of a group they cannot see, and a
  refused call leaves the record unchanged. (FR-025)
- `accountId` always comes from the session. No function accepts it from form
  input, and `recordedById` is never taken from the client.

### Deliberate absences

- **No `settleUp`, `balanceFor`, or any function returning a figure per person
  across expenses.** Principle VII. The only sums here are within one expense.
- **No `moveExpenseToGroup`.** An expense belongs to one group permanently.
- **No permission parameter.** FR-027 gives every member the same rights, so
  there is nothing to pass.

A test asserts the module's exported names are exactly the five functions above,
so adding one of these later fails loudly rather than quietly.
