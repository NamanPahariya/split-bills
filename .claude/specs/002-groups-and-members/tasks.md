## Tasks

- [x] T01 [P] — Add Group and GroupMember models plus migration — files: prisma/schema.prisma, prisma/migrations/ — proves: —
- [ ] T02 [P] — Clear the two new tables before each test — files: vitest.setup.ts — proves: —
- [ ] T03 — Add findAccountByEmail with tests for capitalisation, unknown addresses, and malformed ones — files: src/lib/accounts.ts, src/lib/accounts.test.ts — proves: AC-5, AC-7, AC-8
- [ ] T04 — Add createGroup with tests for success, a blank name, and duplicate names — files: src/lib/groups.ts, src/lib/groups.test.ts — proves: AC-1, AC-2, AC-3
- [ ] T05 — Add listGroupsForAccount with tests for the empty case and for seeing only your own groups — files: src/lib/groups.ts, src/lib/groups.test.ts — proves: AC-3, AC-10, AC-12
- [ ] T06 — Add the membership guard and getGroupForAccount with tests for a one-member group and for refusing outsiders — files: src/lib/groups.ts, src/lib/groups.test.ts — proves: AC-11, AC-12, AC-20
- [ ] T07 — Add addMember with tests for capitalisation, duplicates, unknown and malformed addresses, and re-adding — files: src/lib/groups.ts, src/lib/groups.test.ts — proves: AC-4, AC-5, AC-6, AC-7, AC-8, AC-14, AC-20
- [ ] T08 — Add renameGroup with tests for any member renaming and for a blank name — files: src/lib/groups.ts, src/lib/groups.test.ts — proves: AC-2, AC-9, AC-20
- [ ] T09 — Add leaveGroup with tests for leaving, re-adding, and the group going when the last member leaves — files: src/lib/groups.ts, src/lib/groups.test.ts — proves: AC-13, AC-14, AC-15, AC-20
- [ ] T10 — Add deleteGroup with tests for the creator, for anyone else, and for the creator having left — files: src/lib/groups.ts, src/lib/groups.test.ts — proves: AC-16, AC-18, AC-20
- [ ] T11 — Assert the module offers no way to take another person out of a group — files: src/lib/groups.test.ts — proves: AC-19
- [ ] T12 — Add the groups screen with the empty-state message and a create form — files: src/app/groups/page.tsx, src/app/groups/actions.ts, src/components/CreateGroupForm.tsx — proves: AC-1, AC-2, AC-3, AC-10, AC-12
- [ ] T13 — Add the single-group screen showing its name and members — files: src/app/groups/[groupId]/page.tsx — proves: AC-11, AC-19, AC-20
- [ ] T14 — Add the add-member form — files: src/app/groups/[groupId]/actions.ts, src/components/AddMemberForm.tsx — proves: AC-4, AC-5, AC-6, AC-7, AC-8, AC-14
- [ ] T15 — Add renaming to the group screen — files: src/app/groups/[groupId]/actions.ts, src/components/GroupNameForm.tsx — proves: AC-9
- [ ] T16 — Add leaving a group — files: src/app/groups/[groupId]/actions.ts, src/app/groups/[groupId]/page.tsx — proves: AC-13, AC-15
- [ ] T17 — Add deleting a group, shown only to its creator and asking to confirm — files: src/app/groups/[groupId]/actions.ts, src/components/DeleteGroupButton.tsx — proves: AC-16, AC-17, AC-18
- [ ] T18 — Guard /groups in middleware — files: src/middleware.ts — proves: AC-20

## Coverage

| AC    | Tasks                             |
| ----- | --------------------------------- |
| AC-1  | T04, T12                          |
| AC-2  | T04, T08, T12                     |
| AC-3  | T04, T05, T12                     |
| AC-4  | T07, T14                          |
| AC-5  | T03, T07, T14                     |
| AC-6  | T07, T14                          |
| AC-7  | T03, T07, T14                     |
| AC-8  | T03, T07, T14                     |
| AC-9  | T08, T15                          |
| AC-10 | T05, T12                          |
| AC-11 | T06, T13                          |
| AC-12 | T05, T06, T12                     |
| AC-13 | T09, T16                          |
| AC-14 | T07, T09, T14                     |
| AC-15 | T09, T16                          |
| AC-16 | T10, T17                          |
| AC-17 | T17                               |
| AC-18 | T10, T17                          |
| AC-19 | T11, T13                          |
| AC-20 | T06, T07, T08, T09, T10, T18      |
