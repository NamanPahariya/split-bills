# Contract — Routes, server actions, and wording

## Routes

| Route | Shows | Guard |
| --- | --- | --- |
| `GET /groups/[groupId]/expenses` | Every expense in the group, most recent first, with a form to record one | `requireAccount()`, then `listExpensesForGroup` refuses a non-member |
| `GET /groups/[groupId]/expenses/[expenseId]` | One expense with its shares, a form to correct it, and a button to remove it | `requireAccount()`, then `getExpenseForAccount` refuses a non-member |

`src/middleware.ts` already matches `/groups/:path*` after feature 002, so no
change is needed there. Middleware checks only that a session cookie is present;
the page is the real gate.

## Server actions

All in `src/app/groups/[groupId]/expenses/actions.ts`. Each calls
`requireAccount()` itself and takes the group or expense id from the route, never
an account id from the form.

```ts
export type ExpenseFormState = { error?: string; saved?: boolean }

recordExpenseAction(previous: ExpenseFormState, formData: FormData): Promise<ExpenseFormState>
// recordExpense → revalidatePath the group's expenses → redirect to the list

changeExpenseAction(previous: ExpenseFormState, formData: FormData): Promise<ExpenseFormState>
// changeExpense → revalidatePath → { saved: true }

removeExpenseAction(formData: FormData): Promise<void>
// removeExpense → redirect to the group's expenses
```

### Form fields

| Field | Type | Notes |
| --- | --- | --- |
| `expenseId` | hidden | Change and remove only. Safe to trust because the guard validates it against membership. |
| `description` | text | Required by the domain, not by the browser, so the blank case is proved on the server. |
| `amount` | text | Entered as "12.34" and converted to `1234` cents in the action before the domain sees it. The domain never receives a decimal. |
| `payerId` | select | Current members only. |
| `mode` | radio | `EQUALLY` or `EXACT`. |
| `participantIds` | checkboxes | Current members only. Used when `mode` is `EQUALLY`. |
| `share:<accountId>` | text | One per ticked participant, used when `mode` is `EXACT`. Converted to cents in the action. |

Amount parsing lives in the action, per CLAUDE.md's rule that formatting to
"$12.34" happens only in components and by the same logic in reverse: the
domain deals exclusively in integer cents. An unparseable amount becomes
`AMOUNT_NOT_POSITIVE`.

## Wording

An exhaustive `Record<ErrorCode, string>` per action, so adding a domain error
code fails the type check until somebody writes its message.

| Code | Message |
| --- | --- |
| `GROUP_NOT_FOUND` | We could not find that group. |
| `EXPENSE_NOT_FOUND` | We could not find that expense. |
| `DESCRIPTION_REQUIRED` | Please say what the money went on. |
| `AMOUNT_NOT_POSITIVE` | Enter an amount greater than nothing. |
| `PAYER_NOT_A_MEMBER` | Choose somebody who is in this group as the payer. |
| `PARTICIPANTS_REQUIRED` | Choose at least one person this was spent on. |
| `PARTICIPANT_NOT_A_MEMBER` | One of the people chosen is not in this group. |
| `SHARES_OVER` | The shares come to {difference} more than the amount. |
| `SHARES_UNDER` | The shares are {difference} short of the amount. |
| `SHARE_NOT_POSITIVE` | Every person chosen needs a share greater than nothing. |

`{difference}` is formatted in the component, not the action — the action
returns the message with the figure already formatted only because the string is
a whole sentence; the formatting helper it calls is the same one the list uses.

The two "not found" messages are worded so that neither confirms the record
exists. Vocabulary follows the product spec: Member, Expense, Payer,
Participant, Share. The banned synonyms — "bill", "debt", "transaction", "user",
and "split" as a noun — appear in no message.

## Components

All `"use client"`, named exports, props typed inline, local state type,
`useActionState(action, {})` destructured as `[state, submit, pending]`, errors
in a `role="alert"` paragraph. Existing Tailwind vocabulary reused verbatim.

| Component | Props | Notes |
| --- | --- | --- |
| `ExpenseForm` | `members`, `action`, optional `expense` | One component for recording and correcting; the optional expense supplies `defaultValue`s. Switching `mode` shows or hides the per-person share inputs. |
| `ParticipantPicker` | `members`, `defaultSelected` | Current members are selectable. A person named in the expense who has left is shown, marked as no longer in the group, and cannot be selected — FR-029 and FR-030. |
| `ExpenseList` | `expenses` | Most recent first; shows "corrected" with the date when `correctedAt` is set. |
| `ExpenseShares` | `shares` | Formats cents to "$12.34". The only place that conversion happens. |
| `DeleteExpenseButton` | `action`, `expenseId` | Swaps itself for "Remove this expense? / Yes, remove / Cancel". Cancel calls nothing, satisfying FR-023. |

## Requirements not provable by an automated test

`vitest.config.mts` includes only `src/**/*.test.ts`, and no component-rendering
tool is installed. These are covered by the walkthrough in `quickstart.md`
instead, and are listed here so they are not mistaken for gaps:

- **FR-016** — the "nothing recorded yet" message. The domain returns an empty
  array; that it becomes a message is a rendering decision.
- **FR-021 (display half)** — that "corrected" is visible. The domain half,
  `correctedAt` being set, is tested.
- **FR-023** — declining the confirmation. Declining means no action runs, and
  `DeleteExpenseButton` has no other path to `removeExpenseAction`.
- **FR-029, FR-030** — departed members shown as such and not selectable. The
  domain supplies `stillAMember` and refuses a non-member on write, both tested;
  what the picker does with it is not.
