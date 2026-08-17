/**
 * The return type for anything in src/lib that can fail for a reason the
 * caller is expected to handle. Failures are values here, not exceptions, so
 * the type system forces every caller to deal with them.
 */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
