## Approach

A group is a `Group` row plus one `GroupMember` row per person in it. The
business rules — creating, renaming, adding a member, leaving, deleting,
and the two read paths — live in `src/lib/groups.ts` and return `Result`
values instead of throwing, per CLAUDE.md. Membership rows are deleted
outright when somebody leaves rather than marked with a `leftAt` date, so
"a row exists" and "is a member" mean the same thing everywhere; AC-14,
re-adding somebody who left, then needs no code at all.

Adding a member by email has to treat capitalisation exactly the way
signing in already does (AC-5), so `src/lib/accounts.ts` gains a single
exported `findAccountByEmail` and keeps `canonicalEmail` and
`isEmailShaped` private. Copying those two helpers into `groups.ts` would
let the two ideas of "the same address" drift apart, and the drift would
be silently an AC-5 failure.

Screens under `src/app/groups` follow the shape 001 established: a server
component calls `requireAccount()`, hands a server action to a
presentational form, and the action translates the lib's error code into
human wording. Nothing new is added to the layout CLAUDE.md defines, and
no dependency is added.

The spec is silent on one reachable state — the creator leaving a group
that still has members. Agreed with the author before planning: the
creator may leave like anybody else, `createdById` goes on naming them,
and the group is therefore left with nobody able to delete it. Every
remaining member can still leave, and the group disappears under AC-15
when the last one does.

## Data model

```prisma
model Group {
  id          String        @id @default(cuid())
  name        String
  createdById String
  createdBy   Account       @relation(fields: [createdById], references: [id], onDelete: Cascade)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  members     GroupMember[]
}

model GroupMember {
  id        String   @id @default(cuid())
  groupId   String
  accountId String
  group     Group    @relation(fields: [groupId], references: [id], onDelete: Cascade)
  account   Account  @relation(fields: [accountId], references: [id], onDelete: Cascade)
  joinedAt  DateTime @default(now())

  @@unique([groupId, accountId])
  @@index([accountId])
}
```

`Account` gains `groupsCreated Group[]` and `groupMemberships GroupMember[]`.

`@@unique([groupId, accountId])` is what actually makes AC-6 true: the
friendly "already a member" message comes from a check in `addMember`, but
a double-submitted form would slip past a check and not past an index.

`@@index([accountId])` exists because the composite index above starts
with `groupId` and so cannot serve the "which groups am I in?" query.

`createdById` points at `Account` rather than at a membership row
precisely so it can go on naming somebody who has left, which is the
state the decision above produces.

`Group.name` has no unique constraint of any kind — AC-3 requires two
groups with the same name to both exist.

## Domain functions

```ts
// src/lib/accounts.ts — one addition
type FindAccountByEmailError = "EMAIL_INVALID" | "ACCOUNT_NOT_FOUND"
function findAccountByEmail(email: string): Promise<Result<AccountRecord, FindAccountByEmailError>>

// src/lib/groups.ts
type GroupRecord = { id: string; name: string; createdById: string }
type MemberRecord = { accountId: string; email: string; displayName: string }
type GroupWithMembersRecord = GroupRecord & { members: MemberRecord[] }

type CreateGroupError = "NAME_REQUIRED"
function createGroup(input: { accountId: string; name: string }): Promise<Result<GroupRecord, CreateGroupError>>

type RenameGroupError = "GROUP_NOT_FOUND" | "NAME_REQUIRED"
function renameGroup(input: { accountId: string; groupId: string; name: string }): Promise<Result<GroupRecord, RenameGroupError>>

type AddMemberError = "GROUP_NOT_FOUND" | "EMAIL_INVALID" | "ACCOUNT_NOT_FOUND" | "ALREADY_A_MEMBER"
function addMember(input: { accountId: string; groupId: string; email: string }): Promise<Result<MemberRecord, AddMemberError>>

type LeaveGroupError = "GROUP_NOT_FOUND"
function leaveGroup(input: { accountId: string; groupId: string }): Promise<Result<{ groupRemoved: boolean }, LeaveGroupError>>

type DeleteGroupError = "GROUP_NOT_FOUND" | "NOT_THE_CREATOR"
function deleteGroup(input: { accountId: string; groupId: string }): Promise<Result<null, DeleteGroupError>>

function listGroupsForAccount(accountId: string): Promise<GroupRecord[]>

type GetGroupError = "GROUP_NOT_FOUND"
function getGroupForAccount(input: { accountId: string; groupId: string }): Promise<Result<GroupWithMembersRecord, GetGroupError>>
```

Every function takes a named object rather than positional arguments, unlike
`changeDisplayName(accountId, displayName)`. Two arguments of type `string`
that mean different identities make a swapped pair a silent authorisation
bug that the type checker cannot see.

`listGroupsForAccount` returns an array rather than a `Result`: belonging to
no groups is an ordinary answer, not a failure, and AC-10's message is the
screen's decision. It orders newest first with the id as a tiebreak, because
AC-3 guarantees identically-named groups can sit next to each other and an
unstable order between renders would be indistinguishable from a bug.

