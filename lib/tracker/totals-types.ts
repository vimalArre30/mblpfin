/**
 * Shapes returned by GET /api/tracker/totals (see lib/tracker/totals.ts).
 * Every number is computed in SQL (migration 008); the browser only displays them.
 */
export interface PeriodSummary {
  income: number;
  expense: number;
  transfers_in: number;
  transfers_out: number;
  /** Signed net of all transfer legs in scope. */
  transfers: number;
  expense_count: number;
  /** Every row in scope (includes opening-balance rows and both transfer legs). */
  entries: number;
  /** income - expense (what the dashboard tiles show). */
  net: number;
  /** income - expense + transfers (a wallet's net balance). */
  balance: number;
}

export interface WalletBalance {
  wallet_id: string;
  income: number;
  expense: number;
  transfers_in: number;
  transfers_out: number;
  balance: number;
  entries: number;
}

export interface CategoryTotal {
  /** null = uncategorised */
  category_id: string | null;
  name: string;
  total: number;
  entries: number;
}

export interface LabelTotal {
  name: string;
  total: number;
  entries: number;
}

export interface MonthlyTotal {
  /** First day of the month, YYYY-MM-DD */
  month: string;
  income: number;
  expense: number;
}

export type TotalsInclude = "wallets" | "by_category" | "labels" | "monthly";

export type TotalsResponse = PeriodSummary & {
  wallets?: WalletBalance[];
  by_category?: CategoryTotal[];
  labels?: LabelTotal[];
  monthly?: MonthlyTotal[];
};

export interface TotalsParams {
  /** YYYY-MM-DD; omit for unbounded */
  from?: string | null;
  to?: string | null;
  walletId?: string | null;
  include?: TotalsInclude[];
  /** by_category: entry types to include (default ["expense"]) */
  categoryTypes?: ("expense" | "income")[];
  /** by_category: keep only the top N (after sorting by total) */
  categoryTop?: number;
  /** monthly: "last6" (dashboard window in IST) or "period" (use from/to) */
  monthly?: "last6" | "period";
  excludeOpening?: boolean;
}
