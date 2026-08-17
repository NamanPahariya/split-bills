## User story

As a person who wants to use Splitsy, I create my own account with an email
address, a password, and a display name, and I sign in and out of it, so that
the groups and expenses I take part in belong to me and to nobody else.

## Acceptance criteria

AC-1: Given a person who does not yet have an account, when they provide an
email address that is not already tied to an account, a password, and a
display name, then an account is created for them and they are signed in.

AC-2: Given a person creating an account, when the email address they provide
is already tied to an existing account — treating two addresses that differ
only in capitalisation as the same address — then account creation is refused
and they are told that email is already in use.

AC-3: Given a person creating an account, when the password they choose has
fewer than 8 characters, then account creation is refused and they are told
the password is too short.

AC-4: Given a person with an existing account, when they sign in with the
correct password and their email address in any capitalisation, then they are
signed in and taken to their groups.

AC-5: Given a person attempting to sign in, when the email and password they
provide do not match any account, then they are told their email or password
is incorrect, and this message is worded identically whether the email
belongs to no account at all or to an account with a different password.

AC-6: Given a person who is signed in, when they choose to sign out, then
they are signed out and must sign in again before doing anything that needs
an account.

AC-7: Given a person who is signed in, when time passes without them
choosing to sign out, then they remain signed in — nothing signs them out
automatically.

AC-8: Given two people who do not yet have accounts, when both of them
choose the same display name, then both accounts are created successfully,
each keeping the display name they chose.

AC-9: Given a person who is signed in, when they change their display name
to something else, then their account shows the new display name from then
on.

AC-10: Given a person creating an account, when the email address they
provide is not shaped like an email address — it has no @, or nothing before
or after the @, or it contains a space — then account creation is refused and
they are told the email address is not valid.

AC-11: Given a person creating an account or changing their display name,
when the display name they provide is empty or is nothing but spaces, then
the account is not created and the display name is not changed, and they are
told a display name is required.

## Out of scope

- Signing in with anything other than an email address and a password (for
  example a phone number, or an account from anywhere else).
- More than one person sharing a single account.
- Anyone having different abilities from anyone else on their own account.
- Confirming a person's email address before they can use their account.
- Recovering or resetting a forgotten password.
- Changing the email address tied to an existing account.
- Anything about what a person owes or is owed — this feature is only about
  who a person is, not about their expenses or balances.

## Open questions

None outstanding.

## Done means

A person can create an account with an email, a password, and a display
name; sign in with it and stay signed in until they explicitly sign out;
sign out; and change their display name afterward — matching every
acceptance criterion above.
