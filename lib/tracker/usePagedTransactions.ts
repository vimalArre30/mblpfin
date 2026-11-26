"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Transaction } from "@/components/tracker/TransactionFeed";
import { useTrackerChanged } from "./changed";

export interface TxFilters {
  from?: string | null;
  to?: string | null;
  walletId?: string | null;
  categoryId?: string | null;
  entryType?: "income" | "expense" | "transfer" | null;
  opening?: "include" | "exclude" | "only";
  pageSize?: number;
}

function buildQuery(f: TxFilters, cursor: string | null): string {
  const q = new URLSearchParams();
  q.set("limit", String(f.pageSize ?? 50));
  if (cursor) q.set("cursor", cursor);
  if (f.from) q.set("from", f.from);
  if (f.to) q.set("to", f.to);
  if (f.walletId) q.set("wallet_id", f.walletId);
  if (f.categoryId) q.set("category_id", f.categoryId);
  if (f.entryType) q.set("entry_type", f.entryType);
  if (f.opening && f.opening !== "include") q.set("opening", f.opening);
  return q.toString();
}

/**
 * Keyset-paged transactions from GET /api/tracker/transactions.
 * Pass `null` to stay idle (e.g. until the period filter has reported).
 * Reloads from the first page whenever the filters change or reload() is called.
 */
export function usePagedTransactions(filters: TxFilters | null) {
  const [rows, setRows] = useState<Transaction[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(filters !== null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const reqId = useRef(0);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const key = filters === null ? "idle" : JSON.stringify(filters);

  useEffect(() => {
    const f = filtersRef.current;
    if (f === null) return;
    const id = ++reqId.current;
    setLoading(true);
    setError(null);
    fetch(`/api/tracker/transactions?${buildQuery(f, null)}`, { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error(`list failed (${res.status})`);
        return res.json();
      })
      .then((json) => {
        if (id !== reqId.current) return;
        setRows(json.rows ?? []);
        setNextCursor(json.next_cursor ?? null);
        setTotal(typeof json.total === "number" ? json.total : null);
      })
      .catch((e) => {
        if (id !== reqId.current) return;
        setError(e instanceof Error ? e.message : "list failed");
      })
      .finally(() => {
        if (id === reqId.current) setLoading(false);
      });
  }, [key, reloadKey]);

  const loadMore = useCallback(async () => {
    const f = filtersRef.current;
    if (f === null || !nextCursor || loadingMore || loading) return;
    const id = reqId.current;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/tracker/transactions?${buildQuery(f, nextCursor)}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`list failed (${res.status})`);
      const json = await res.json();
      if (id !== reqId.current) return; // filters changed meanwhile
      setRows((prev) => {
        const seen = new Set(prev.map((r) => r.id));
        return [...prev, ...(json.rows as Transaction[]).filter((r) => !seen.has(r.id))];
      });
      setNextCursor(json.next_cursor ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "list failed");
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor, loadingMore, loading]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);
  useTrackerChanged(reload);

  return {
    rows,
    total,
    hasMore: nextCursor !== null,
    // Idle (filters not known yet) counts as loading so pages show their skeleton.
    loading: loading || filters === null,
    loadingMore,
    error,
    loadMore,
    reload,
  };
}
