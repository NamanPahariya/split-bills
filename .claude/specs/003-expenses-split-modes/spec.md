# Feature Specification: Expenses and Split Modes

**Feature Branch**: `feature/expenses`

**Created**: 2026-08-17

**Status**: Draft

**Input**: User description: "Build the Expenses feature for our existing Splitwise-like application. Accounts and Groups/Members are already implemented. A group member should be able to add an expense, choose who paid, select the members involved, and split the expense either equally or using exact amounts. Users should be able to view expenses in their groups and edit or delete expenses where they have permission. Only valid members of the group should be involved in an expense. Balances will be implemented separately later, so don't build the Balances feature as part of this work. Use the existing application behavior and conventions wherever relevant."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Record an expense split equally (Priority: P1)

A member of a group paid for something the group shared — the taxi, the
groceries, the table at dinner. They open the group, describe what the money
went on, enter the amount, say who paid, tick the members it was spent on, and
record it split equally between them. The expense appears in the group for
everybody in it to see.

**Why this priority**: This is the moment the product exists for. Equal splits
are the overwhelmingly common case, and until an expense can be recorded,
nothing else in the feature has anything to act on.

**Independent Test**: Fully testable by recording one expense in a group with
two or more members and confirming every member sees it with the same payer,
amount, participants, and shares. Delivers the whole of the "stop doing
arithmetic in a group chat" value on its own.

**Acceptance Scenarios**:

1. **Given** a member of a group with three members, **When** they record an
   expense of 90.00 paid by themselves, spent on all three, split equally,
   **Then** the expense is recorded with three shares of 30.00 and appears in
   the group.
2. **Given** a member recording an expense, **When** they choose a payer who is
   a member of the group but tick only some members as participants, **Then**
   the expense is recorded and only the ticked members carry a share.
3. **Given** a member recording an expense, **When** the amount does not divide
   evenly between the participants, **Then** the expense is still recorded and
   the shares add up to exactly the amount, with the leftover cents assigned to
   specific participants rather than dropped.
4. **Given** a member recording an expense, **When** they select no
   participants, **Then** the expense is not recorded and they are told at
   least one participant is required.

---

### User Story 2 - See what has been recorded in a group (Priority: P2)

A member opens a group and sees every expense recorded in it — what it was for,
how much, who paid, and who it was spent on — most recent first, so they can
check that what they remember spending matches what has been written down.

**Why this priority**: Recording without reading is a write-only ledger. This is
what makes an expense verifiable by the people it concerns, and it is the screen
every later feature builds on.

**Independent Test**: Testable by recording expenses in two different groups and
confirming each group shows its own and only its own, and that a person who is
not in a group cannot see any of it.

**Acceptance Scenarios**:

1. **Given** a group with several expenses recorded, **When** a member of that
   group looks at it, **Then** they see every expense in it, most recent first,
   each showing what it was for, its amount, its payer, and its participants.
2. **Given** a group with no expenses recorded yet, **When** a member looks at
   it, **Then** they are shown a message saying nothing has been recorded yet,
   rather than a blank space or an error.
3. **Given** a person who is not a member of a group, **When** they try to see
   that group's expenses, **Then** they are refused and learn nothing about
   whether the group or the expense exists.

---

### User Story 3 - Record an expense using exact amounts (Priority: P3)

Sometimes an equal split is wrong: one person had the lobster, one person only
had a starter. The member recording the expense chooses to enter each
participant's share by hand instead, and the product refuses the entry unless
the shares add up to exactly the amount that was spent.

**Why this priority**: Valuable and frequently needed, but a group can use the
product without it — an unequal cost can be recorded as two equal expenses in
the meantime.

**Independent Test**: Testable by recording one expense with hand-entered shares
and confirming both that a correct set is accepted and that a set which does not
add up is refused with the difference named.

**Acceptance Scenarios**:

1. **Given** a member recording an expense of 100.00 spent on three
   participants, **When** they enter shares of 50.00, 30.00, and 20.00,
   **Then** the expense is recorded with exactly those shares.
