import ExcelJS from "exceljs";
import { signedAmount, typeLabel } from "./csv";
import type { ExportRow } from "./rows";
import { addCharts, type ChartSpec } from "./xlsx-charts";

/**
 * Excel statement: a Summary tab, one tab per wallet, and an All transactions tab.
 * Every total is a live formula over the transaction rows; each formula also
 * carries its result so the numbers show even before Excel recalculates.
 */

export interface XlsxWallet {
  id: string | null; // null = entries with no wallet
  name: string;
  /** Wallet balance at the end of the day before `from` (SQL, all entries). */
  broughtForward: number;
}

export interface XlsxInput {
  rows: ExportRow[];
  wallets: XlsxWallet[];
  from: string;
  to: string;
  userName: string;
  generatedOn: string; // YYYY-MM-DD
}

// ── look ────────────────────────────────────────────────────────────────
const NAVY = "1B2142";
const BAND = "F7F7F7";
const MUTED = "6B7280";
const GREEN = "2E7D5B";
const RED = "C0392B";
const FONT = "Arial";
const INR2 = '"₹"#,##0.00;[Red]-"₹"#,##0.00;"-"';
const INR2_S = '+"₹"#,##0.00;[Red]-"₹"#,##0.00;"-"';
const INR2_ON_NAVY = '"₹"#,##0.00;-"₹"#,##0.00;"-"';
const INR2_S_ON_NAVY = '+"₹"#,##0.00;-"₹"#,##0.00;"-"';
const WIDTHS = [22, 15, 30, 16, 16, 18, 16, 18, 11, 11, 11];
const SUMMARY = "Summary";
const ALL = "All transactions";

const argb = (hex: string) => ({ argb: `FF${hex}` });
const solid = (hex: string): ExcelJS.Fill => ({ type: "pattern", pattern: "solid", fgColor: argb(hex) });
const font = (o: Partial<ExcelJS.Font> = {}): Partial<ExcelJS.Font> => ({ name: FONT, size: 10, ...o });
const thinBottom: Partial<ExcelJS.Borders> = { bottom: { style: "thin", color: argb("D1D5DB") } };

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MON3 = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ── small helpers ───────────────────────────────────────────────────────
const round2 = (n: number) => Math.round(n * 100) / 100;
const utcDate = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};
const monthKey = (iso: string) => iso.slice(0, 7);
const keyDate = (key: string) => utcDate(`${key}-01`);
const pretty = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${String(d).padStart(2, "0")} ${MON3[m - 1]} ${y}`;
};
const EMOJI_RE = /[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}]/gu;
const clean = (v: string | null | undefined) => (v ?? "").replace(EMOJI_RE, "").replace(/\s+/g, " ").trim();
const quote = (sheet: string) => `'${sheet.replace(/'/g, "''")}'`;
const fx = (formula: string, result: number | string | Date) => ({ formula, result }) as ExcelJS.CellFormulaValue;

