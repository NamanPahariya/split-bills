/**
 * Deliberately kept apart from session.ts, and deliberately importing nothing.
 * Middleware runs on the Edge runtime, so importing this name from session.ts
 * would drag the database client and node:crypto into a runtime that cannot
 * load either.
 */
export const SESSION_COOKIE = "splitsy_session";
