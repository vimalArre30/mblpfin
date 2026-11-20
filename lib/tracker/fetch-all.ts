/**
 * Fetch every row of a query, one page at a time.
 *
 * Supabase/PostgREST returns at most `max_rows` (default 1000) rows per
 * request and does NOT signal truncation, so an unpaged `select()` silently
 * returns only the first 1000 rows. This loops `.range()` until a short page
 * comes back.
 *
 * Requirements for the `build` callback:
 *  - apply a TOTAL, deterministic order (end with a unique column such as
 *    `id`), otherwise rows can be skipped or repeated across pages;
 *  - keep `pageSize` <= the project's `max_rows` (1000 by default), or a full
 *    page would look short and the loop would stop early.
 */
export const FETCH_PAGE_SIZE = 1000;

type PageResult<T> = PromiseLike<{
  data: T[] | null;
  error: { message: string } | null;
}>;

export async function fetchAllRows<T>(
  build: (from: number, to: number) => PageResult<T>,
  pageSize: number = FETCH_PAGE_SIZE
): Promise<{ data: T[]; error: { message: string } | null }> {
  const all: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await build(from, from + pageSize - 1);
    if (error) return { data: all, error };
    const rows = data ?? [];
    all.push(...rows);
    if (rows.length < pageSize) break;
  }
  return { data: all, error: null };
}
