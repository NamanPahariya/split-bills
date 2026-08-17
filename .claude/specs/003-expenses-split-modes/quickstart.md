# Quickstart — Validating Expenses and Split Modes

How to prove this feature works, end to end. Written to be run by somebody who
did not build it.

## Prerequisites

- Features 001 (accounts) and 002 (groups and members) working.
- Dependencies installed: `npm install`.
- The migration for this feature applied: `npx prisma migrate dev`.

## Automated checks

Both must pass, and their real output shown, before any task is reported done.

```bash
npm test
npx tsc --noEmit
```

Expected: every test file passes, and `tsc` prints nothing and exits 0.

To run only this feature's domain tests while working:

```bash
npx vitest run src/lib/money.test.ts src/lib/expenses.test.ts
```

### What the automated tests establish

| Area | What is proved |
| --- | --- |
| `money.test.ts` | Over every amount from 0 to a few hundred cents across 1–12 participants: the shares sum to exactly the amount, and no two shares differ by more than one cent. Hand-entered shares that come to more or less than the amount are refused with the difference named. |
| `expenses.test.ts` — recording | Blank description, zero amount, negative amount, no participants, a payer outside the group, and a participant outside the group are each refused and write nothing. A duplicated participant is counted once. |
| `expenses.test.ts` — reading | A member sees every expense in their group, most recent first, and none from a group they are not in. A group with no expenses returns an empty list rather than failing. |
| `expenses.test.ts` — correcting | Any member can correct any expense, `correctedAt` is set, a correction that would not add up is refused, and the expense keeps its previous values on refusal. |
| `expenses.test.ts` — removing | Any member can remove any expense; the shares go with it; removing twice is not an error. |
| `expenses.test.ts` — refusals | A non-member gets `EXPENSE_NOT_FOUND`, identical to the answer for an expense id that never existed. |
| `expenses.test.ts` — leavers | An expense goes on naming its payer after they leave the group; leaving is not refused; that person cannot be chosen for a new expense. |
| `expenses.test.ts` — module shape | The exported names are exactly the five functions in the contract, so a balance function added here fails the test. |

## Manual walkthrough

Run the app with two accounts. This covers the requirements no automated test in
this stack can reach.

```bash
npm run dev
```

**Setup.** Sign up as Ada (`ada@example.com`) and, in another browser or a
private window, as Grace (`grace@example.com`). As Ada, create a group "Goa
Trip" and add `grace@example.com`.

1. **Empty state (FR-016).** Open the group's expenses as Ada. Expect a message
   saying nothing has been recorded yet — not a blank page, not an error.

2. **Record, split equally (FR-001, FR-010).** Record "Taxi from the airport",
   90.00, paid by Ada, spent on Ada and Grace, split equally. Expect it listed
   with two shares of 45.00. Sign in as Grace: expect the same expense with the
   same figures.

3. **Leftover cents (FR-010, SC-003).** Record "Coffees", 10.00, paid by Grace,
   spent on both, split equally. Expect shares of 5.00 and 5.00. Now record
   "Pastries", 0.05, spent on both: expect 0.03 and 0.02 — five cents, not four,
   and the extra cent going to the same person every time you repeat it.

4. **Exact shares (FR-011).** Record "Dinner", 100.00, spent on both, with exact
   shares of 60.00 and 30.00. Expect a refusal saying the shares are 10.00
   short, and nothing recorded. Change 30.00 to 40.00 and expect it recorded.

5. **Refusals that change nothing (FR-002, FR-003, FR-012).** Try a blank
   description, an amount of 0, an amount of -5, and an exact share of 0. Expect
   a clear message each time and no new expense in the list.

6. **Anybody may correct (FR-018, FR-027).** As Grace, correct the taxi expense
   that Ada recorded — change 90.00 to 96.00. Expect it accepted, the shares now
   48.00 each, and Ada seeing the new figures.

7. **A correction is visible (FR-021, SC-006).** Still as Ada, look at the taxi
   expense. Expect it marked as corrected, with when. The two expenses nobody
   touched are not marked.

8. **Removing, and declining (FR-022, FR-023).** As Ada, remove the pastries.
   Expect to be asked to confirm; decline, and expect the expense still there for
   both people. Confirm, and expect it gone for both.

9. **A member who leaves (FR-028, FR-029, FR-030).** As Grace, leave the group.
   Expect no confirmation and no refusal, even though she is named in expenses.
   As Ada, open the expenses: expect Grace still named as payer and participant
   where she was, shown as no longer in the group. Start recording a new
   expense: expect Grace not selectable as payer or participant.

10. **Refusing an outsider (FR-025, FR-026, SC-007).** Sign up as a third person,
    Charles, who is in no groups. Paste the URL of Ada's expense list, and then
    of a single expense. Expect refusal in both cases, worded so that Charles
    cannot tell whether the group or the expense exists. Compare with pasting a
    URL containing an expense id that never existed: the two must be
    indistinguishable.

11. **Signed out.** Sign out and load the expenses URL. Expect a redirect to
    `/signin`.

## What must NOT appear anywhere

A check on Principle VII, worth doing deliberately at the end:

- No total per person, no "owes", no "is owed", no running balance, no settle-up
  suggestion, on any screen this feature adds.
- No stored column holding any of the above.

If any of those appear, the feature has absorbed the balances work and the plan
has been departed from.