`leaveGroup` reports `groupRemoved` so the screen can tell "you left Goa
Trip" from "Goa Trip was removed" without asking again — after AC-15 the
group is gone, and a second look could not tell that apart from AC-20.

There is deliberately no `removeMember` and no `confirmed` flag on
`deleteGroup`. AC-19 is satisfied by the capability not existing, and AC-16's
confirmation is a state of the screen, not a business rule.

### Refusing without leaking

One private helper runs first in every function, the two readers included:

```ts
async function memberGroup(groupId: string, accountId: string) {
  return prisma.group.findFirst({
    where: { id: groupId, members: { some: { accountId } } },
    select: { id: true, name: true, createdById: true },
  });
}
```

A person who is not in a group must not be able to tell it apart from a
group that does not exist, so the failure is called `GROUP_NOT_FOUND` and
never `NOT_A_MEMBER` — a code named for membership gives the answer away the
moment it reaches a message map. One query carries both conditions rather
than a lookup followed by a membership check, and the guard runs before any
name or email validation, so nobody can probe the input rules of a group they
cannot see and AC-20's "the group is unchanged" holds.

`NOT_THE_CREATOR` is safe to report: only members reach it, and members can
already see who created the group.

### Doing one thing at a time

`leaveGroup` deletes the membership and then deletes the group only if no
members are left, both inside one transaction and with no read in between:

```ts
await tx.groupMember.deleteMany({ where: { groupId, accountId } });
const removed = await tx.group.deleteMany({
  where: { id: groupId, members: { none: {} } },
});
```

Counting the remaining members and then deciding would let two people
leaving at once each see somebody still there, stranding a group that
nobody can see, reach, or delete — a permanent AC-15 failure.

`addMember` keeps its already-a-member check and its write in one
transaction and turns a unique-constraint violation into
`ALREADY_A_MEMBER` rather than letting it throw, since AC-6 has a designed
message for exactly that. `createGroup` writes the group and the creator's
membership as one nested write, so a group with no members is unreachable
from the moment it exists. Deletes use `deleteMany` throughout so a
double-submitted form is harmless, the same reasoning already written on
`destroySession`.

## Routes and server actions

| Route | Purpose |
| --- | --- |
| `GET /groups` | The groups this person is in, newest first, with a message when there are none and a form to create one |
| `GET /groups/[groupId]` | One group: its name, its members, a form to add one, renaming, leaving, and deleting for the creator |

```ts
// src/app/groups/actions.ts
function createGroupAction(previous, formData): Promise<{ error?: string }>
// calls createGroup, revalidates /groups

// src/app/groups/[groupId]/actions.ts
function addMemberAction(previous, formData): Promise<{ error?: string; added?: string }>
// calls addMember, revalidates the group

function renameGroupAction(previous, formData): Promise<{ error?: string; saved?: boolean }>
// calls renameGroup, revalidates the group

function leaveGroupAction(formData): Promise<void>
// calls leaveGroup, redirects to /groups

function deleteGroupAction(formData): Promise<void>
// calls deleteGroup, redirects to /groups
```

Every action calls `requireAccount()` itself and never takes an account id
from the form, the rule `updateDisplayNameAction` already follows. The group
id comes from the route, and the membership guard is what makes trusting it
safe.

`src/middleware.ts` extends its matcher to `["/account/:path*", "/groups/:path*"]`.
It still checks only that a session cookie is present; `requireAccount()`
inside each page remains the real gate.

## UI

- `CreateGroupForm` — one name field; submits to `createGroupAction`.
- `AddMemberForm` — one email field; submits to `addMemberAction`; shows
  the one error string the action returns.
- `GroupNameForm` — the group's name, pre-filled and deliberately not
  marked required so that the blank case is proved by the server, exactly
  as `DisplayNameForm` does.
- `DeleteGroupButton` — the one new interaction in this feature. AC-16
  needs a confirmation and AC-17 needs declining it to change nothing, so
  the button swaps itself for "Delete this group?" with confirm and cancel;
  cancel puts the button back and calls nothing.
- `/groups` page — the list, or the "no groups yet" message, plus
  `CreateGroupForm`.
- `/groups/[groupId]` page — `GroupNameForm`, the member list,
  `AddMemberForm`, a leave button, and `DeleteGroupButton` only when the
  signed-in person created the group.

All of them are presentational: they take the server action they need as a
prop and reach no data of their own. Leaving is a plain form with no
confirmation, because AC-13 says it happens immediately.

## Files