2. **Given** the same expense, **When** they enter shares of 50.00, 30.00, and
   10.00, **Then** the expense is not recorded and they are told the shares are
   10.00 short of the amount.
3. **Given** the same expense, **When** they enter shares of 50.00, 30.00, and
   30.00, **Then** the expense is not recorded and they are told the shares are
   10.00 over the amount.
4. **Given** a member recording an expense with exact amounts, **When** they
   give one participant a share of nothing, **Then** the expense is not
   recorded and they are told every participant must carry a share.

---

### User Story 4 - Correct an expense that was recorded wrongly (Priority: P4)

Somebody typed 45.00 instead of 54.00, or ticked the wrong person. A member with
permission opens the expense, changes what is wrong, and saves it. The
correction is visible to the group as a correction — the group can see that the
expense was changed, not just what it says now.

**Why this priority**: Corrections matter, but a wrong expense can be removed
and re-recorded until this exists, so it does not block the group.

**Independent Test**: Testable by recording an expense, changing its amount, and
confirming both that every member sees the new figures and that the group can
tell the expense was corrected.

**Acceptance Scenarios**:

1. **Given** an expense recorded in a group, **When** a member with permission
   changes its amount, its payer, or its participants, **Then** every member of
   the group sees the changed expense from then on.
2. **Given** an expense being corrected, **When** the change would leave the
   shares not adding up to the amount, **Then** the change is refused and the
   expense keeps the values it had.
3. **Given** an expense that has been corrected, **When** any member of the
   group looks at it, **Then** they can tell it was corrected and when.
4. **Given** a member without permission to change an expense, **When** they try
   to change it, **Then** they are refused and the expense is unchanged for
   everybody.

---

### User Story 5 - Remove an expense recorded by mistake (Priority: P5)

An expense was recorded twice, or recorded in the wrong group. A member with
permission removes it, after confirming, and it stops appearing for everybody in
the group.

**Why this priority**: The least urgent of the five — a mistaken expense is
visible and can be worked around by the people in the group until it can be
removed.

**Independent Test**: Testable by recording an expense, removing it, and
confirming it is gone for every member of the group and that declining the
confirmation changes nothing.

**Acceptance Scenarios**:

1. **Given** an expense recorded in a group, **When** a member with permission
   removes it and confirms, **Then** it no longer appears for any member of the
   group.
2. **Given** a member being asked to confirm removing an expense, **When** they
   decline, **Then** the expense is unchanged and still appears for everybody.
3. **Given** a member without permission to remove an expense, **When** they try
   to remove it, **Then** they are refused and the expense is unchanged for
   everybody.

---

### Edge Cases

- **An amount of nothing**: recording an expense of 0.00 is refused, and the
  person is told the amount must be more than nothing.
- **An amount below nothing**: a negative amount is refused. Money coming back
  the other way is a settlement, which is a separate feature.
- **Leftover cents**: when an amount does not divide evenly between
  participants, the leftover cents are handed out one each to participants in a
  fixed, repeatable order until the shares add up to exactly the amount. No
  amount is ever rounded away, and recording the same expense twice produces the
  same shares both times.
- **One participant**: an expense spent on a single participant is recorded
  normally, with that participant carrying the whole amount.
- **The payer is not a participant**: allowed. One member can pay for something
  they had no part in.
- **The payer is the only participant**: allowed and recorded, even though it
  concerns nobody else.
- **Somebody outside the group**: a payer or participant who is not a member of
  the group is refused, and the expense is not recorded.
- **The same participant twice**: a participant named twice in one expense is
  counted once; the expense is not recorded with a duplicate share.
- **Two identical expenses**: recording the same description, amount, payer, and
  participants twice creates two separate expenses. Identical expenses are
  ordinary — two coffees cost the same — and neither is refused nor merged.
- **A description of nothing**: an empty description, or one that is only
  spaces, is refused.
