## User story

As a person with a Splitsy account, I want to create a named group and add
other people to it by their exact email address, see the groups I belong to,
and leave or delete a group, so that the expenses I share with a particular
set of people have somewhere of their own to live.

## Acceptance criteria

AC-1: Given a person who is signed in, when they create a group and give it a
name, then the group exists with that name, they are a member of it, and it
appears in their list of groups.

AC-2: Given a person creating a group, when the name they provide is empty or
is nothing but spaces, then the group is not created and they are told a name
is required.

AC-3: Given a person who has already created a group with a particular name,
when they create a second group with exactly that same name, then both groups
are created and both appear in their list of groups, each keeping that name.

AC-4: Given a person who is a member of a group, whether or not they are the
person who created it, when they add someone by typing the exact email
address tied to that person's existing account, then that person becomes a
member of the group and the group appears in that person's list of groups.

AC-5: Given a person adding a member by email address, when the address they
type differs from the address on the other person's account only in
capitalisation, then that person is still added, exactly as if the
capitalisation had matched.

AC-6: Given a group that already has a particular person as a member, when
someone types that person's email address to add them again, then nobody new
is added, the group still lists that person exactly once, and the person
adding is told that person is already a member.

AC-7: Given a person adding a member, when the address they type is shaped
like an email address but no Splitsy account uses it, then nobody is added
and they are told "No Splitsy account uses that email address."

AC-8: Given a person adding a member, when the address they type is not
shaped like an email address — it has no @, or nothing before or after the @,
or it contains a space — then nobody is added and they are told the email
address is not valid.

AC-9: Given a person who is a member of a group, whether or not they are the
person who created it, when they change the group's name to something else,
then the group shows the new name from then on to every member.

AC-10: Given a person who is signed in and belongs to no groups at all, when
they look at their list of groups, then they are shown a message telling them
they have no groups yet and how to create one, rather than a blank space or
an error.

AC-11: Given a person who has just created a group and added nobody, when
they look at that group, then the group is shown normally with themselves as
its only member, and no error appears.

AC-12: Given a person who is signed in, when they look at their list of
groups, then they see every group they are a member of and no group they are
not a member of.

AC-13: Given a person who is a member of a group alongside other members,
when they choose to leave it, then they leave immediately without being asked
to confirm, the group no longer appears in their list of groups, they can no
longer see it, and the group still appears for every remaining member.

AC-14: Given a person who has left a group, when any remaining member adds
them again by their email address, then they become a member once more and
the group appears in their list of groups again.

AC-15: Given a group whose only remaining member is one person, when that
person leaves it, then the group ceases to exist and appears for nobody.

AC-16: Given a person who created a group, when they choose to delete it,
then they are asked to confirm first, and only once they confirm does the
group disappear from the list of groups of every one of its members.

AC-17: Given a person who created a group and has been asked to confirm
deleting it, when they decline the confirmation, then the group is unchanged
and still appears for every one of its members.

AC-18: Given a person who is a member of a group they did not create, when
they try to delete it, then they are refused, the group is unchanged for
everybody, and leaving the group remains available to them.

AC-19: Given a group with several members, when a member looks for a way to
take a different member out of the group, then no such way is offered — the
only departure any person can bring about is their own.

AC-20: Given a person who is not a member of a particular group, when they
try to see that group, add someone to it, rename it, leave it, or delete it,
then they are refused and the group is unchanged.

## Out of scope

- Anything involving amounts of money. No amount is recorded, shown, or added
  up by this feature, so questions of rounding, of zero amounts, and of
  negative amounts do not arise here and are settled by the expenses feature
  instead.
- What happens to expenses already recorded in a group when a member leaves
  or the group is deleted.
- Finding people by anything other than their exact email address — no
  searching by name, no suggestions, no partial matches, no contact list.
- Adding somebody who does not already have a Splitsy account, by invitation
  or by any other means.
- Taking another person out of a group, and any way of asking why somebody is
  no longer in one.
- Passing on to somebody else the standing of having created a group, or any
  other difference between members beyond deleting the group.
- Recovering a group that has been deleted, or undoing a departure from a
  group.
- Groups that contain other groups, or any grouping of people beyond a flat
  list of members.
- Any description, picture, or setting attached to a group other than its
  name.

## Open questions

None outstanding.

## Done means

- A signed-in person can create a group with a name, see it in their list
  straight away, rename it later, and create a second group with the same
  name without being stopped.
- Any member — not only the person who created the group — can add somebody
  else by typing the exact email address on that person's account, and the
  group then shows up in that person's list of groups too.
- A blank name, an address that is not shaped like an email address, an
  address no Splitsy account uses, and the address of somebody already in the
  group each produce a clear message and change nothing.
- A person with no groups sees a message saying so, and a person whose group
  has only themselves in it sees that group without any error.
- A person who leaves a group stops seeing it while everyone else still sees
  it, and the group vanishes altogether once its last member leaves.
- Only the person who created a group can delete it; they are asked to
  confirm first, and everybody else is offered leaving instead.
