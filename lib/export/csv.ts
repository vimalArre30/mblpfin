import { rowKind, type ExportRow } from "./rows";

const HEADER = [
  "Date",
  "Description",
  "Type",
  "Amount",
  "Wallet",
  "Category",
  "Labels",
  "Note",
  "Recurring",
  "Source",
];

function cell(v: string | number): string {
  let s = String(v);
  // Neutralise spreadsheet formula injection from user-typed text.
  if (typeof v === "string" && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Signed amount as shown in the app's export: expenses negative, income positive, transfers as stored. */
export function signedAmount(r: ExportRow): number {
  const kind = rowKind(r);
  const a = Number(r.amount);
  if (kind === "expense") return -Math.abs(a);
  if (kind === "income") return Math.abs(a);
  return a;
}

export function typeLabel(r: ExportRow): string {
  if (r.is_opening_balance) return "Opening balance";
  const k = rowKind(r);
  return k === "income" ? "Income" : k === "expense" ? "Expense" : "Transfer";
}

/** UTF-8 CSV with BOM (Excel), CRLF line endings, 10 columns. */
export function buildCsv(rows: ExportRow[]): string {
  const lines = [HEADER.join(",")];
  for (const r of rows) {
    const labels = (r.transaction_labels ?? [])
      .map((l) => l.labels?.name)
      .filter((n): n is string => !!n)
      .join("; ");
    lines.push(
      [
        r.date,
        r.description ?? "",
        typeLabel(r),
        signedAmount(r),
        r.wallet?.name ?? "",
        r.categories?.name ?? "",
        labels,
        r.note ?? "",
        r.recurring_id ? "Yes" : "",
        r.source ?? "app",
      ]
        .map(cell)
        .join(",")
    );
  }
  return "﻿" + lines.join("\r\n") + "\r\n";
}