- **Empty group state**: a group with no expenses shows a message saying so.
- **A member who has left**: an expense goes on naming them exactly as recorded,
  shown in a way that makes their departure plain. They cannot be chosen for a
  new expense, or added to an existing one, while they are outside the group.
  Leaving stays immediate and unconfirmed, as the groups feature already
  promises.
- **A group that is deleted**: the expenses recorded in it go with it, since the
  group is the only place they could be seen.

## Requirements *(mandatory)*

### Functional Requirements

**Recording**

- **FR-001**: A member of a group MUST be able to record an expense in that
  group, giving what the money went on, the amount, who paid, and which members
  it was spent on.
- **FR-002**: The system MUST refuse an expense whose description is empty or is
  only spaces.
- **FR-003**: The system MUST refuse an expense whose amount is zero or
  negative, and MUST accept amounts to the cent.
- **FR-004**: The system MUST require exactly one payer, and that payer MUST be
  a member of the group at the time the expense is recorded.
- **FR-005**: The system MUST require at least one participant, and every
  participant MUST be a member of the group at the time the expense is recorded.
- **FR-006**: The system MUST record each participant at most once in a given
  expense.
- **FR-007**: The system MUST allow the payer to be a participant or not, at the
  choice of the person recording.
- **FR-008**: The system MUST record who recorded the expense and when.

**Splitting**

- **FR-009**: The system MUST offer exactly two ways of splitting: equally
  between the chosen participants, or by an exact share entered for each
  participant.
- **FR-010**: When split equally, the system MUST give every participant the
  same share except for leftover cents, which MUST be handed out one each in a
  fixed, repeatable order.
- **FR-011**: When split by exact shares, the system MUST refuse the expense
  unless the shares add up to exactly the amount, and MUST tell the person how
  far over or under they are.
- **FR-012**: The system MUST refuse a share of zero or a negative share.
- **FR-013**: The shares of a recorded expense MUST add up to exactly its
  amount, with no exception and no tolerance.

**Reading**

- **FR-014**: A member MUST be able to see every expense recorded in a group
  they belong to, most recent first, each showing its description, amount,
  payer, and participants.
- **FR-015**: A member MUST be able to see the individual shares of an expense,
  including which participant carries which share.
- **FR-016**: The system MUST show a message in place of the list when a group
  has no expenses recorded yet.
- **FR-017**: The system MUST show a person only the expenses of groups they
  belong to.

**Correcting and removing**

- **FR-018**: A member with permission MUST be able to change a recorded
  expense's description, amount, payer, participants, and shares.
- **FR-019**: Every rule that governs recording an expense MUST govern changing
  one, so that a change can never leave an expense in a state the system would
  have refused to record.
- **FR-020**: A change that would be refused MUST leave the expense exactly as
  it was.
- **FR-021**: The system MUST make plain to every member of the group that an
  expense has been corrected, and when it was last corrected. It is not required
  to keep what the expense said before the correction.
- **FR-022**: A member with permission MUST be able to remove an expense, and
  MUST be asked to confirm before it is removed.
- **FR-023**: Declining that confirmation MUST leave the expense in place and
  unchanged.
- **FR-024**: A removed expense MUST stop appearing for every member of the
  group.

**Who may do what**

- **FR-025**: The system MUST refuse every action in this feature — seeing,
  recording, changing, removing — to anybody who is not a member of the group
  the expense belongs to.
- **FR-026**: A refusal MUST NOT reveal whether the group or the expense exists.
  Somebody who is not a member MUST be unable to tell "there is no such expense"
  from "you are not in that group".
- **FR-027**: Any member of the group MUST be able to change or remove any
  expense in it, whether or not they recorded it and whether or not they paid.
  The same rule applies to changing and to removing.
- **FR-028**: An expense MUST go on naming its payer and its participants after
  those members leave the group, and the system MUST NOT refuse a departure, or
  alter or remove an expense, because somebody named in it has left.
- **FR-029**: The system MUST show a person who is named in an expense but is no
  longer a member of the group in a way that makes their departure plain, so
  that no member mistakes them for somebody they can still involve in a new
  expense.
- **FR-030**: A member who has left the group MUST NOT be selectable as the
  payer or a participant of a new expense, or of a change to an existing one.