function monthsInRange(from: string, to: string): string[] {
  const out: string[] = [];
  let y = Number(from.slice(0, 4));
  let m = Number(from.slice(5, 7));
  const end = to.slice(0, 7);
  for (;;) {
    const k = `${y}-${String(m).padStart(2, "0")}`;
    if (k > end) break;
    out.push(k);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
}

/** Excel sheet names: ≤31 chars, none of []:*?/\, unique (case-insensitive). */
function sheetNamer() {
  const used = new Set([SUMMARY.toLowerCase(), ALL.toLowerCase()]);
  return (raw: string) => {
    let base = clean(raw).replace(/[[\]:*?/\\]/g, " ").replace(/^'+|'+$/g, "").replace(/\s+/g, " ").trim();
    if (!base) base = "Wallet";
    base = base.slice(0, 31).trim();
    let name = base;
    for (let i = 2; used.has(name.toLowerCase()); i++) {
      const suffix = ` (${i})`;
      name = base.slice(0, 31 - suffix.length).trim() + suffix;
    }
    used.add(name.toLowerCase());
    return name;
  };
}

// Plain-JS version of a row, used both for writing cells and computing cached results.
interface Line {
  date: string;
  month: string; // YYYY-MM
  description: string;
  type: string; // Income | Expense | Transfer | Opening balance
  amount: number; // signed
  walletKey: string; // wallet id or "none"
  wallet: string;
  category: string; // "" = uncategorised
  labels: string;
  note: string;
  recurring: string;
  source: string;
}

function toLine(r: ExportRow): Line {
  return {
    date: r.date,
    month: monthKey(r.date),
    description: r.description ?? "",
    type: typeLabel(r),
    amount: round2(signedAmount(r)),
    walletKey: r.wallet_id ?? "none",
    wallet: r.wallet?.name ?? "",
    category: r.categories?.name ?? "",
    labels: (r.transaction_labels ?? [])
      .map((l) => l.labels?.name)
      .filter((n): n is string => !!n)
      .join("; "),
    note: r.note ?? "",
    recurring: r.recurring_id ? "Yes" : "",
    source: r.source ?? "app",
  };
}

const sum = (ls: Line[], f: (l: Line) => boolean) => round2(ls.filter(f).reduce((a, l) => a + l.amount, 0));

interface Agg {
  opening: number; // opening-balance entries in range
  income: number; // excl. opening
  expense: number; // positive
  transfers: number; // signed
  tIn: number;
  tOut: number; // positive
}
function agg(ls: Line[]): Agg {
  return {
    opening: sum(ls, (l) => l.type === "Opening balance"),
    income: sum(ls, (l) => l.type === "Income"),
    expense: -sum(ls, (l) => l.type === "Expense"),
    transfers: sum(ls, (l) => l.type === "Transfer"),
    tIn: sum(ls, (l) => l.type === "Transfer" && l.amount > 0),
    tOut: -sum(ls, (l) => l.type === "Transfer" && l.amount < 0),
  };
}

function categoryTotals(ls: Line[]) {
  const m = new Map<string, { total: number; entries: number }>();
  for (const l of ls) {
    if (l.type !== "Expense") continue;
    const e = m.get(l.category) ?? { total: 0, entries: 0 };
    e.total = round2(e.total - l.amount);
    e.entries += 1;
    m.set(l.category, e);
  }
  return [...m.entries()]
    .map(([category, v]) => ({ category, ...v }))
    .sort((a, b) => b.total - a.total || a.category.localeCompare(b.category));
}

// ── cell writers ────────────────────────────────────────────────────────
function setupSheet(ws: ExcelJS.Worksheet, landscape = true) {
  WIDTHS.forEach((w, i) => (ws.getColumn(i + 1).width = w));
  ws.pageSetup = { orientation: landscape ? "landscape" : "portrait", fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
}

function header(ws: ExcelJS.Worksheet, title: string, sub: string, meta: [string, string][]) {
  ws.views = [{ showGridLines: false }];
  const t = ws.getCell("A1");
  t.value = title;
  t.font = font({ size: 20, bold: true, color: argb(NAVY) });
  const s = ws.getCell("A2");
  s.value = sub;
  s.font = font({ color: argb(MUTED) });
  meta.forEach(([k, v], i) => {
    const a = ws.getCell(4 + i, 1);
    a.value = k;
    a.font = font({ bold: true, color: argb(MUTED) });
    const b = ws.getCell(4 + i, 2);
    b.value = v;
    b.font = font();
  });
}

function section(ws: ExcelJS.Worksheet, row: number, text: string) {
  const c = ws.getCell(row, 1);
  c.value = text;
  c.font = font({ size: 12, bold: true, color: argb(NAVY) });
}

function note(ws: ExcelJS.Worksheet, row: number, text: string) {
  const c = ws.getCell(row, 1);
  c.value = text;
  c.font = font({ size: 8, italic: true, color: argb(MUTED) });
}

function tableHead(ws: ExcelJS.Worksheet, row: number, labels: string[]) {
  labels.forEach((h, i) => {
    const c = ws.getCell(row, i + 1);
    c.value = h;
    c.font = font({ size: 9, bold: true, color: argb("FFFFFF") });
    c.fill = solid(NAVY);
    c.alignment = { horizontal: i === 0 ? "left" : "right", vertical: "middle" };
  });
}

function styleRow(ws: ExcelJS.Worksheet, row: number, cols: number, opts: { band?: boolean; total?: boolean }) {
  for (let c = 1; c <= cols; c++) {
    const cell = ws.getCell(row, c);
    cell.font = font(opts.total ? { bold: true, color: argb("FFFFFF") } : {});
    cell.alignment = { horizontal: c === 1 ? "left" : "right" };
    if (opts.total) cell.fill = solid(NAVY);
    else if (opts.band) cell.fill = solid(BAND);
  }
}

function tiles(ws: ExcelJS.Worksheet, row: number, items: [string, ExcelJS.CellValue, string][]) {
  items.forEach(([label, value, fmt], i) => {
    const a = ws.getCell(row, i + 1);
    a.value = label;
    a.font = font({ size: 8, bold: true, color: argb(MUTED) });
    a.fill = solid(BAND);
    const b = ws.getCell(row + 1, i + 1);
    b.value = value;
    b.numFmt = fmt;
    b.font = font({ size: 13, bold: true });
    b.fill = solid(BAND);
    b.alignment = { horizontal: "left" };
  });
}

/** Transaction rows starting at `firstRow`; returns the last row used (≥ firstRow). */
function writeLines(ws: ExcelJS.Worksheet, firstRow: number, lines: Line[], withWallet: boolean) {
  lines.forEach((l, k) => {
    const r = firstRow + k;
    const vals: ExcelJS.CellValue[] = [
      utcDate(l.date),
      fx(`DATE(YEAR(A${r}),MONTH(A${r}),1)`, keyDate(l.month)),
      l.description,
      l.type,
      l.amount,
      ...(withWallet ? [l.wallet] : []),
      l.category,
      l.labels,
      l.note,
      l.recurring,
      l.source,
    ];
    const amountCol = 5;
    vals.forEach((v, i) => {
      const c = ws.getCell(r, i + 1);
      c.value = v;
      c.font = font();
      c.border = thinBottom;
      c.alignment = { horizontal: i + 1 === amountCol ? "right" : "left" };
      if (k % 2 === 0) c.fill = solid(BAND);
    });
    ws.getCell(r, 1).numFmt = "dd mmm yyyy";
    ws.getCell(r, 2).numFmt = "mmm yyyy";
    ws.getCell(r, amountCol).numFmt = INR2_S;
  });
  return firstRow + Math.max(lines.length, 1) - 1;
}

function linesHead(ws: ExcelJS.Worksheet, row: number, withWallet: boolean) {
  const heads = ["Date", "Month", "Description", "Type", "Amount (₹)", ...(withWallet ? ["Wallet"] : []), "Category", "Labels", "Note", "Recurring", "Source"];
  heads.forEach((h, i) => {
    const c = ws.getCell(row, i + 1);
    c.value = h;
    c.font = font({ size: 9, bold: true, color: argb("FFFFFF") });
    c.fill = solid(NAVY);
    c.alignment = { horizontal: i === 4 ? "right" : "left", vertical: "middle" };
  });
  return heads.length;
}

interface Ranges {
  date: string; // e.g. 'All transactions'!$B$2:$B$40 (month column)
  type: string;
  amount: string;
  category: string;
}

/** Month-by-month table. Returns header row, last month row and total row. */
function monthTable(
  ws: ExcelJS.Worksheet,
  headRow: number,
  months: string[],
  lines: Line[],
  rg: Ranges,
  withOpening: boolean
) {
  tableHead(ws, headRow, ["MONTH", "INCOME", "EXPENSE", "NET", "ENTRIES"]);
  let r = headRow;
  months.forEach((key, i) => {
    r += 1;
    const ml = lines.filter((l) => l.month === key);
    const a = agg(ml);
    const income = round2(a.income + (withOpening ? a.opening : 0));
    const entries = withOpening ? ml.length : ml.filter((l) => l.type !== "Opening balance").length;
    ws.getCell(r, 1).value = keyDate(key);
    ws.getCell(r, 2).value = fx(
      `SUMIFS(${rg.amount},${rg.date},$A${r},${rg.type},"Income")` +
        (withOpening ? `+SUMIFS(${rg.amount},${rg.date},$A${r},${rg.type},"Opening balance")` : ""),
      income
    );
    ws.getCell(r, 3).value = fx(`-SUMIFS(${rg.amount},${rg.date},$A${r},${rg.type},"Expense")`, a.expense);
    ws.getCell(r, 4).value = fx(`B${r}-C${r}`, round2(income - a.expense));
    ws.getCell(r, 5).value = fx(
      withOpening
        ? `COUNTIFS(${rg.date},$A${r})`
        : `COUNTIFS(${rg.date},$A${r})-COUNTIFS(${rg.date},$A${r},${rg.type},"Opening balance")`,
      entries
    );
    styleRow(ws, r, 5, { band: i % 2 === 0 });
    ws.getCell(r, 1).numFmt = "mmmm yyyy";
    ws.getCell(r, 2).numFmt = INR2;
    ws.getCell(r, 3).numFmt = INR2;
    ws.getCell(r, 4).numFmt = INR2_S;
  });
  const last = r;
  r += 1;
  const col = (c: number) => {
    let t = 0;
    for (let k = headRow + 1; k <= last; k++) {
      const v = ws.getCell(k, c).value as ExcelJS.CellFormulaValue;
      t += Number(v.result ?? 0);
    }
    return round2(t);
  };
  ws.getCell(r, 1).value = "TOTAL";
  ["B", "C", "D", "E"].forEach((L, i) => {
    ws.getCell(r, i + 2).value = fx(`SUM(${L}${headRow + 1}:${L}${last})`, col(i + 2));
  });
  styleRow(ws, r, 5, { total: true });
  ws.getCell(r, 2).numFmt = INR2_ON_NAVY;
  ws.getCell(r, 3).numFmt = INR2_ON_NAVY;
  ws.getCell(r, 4).numFmt = INR2_S_ON_NAVY;
  return { headRow, last, total: r };
}

/** Spending-by-category table. Returns first and last data rows (last < first when empty). */
function categoryTable(
  ws: ExcelJS.Worksheet,
  headRow: number,
  lines: Line[],
  rg: Ranges,
  expenseCell: string,
  expenseTotal: number
) {
  tableHead(ws, headRow, ["CATEGORY", "ENTRIES", "TOTAL", "SHARE"]);
  const cats = categoryTotals(lines);
  let r = headRow;
  cats.forEach((c, i) => {
    r += 1;
    // SUMPRODUCT matches the name exactly (SUMIFS would treat * and ? as wildcards).
    const crit = c.category ? `$A${r}` : `""`;
    ws.getCell(r, 1).value = c.category || "Uncategorised";
    ws.getCell(r, 2).value = fx(`SUMPRODUCT((${rg.category}=${crit})*(${rg.type}="Expense"))`, c.entries);
    ws.getCell(r, 3).value = fx(`-SUMPRODUCT((${rg.category}=${crit})*(${rg.type}="Expense")*${rg.amount})`, c.total);
    ws.getCell(r, 4).value = fx(`IF(${expenseCell}=0,0,C${r}/${expenseCell})`, expenseTotal ? c.total / expenseTotal : 0);
    styleRow(ws, r, 4, { band: i % 2 === 0 });
    ws.getCell(r, 3).numFmt = INR2;
    ws.getCell(r, 4).numFmt = "0.0%";
  });
  return { first: headRow + 1, last: r };
}

const monthBar = (sheet: string, head: number, last: number, row0: number): ChartSpec => ({
  kind: "bar",
  title: "Income vs expense",
  categories: `${quote(sheet)}!$A$${head + 1}:$A$${last}`,
  series: [
    { values: `${quote(sheet)}!$B$${head + 1}:$B$${last}`, name: "Income", color: GREEN },
    { values: `${quote(sheet)}!$C$${head + 1}:$C$${last}`, name: "Expense", color: RED },
  ],
  catFormat: "mmm yyyy",
  legend: true,
  anchor: { col: 6, row: row0 },
  widthCm: 15,
  heightCm: 7.2,
});

const categoryPie = (sheet: string, first: number, last: number, title: string, row0: number): ChartSpec => ({
  kind: "pie",
  title,
  categories: `${quote(sheet)}!$A$${first}:$A$${last}`,
  values: `${quote(sheet)}!$C$${first}:$C$${last}`,
  points: last - first + 1,
  anchor: { col: 6, row: row0 },
  widthCm: 15,
  heightCm: 8.5,
});

// ── workbook ────────────────────────────────────────────────────────────
export async function buildXlsx(input: XlsxInput): Promise<Buffer> {
  const lines = input.rows.map(toLine);
  const months = monthsInRange(input.from, input.to);
  const period = `${pretty(input.from)} – ${pretty(input.to)}`;
  const generated = pretty(input.generatedOn);
  const name = clean(input.userName) || "MBL PFin user";
  const nameFor = sheetNamer();
  const charts = new Map<string, ChartSpec[]>();

  const wb = new ExcelJS.Workbook();
  wb.creator = "MBL PFin";
  wb.created = new Date();
  wb.calcProperties.fullCalcOnLoad = true;

  const sm = wb.addWorksheet(SUMMARY);
  const walletTabs = input.wallets.map((w) => ({ ...w, sheet: nameFor(w.name) }));
  const walletSheets = walletTabs.map((w) => wb.addWorksheet(w.sheet));
  const all = wb.addWorksheet(ALL);

  // ── All transactions ──
  setupSheet(all);
  const allCols = linesHead(all, 1, true);
  [13, 11, 30, 16, 16, 18, 18, 14, 20, 11, 11].forEach((w, i) => (all.getColumn(i + 1).width = w));
  all.getRow(1).height = 22;
  const allLast = writeLines(all, 2, lines, true);
  all.views = [{ state: "frozen", ySplit: 1 }];
  all.autoFilter = { from: { row: 1, column: 1 }, to: { row: allLast, column: allCols } };
  all.pageSetup.printTitlesRow = "1:1";
  const A = (col: string) => `${quote(ALL)}!$${col}$2:$${col}$${allLast}`;
  const allRg: Ranges = { date: A("B"), type: A("D"), amount: A("E"), category: A("G") };

  // ── wallet tabs ──
  const walletTiles: { sheet: string; name: string; a: Agg; bf: number }[] = [];
  walletTabs.forEach((w, idx) => {
    const ws = walletSheets[idx];
    setupSheet(ws);
    const wl = lines.filter((l) => l.walletKey === (w.id ?? "none"));
    const a = agg(wl);
    const bf = round2(w.broughtForward);
    walletTiles.push({ sheet: w.sheet, name: w.name, a, bf });
    header(ws, clean(w.name) || w.sheet, "Wallet statement · MBL PFin", [
      ["Name", name],
      ["Period", period],
      ["Generated on", generated],
    ]);

    // layout: tiles, month table (+bar), category table (+pie), then the entries
    const monthHead = 14;
    const catSection = Math.max(monthHead + months.length + 5, 29);
    const cats = categoryTotals(wl).length;
    const txHead = catSection + Math.max(cats + 4, 20);
    const first = txHead + 1;
    const last = first + Math.max(wl.length, 1) - 1;
    const R = (col: string) => `$${col}$${first}:$${col}$${last}`;
    const rg: Ranges = { date: R("B"), type: R("D"), amount: R("E"), category: R("F") };

    const opening = round2(bf + a.opening);
    tiles(ws, 8, [
      ["OPENING BALANCE", fx(`${bf}+SUMIFS(${rg.amount},${rg.type},"Opening balance")`, opening), INR2],
      ["INCOME", fx(`SUMIFS(${rg.amount},${rg.type},"Income")`, a.income), INR2],
      ["EXPENSE", fx(`-SUMIFS(${rg.amount},${rg.type},"Expense")`, a.expense), INR2],
      ["TRANSFERS (NET)", fx(`SUMIFS(${rg.amount},${rg.type},"Transfer")`, a.transfers), INR2_S],
      ["CLOSING BALANCE", fx("A9+B9-C9+D9", round2(opening + a.income - a.expense + a.transfers)), INR2],
    ]);
    note(
      ws,
      10,
      `Opening balance = balance before ${pretty(input.from)} (₹${bf.toLocaleString("en-IN")}) plus any opening-balance entries in the period.`
    );
    note(
      ws,
      11,
      `Moved in from other wallets: ₹${a.tIn.toLocaleString("en-IN")} · moved out: ₹${a.tOut.toLocaleString("en-IN")} · entries: ${wl.length}`
    );

    section(ws, monthHead - 1, "Month by month");
    const mt = monthTable(ws, monthHead, months, wl, rg, false);
    note(ws, mt.total + 1, "Opening balance and transfers are in the tiles above, not in this table.");
    const specs: ChartSpec[] = [monthBar(w.sheet, mt.headRow, mt.last, monthHead - 2)];

    section(ws, catSection, "Spending by category");
    const ct = categoryTable(ws, catSection + 1, wl, rg, "$C$9", a.expense);
    if (ct.last >= ct.first) specs.push(categoryPie(w.sheet, ct.first, ct.last, "Spending by category", catSection - 1));
    else note(ws, catSection + 2, "No expenses in this wallet for the period.");
    charts.set(w.sheet, specs);

    section(ws, txHead - 1, `Transactions (${wl.length})`);
    const cols = linesHead(ws, txHead, false);
    writeLines(ws, first, wl, false);
    ws.autoFilter = { from: { row: txHead, column: 1 }, to: { row: last, column: cols } };
  });

  // ── Summary ──
  setupSheet(sm);
  header(sm, "STATEMENT", "MBL PFin · " + (input.wallets.length === 1 ? clean(input.wallets[0].name) : "all wallets"), [
    ["Name", name],
    ["Period", period],
    ["Generated on", generated],
  ]);
  const tot = agg(lines);
  const income = round2(tot.income + tot.opening);

  // wallet table first (the closing-balance tile reads its total)
  const wHead = 13;
  section(sm, wHead - 1, "Wallets");
  tableHead(sm, wHead, ["WALLET", "OPENING", "INCOME", "EXPENSE", "TRANSFERS", "CLOSING"]);
  let r = wHead;
  walletTiles.forEach((w, i) => {
    r += 1;
    const q = quote(w.sheet);
    const opening = round2(w.bf + w.a.opening);
    sm.getCell(r, 1).value = clean(w.name) || w.sheet;
    sm.getCell(r, 2).value = fx(`${q}!A9`, opening);
    sm.getCell(r, 3).value = fx(`${q}!B9`, w.a.income);
    sm.getCell(r, 4).value = fx(`${q}!C9`, w.a.expense);
    sm.getCell(r, 5).value = fx(`${q}!D9`, w.a.transfers);
    sm.getCell(r, 6).value = fx(`${q}!E9`, round2(opening + w.a.income - w.a.expense + w.a.transfers));
    styleRow(sm, r, 6, { band: i % 2 === 0 });
    [2, 3, 4, 6].forEach((c) => (sm.getCell(r, c).numFmt = INR2));
    sm.getCell(r, 5).numFmt = INR2_S;
  });
  const wLast = r;
  r += 1;
  const wTotal = r;
  sm.getCell(r, 1).value = "TOTAL";
  ["B", "C", "D", "E", "F"].forEach((L, i) => {
    let t = 0;
    for (let k = wHead + 1; k <= wLast; k++) t += Number((sm.getCell(k, i + 2).value as ExcelJS.CellFormulaValue).result ?? 0);
    sm.getCell(r, i + 2).value = fx(wLast > wHead ? `SUM(${L}${wHead + 1}:${L}${wLast})` : "0", round2(t));
  });
  styleRow(sm, r, 6, { total: true });
  [2, 3, 4, 6].forEach((c) => (sm.getCell(r, c).numFmt = INR2_ON_NAVY));
  sm.getCell(r, 5).numFmt = INR2_S_ON_NAVY;
  note(sm, r + 1, "A credit card's closing balance is what you owe on it when it is negative.");
  const closing = Number((sm.getCell(wTotal, 6).value as ExcelJS.CellFormulaValue).result ?? 0);

  tiles(sm, 8, [
    ["INCOME", fx(`SUMIFS(${allRg.amount},${allRg.type},"Income")+SUMIFS(${allRg.amount},${allRg.type},"Opening balance")`, income), INR2],
    ["EXPENSE", fx(`-SUMIFS(${allRg.amount},${allRg.type},"Expense")`, tot.expense), INR2],
    ["NET", fx("A9-B9", round2(income - tot.expense)), INR2_S],
    ["CLOSING BALANCE", fx(`F${wTotal}`, closing), INR2],
  ]);
  note(sm, 10, "Opening balances count as income, the same as in the app. Transfers between wallets are left out of income and expense.");

  const smCharts: ChartSpec[] = [];
  if (wLast > wHead) {
    smCharts.push({
      kind: "bar",
      title: "Closing balance by wallet",
      categories: `${quote(SUMMARY)}!$A$${wHead + 1}:$A$${wLast}`,
      series: [{ values: `${quote(SUMMARY)}!$F$${wHead + 1}:$F$${wLast}`, name: "Closing balance", color: NAVY }],
      legend: false,
      anchor: { col: 7, row: wHead - 2 },
      widthCm: 15,
      heightCm: 7.2,
    });
  }

  const mStart = Math.max(wTotal + 4, wHead + 17);
  section(sm, mStart, "Month by month");
  const mt = monthTable(sm, mStart + 1, months, lines, allRg, true);
  const bar = monthBar(SUMMARY, mt.headRow, mt.last, mStart - 1);
  bar.anchor.col = 7;
  smCharts.push(bar);
  note(
    sm,
    mt.total + 1,
    `Transfers between wallets: moved in ₹${tot.tIn.toLocaleString("en-IN")} · moved out ₹${tot.tOut.toLocaleString("en-IN")}`
  );

  const cStart = Math.max(mt.total + 4, mStart + 17);
  section(sm, cStart, "Spending by category");
  const ct = categoryTable(sm, cStart + 1, lines, allRg, "$B$9", tot.expense);
  if (ct.last >= ct.first) {
    const pie = categoryPie(SUMMARY, ct.first, ct.last, "Where the money went", cStart - 1);
    pie.anchor.col = 7;
    smCharts.push(pie);
  } else {
    note(sm, cStart + 2, "No expenses in this period.");
  }
  note(sm, Math.max(ct.last, cStart + 18) + 2, "MBL PFin · mblpfin.com");
  charts.set(SUMMARY, smCharts);

  const buf = await wb.xlsx.writeBuffer();
  return addCharts(Buffer.from(buf as ArrayBuffer), charts);
}