| File | Status | Purpose |
| --- | --- | --- |
| `prisma/schema.prisma` | EDIT | Add `Group` and `GroupMember` |
| `prisma/migrations/<timestamp>_add_group_and_group_member/migration.sql` | NEW | The checked-in migration |
| `vitest.setup.ts` | EDIT | Clear the two new tables before each test |
| `src/lib/accounts.ts` | EDIT | `findAccountByEmail` |
| `src/lib/accounts.test.ts` | EDIT | Tests for the above |
| `src/lib/groups.ts` | NEW | All eight group functions |
| `src/lib/groups.test.ts` | NEW | Tests for the above |
| `src/app/groups/page.tsx` | NEW | The list of groups |
| `src/app/groups/actions.ts` | NEW | `createGroupAction` |
| `src/app/groups/[groupId]/page.tsx` | NEW | One group |
| `src/app/groups/[groupId]/actions.ts` | NEW | Add, rename, leave, delete |
| `src/components/CreateGroupForm.tsx` | NEW | Create form |
| `src/components/AddMemberForm.tsx` | NEW | Add-member form |
| `src/components/GroupNameForm.tsx` | NEW | Rename form |
| `src/components/DeleteGroupButton.tsx` | NEW | Delete with confirmation |
| `src/middleware.ts` | EDIT | Guard `/groups` as well as `/account` |

## Test plan

| AC | Test |
| --- | --- |
| AC-1 | `groups.test.ts`: `createGroup` returns the group, the creator is its only member, and it appears in their list |
| AC-2 | `groups.test.ts`: `createGroup` and `renameGroup` return `NAME_REQUIRED` for an empty name and for one that is only spaces, and nothing is written |
| AC-3 | `groups.test.ts`: two groups created with the same name both exist and both appear in the list |
| AC-4 | `groups.test.ts`: `addMember` adds by exact email and the group appears in that person's list; a member who did not create the group can add |
| AC-5 | `groups.test.ts`: `addMember` with `Grace@Example.COM` adds the account stored as `grace@example.com`; `accounts.test.ts`: `findAccountByEmail` ignores capitalisation |
| AC-6 | `groups.test.ts`: adding an existing member returns `ALREADY_A_MEMBER`, and the group still lists that person exactly once |
| AC-7 | `groups.test.ts`: a shaped but unused address returns `ACCOUNT_NOT_FOUND` and adds nobody |
| AC-7 (wording) | Cannot be automated in this stack (no component-rendering test tool is installed). The action has one message for that code; verified by inspection and by the manual walkthrough |
| AC-8 | `groups.test.ts`: the four malformed shapes from `accounts.test.ts` each return `EMAIL_INVALID` |
| AC-9 | `groups.test.ts`: `renameGroup` stores the new name, a member who did not create the group can do it, and a second member sees the new name |
| AC-10 | `groups.test.ts`: `listGroupsForAccount` returns an empty array for somebody in no groups rather than failing |
| AC-11 | `groups.test.ts`: `getGroupForAccount` returns a freshly created group with exactly one member and no error |
| AC-12 | `groups.test.ts`: the list contains every group the person is in and none they are not |
| AC-13 | `groups.test.ts`: after `leaveGroup` the group is gone from their list and `getGroupForAccount` refuses them, while every remaining member still sees it |
| AC-14 | `groups.test.ts`: add, leave, then add again succeeds and the group returns to their list |
| AC-15 | `groups.test.ts`: the only member leaving returns `groupRemoved: true`, the group count is zero, and no membership rows are left behind |
| AC-16 | `groups.test.ts`: the creator's `deleteGroup` removes the group from every member's list and takes the membership rows with it |
| AC-17 | Cannot be automated in this stack (no component-rendering test tool is installed). Declining means no action runs; `DeleteGroupButton` has no other path to `deleteGroupAction`. Verified by inspection and by the manual walkthrough |
| AC-18 | `groups.test.ts`: a member who did not create the group gets `NOT_THE_CREATOR`, the group is unchanged for everybody, and that person can still leave |
| AC-19 | `groups.test.ts`: the module's exported names are exactly the seven functions, so adding `removeMember` fails the test |
| AC-20 | `groups.test.ts`: every function refuses a non-member with `GROUP_NOT_FOUND` and changes nothing; a group id that never existed gives the identical answer |
| The creator-leaves decision | `groups.test.ts`: the creator leaves a group with members left, and a remaining member's `deleteGroup` then returns `NOT_THE_CREATOR` |

## Risks

- **No new dependency is proposed.** Nothing here needs one.
- **SQLite enforces foreign keys only when the connection asks it to.** If
  the adapter does not, deleting a group would leave membership rows behind
  and deleted groups would come back in people's lists — an AC-16 failure
  that testing the return value alone would not catch. The AC-16 test
  therefore asserts the membership rows are gone, not just the group.
- **`deleteMany` with a `members: { none: {} }` condition needs
  confirming** on this adapter. If it is not supported, `leaveGroup` falls
  back to counting and deleting inside the same transaction, which closes
  the same gap by serialising instead.
- **`Group` is a reserved word in SQL.** Prisma quotes identifiers, so this
  should be fine, but the generated migration is worth reading rather than
  assuming.
- **A group can end up with nobody able to delete it** once its creator
  leaves. This follows from the decision recorded above, not from an
  oversight; the screen offers those members leaving instead, and the group
  disappears when the last of them goes.
- **The two ACs about wording and confirmation (AC-7's message, AC-17's
  decline) cannot be tested here**, because only `src/**/*.test.ts` runs and
  no component-rendering tool is installed. Both are covered by the manual
  walkthrough instead.
