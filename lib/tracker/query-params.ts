export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Returns the value if it is a valid YYYY-MM-DD, null if absent, undefined if malformed. */
export function dateParam(v: string | null): string | null | undefined {
  if (v === null || v === "") return null;
  return DATE_RE.test(v) ? v : undefined;
}

export function uuidParam(v: string | null): string | null | undefined {
  if (v === null || v === "") return null;
  return UUID_RE.test(v) ? v : undefined;
}