### Key Entities

- **Expense**: Money one member spent on behalf of some members of one group.
  Carries a description, an amount, the group it belongs to, its payer, who
  recorded it, when it was recorded, and whether and when it was corrected. An
  expense belongs to exactly one group and cannot be moved to another.
- **Share**: The part of one expense that one participant is responsible for. An
  expense has one share per participant, and the shares of an expense always add
  up to exactly its amount.
- **Participant**: A member of the group the expense was spent on. Identified by
  the member, not copied — a participant is always somebody the group knows.
- **Payer**: The member whose money left their pocket. Exactly one per expense.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of recorded expenses, the shares add up to exactly the
  amount — no expense exists in which a cent has been gained or lost.
- **SC-002**: A member can record a shared cost, from opening the group to
  seeing the expense listed, in under 60 seconds and without leaving the group.
- **SC-003**: Recording the same equal-split expense twice produces identical
  shares both times, including which participants receive the leftover cents.
- **SC-004**: 100% of attempts to record or change an expense involving somebody
  outside the group are refused, and none of them change what is recorded.
- **SC-005**: Every member of a group sees the same figures for the same
  expense — there is no state in which two members disagree about what was
  recorded.
- **SC-006**: A member who was not the one who recorded an expense can tell,
  without asking anybody, that the expense has been corrected since it was
  recorded.
- **SC-007**: A person who is not a member of a group cannot distinguish a
  refusal caused by an expense not existing from one caused by their not
  belonging to the group.

## Decisions

Three questions could not be answered from the description or from what the
product already does. All three were put to the author and answered before
planning; none was resolved by picking a default.

- **Any member of the group may change or remove any expense in it**, whether or
  not they recorded it and whether or not they paid. This follows the trust
  model the groups feature already sets, where any member can add members and
  rename the group, and it means no correction waits on one particular person
  being available. The weight this puts on FR-021 is deliberate: what protects
  the group is that a change is visible as a change, not that few people can
  make one.
- **An expense goes on naming a member who has left.** The money really was
  spent by that person, and rewriting the record because they left would make
  the group's history disagree with what happened. Leaving therefore stays the
  immediate, unconfirmed action the groups feature promises, and departed people
  are shown as such rather than hidden.
- **A correction records that it happened and when, and no more.** The previous
  values are not kept. This satisfies the product's requirement that history is
  never rewritten silently at the lowest cost; keeping every previous version
  would be a feature of its own, and is deliberately not this one.

## Open Questions

None outstanding.

## Assumptions

Reasonable defaults taken where the description was silent. Each is a choice,
not a reading, and any of them can be overturned cheaply before implementation.

- **Balances are not part of this work.** No amount owed, running total, or net
  position is calculated, stored, or shown anywhere in this feature. An expense
  records what happened; what it implies about who owes whom is a later feature.
  This follows the project's requirement that Expenses and Balances stay
  independent.
- **Settlements are not part of this work.** Money handed from one member to
  another to square up is a settlement, not an expense, and is out of scope.
- **Only two split modes.** Equally and by exact share, as described. Splitting
  by percentage, by share count, or by itemised receipt is out of scope.
- **One currency.** Every amount in a group is in the same currency, and no
  conversion happens. Multi-currency groups are out of scope.
- **An expense is dated by when it was recorded.** Backdating an expense to the
  day the money was actually spent is out of scope.
- **No attachments.** Photographs of receipts, notes, and categories are out of
  scope.
- **Existing accounts and groups are reused as they are.** Membership is what
  the groups feature already means by it, and no new kind of person or
  permission is introduced beyond the one settled by the open question above.
- **The group is where expenses live.** Expenses cannot be recorded outside a
  group, and cannot be moved between groups.
- **Deleting a group takes its expenses with it.** A group is the only place its
  expenses can be seen, so nothing is left behind that anybody could reach.
- **Leftover cents go to the earliest participants** in whatever order the group
  already lists its members. The rule matters less than its being fixed and
  repeatable.
