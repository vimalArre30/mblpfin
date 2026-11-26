import path from "path";
import fs from "fs";
import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { rowKind, type ExportRow } from "@/lib/export/rows";
import type { CategoryTotal, TotalsResponse } from "@/lib/tracker/totals-types";

// ── Fonts (bundled in lib/pdf/fonts; Nunito Sans 10pt Expanded, OFL) ─────
// Same family as the statement design. Latin covers text; the ₹ sign lives in
// the latin-ext subset, so it is drawn with the second family ("NunitoExt").
// Emoji have no glyphs and are stripped.
const FONT_DIR = path.join(process.cwd(), "lib/pdf/fonts");
let fontsReady = false;
function registerFonts() {
  if (fontsReady) return;
  Font.register({
    family: "Nunito",
    fonts: [
      { src: path.join(FONT_DIR, "NunitoSansExp-latin-400.ttf"), fontWeight: 400 },
      { src: path.join(FONT_DIR, "NunitoSansExp-latin-600.ttf"), fontWeight: 600 },
      { src: path.join(FONT_DIR, "NunitoSansExp-latin-700.ttf"), fontWeight: 700 },
    ],
  });
  Font.register({
    family: "NunitoExt",
    fonts: [
      { src: path.join(FONT_DIR, "NunitoSansExp-latin-ext-400.ttf"), fontWeight: 400 },
      { src: path.join(FONT_DIR, "NunitoSansExp-latin-ext-700.ttf"), fontWeight: 700 },
    ],
  });
  Font.registerHyphenationCallback((w) => [w]);
  fontsReady = true;
}

// Brand logo: public/brand/statement-logo.(png|jpg) and it is
// used automatically. Until then a navy "MBL" tile (as in the statement design).
function loadLogo(): string | null {
  for (const f of ["statement-logo.png", "statement-logo.jpg", "statement-logo.jpeg"]) {
    const p = path.join(process.cwd(), "public/brand", f);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

const NAVY = "#1B2142";
const BAND = "#F7F7F7";
const MUTED = "#6B7280";

const s = StyleSheet.create({
  page: { fontFamily: "Nunito", fontSize: 9, color: "#111827", paddingTop: 40, paddingBottom: 54, paddingHorizontal: 40 },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  title: { fontSize: 30, fontWeight: 700, color: NAVY, letterSpacing: 0.5 },
  logoBox: { width: 52, height: 52, backgroundColor: NAVY, alignItems: "center", justifyContent: "center" },
  logoText: { color: "#fff", fontSize: 14, fontWeight: 700 },
  logoImg: { width: 52, height: 52 },
  meta: { flexDirection: "row", justifyContent: "space-between", marginTop: 22 },
  metaLeft: { fontSize: 10, lineHeight: 1.5 },
  metaRight: { fontSize: 10, lineHeight: 1.5, textAlign: "right" },
  bold: { fontWeight: 700 },
  tiles: { flexDirection: "row", marginTop: 22 },
  tile: { flex: 1, padding: 10, backgroundColor: BAND, marginRight: 8 },
  tileLast: { marginRight: 0 },
  tileLabel: { fontSize: 8, color: MUTED, textTransform: "uppercase", letterSpacing: 0.6 },
  tileValue: { fontSize: 15, fontWeight: 700, marginTop: 4 },
  h2: { fontSize: 11, fontWeight: 700, color: NAVY, marginTop: 22, marginBottom: 6 },
  thead: { flexDirection: "row", backgroundColor: NAVY, paddingVertical: 7, paddingHorizontal: 8 },
  th: { color: "#fff", fontSize: 8, fontWeight: 700, letterSpacing: 0.5 },
  tr: { flexDirection: "row", paddingVertical: 6, paddingHorizontal: 8, alignItems: "flex-start" },
  trAlt: { backgroundColor: BAND },
  right: { textAlign: "right" },
  grand: { flexDirection: "row", justifyContent: "flex-end", marginTop: 8 },
  grandBox: { flexDirection: "row", backgroundColor: NAVY, paddingVertical: 7, paddingHorizontal: 12, width: 220, justifyContent: "space-between" },
  grandText: { color: "#fff", fontWeight: 700, fontSize: 10 },
  monthTitle: { fontSize: 10, fontWeight: 700, color: NAVY, marginTop: 14, marginBottom: 4 },
  monthSum: { flexDirection: "row", backgroundColor: "#E6E9F2", paddingVertical: 7, paddingHorizontal: 8, marginTop: 2, fontSize: 9 },
  grandFull: { flexDirection: "row", backgroundColor: NAVY, paddingVertical: 8, paddingHorizontal: 8, width: "100%" },
  footer: { position: "absolute", left: 40, right: 40, bottom: 24, flexDirection: "row", justifyContent: "space-between", fontSize: 8, color: MUTED },
});

const EMOJI_RE = /[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}]/gu;
const clean = (v: string | null | undefined) => (v ?? "").replace(EMOJI_RE, "").replace(/\s+/g, " ").trim();

const nf0 = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const nf2 = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmt = (n: number) => {
  const a = Math.abs(n);
  return Number.isInteger(a) ? nf0.format(a) : nf2.format(a);
};

/** ₹ is drawn in the latin-ext family; digits in Nunito. */
function Rupee({ n, signed, bold, color }: { n: number; signed?: boolean; bold?: boolean; color?: string }) {
  const sign = signed ? (n < 0 ? "-" : n > 0 ? "+" : "") : n < 0 ? "-" : "";
  const w = bold ? 700 : 400;
  return (
    <Text style={{ fontWeight: w, color }}>
      {sign}
      <Text style={{ fontFamily: "NunitoExt", fontWeight: w }}>{"₹"}</Text>
      {fmt(n)}
    </Text>
  );
}

const MON3 = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function prettyDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${String(d).padStart(2, "0")} ${MON3[m - 1]} ${y}`;
}

export interface MonthSummary {
  key: string; // YYYY-MM
  income: number;
  expense: number;
  net: number;
  entries: number;
}

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const monthTitle = (key: string) => `${MONTH_NAMES[Number(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}`;

export interface StatementProps {
  rows: ExportRow[];
  totals: TotalsResponse;
  from: string;
  to: string;
  userName: string;
  userPhone?: string | null;
  walletName: string | null;
  /** One entry per calendar month in the range, ascending; computed in SQL. */
  months: MonthSummary[];
  generatedOn: string; // YYYY-MM-DD (IST)
}

// Column widths for the transaction table (sum ≈ 100%).
const W = { date: "15%", desc: "33%", cat: "20%", wallet: "16%", amt: "16%" };

export function StatementDocument(p: StatementProps) {
  registerFonts();
  const logo = loadLogo();
  const cats: CategoryTotal[] = p.totals.by_category ?? [];
  const byMonth = new Map<string, ExportRow[]>();
  for (const r of p.rows) {
    const k = r.date.slice(0, 7);
    (byMonth.get(k) ?? byMonth.set(k, []).get(k)!).push(r);
  }
  const groups = [...byMonth.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([key, rows]) => ({ key, rows }));

  return (
    <Document title={`MBL PFin statement ${p.from} to ${p.to}`} author="MBL PFin">
      <Page size="A4" style={s.page}>
        <View style={s.head}>
          <Text style={s.title}>STATEMENT</Text>
          {logo ? (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image src={logo} style={s.logoImg} />
          ) : (
            <View style={s.logoBox}>
              <Text style={s.logoText}>MBL</Text>
            </View>
          )}
        </View>

        <View style={s.meta}>
          <View style={s.metaLeft}>
            <Text style={s.bold}>{clean(p.userName) || "MBL PFin user"}</Text>
            {p.userPhone ? <Text>{clean(p.userPhone)}</Text> : null}
            <Text>{p.walletName ? clean(p.walletName) : "All wallets"}</Text>
          </View>
          <View style={s.metaRight}>
            <Text style={s.bold}>DATE :</Text>
            <Text>{prettyDate(p.generatedOn)}</Text>
            <Text style={[s.bold, { marginTop: 6 }]}>PERIOD :</Text>
            <Text>
              {prettyDate(p.from)} – {prettyDate(p.to)}
            </Text>
          </View>
        </View>

        <View style={s.tiles}>
          <View style={s.tile}>
            <Text style={s.tileLabel}>Income</Text>
            <Text style={s.tileValue}><Rupee n={p.totals.income} bold /></Text>
          </View>
          <View style={s.tile}>
            <Text style={s.tileLabel}>Expense</Text>
            <Text style={s.tileValue}><Rupee n={p.totals.expense} bold /></Text>
          </View>
          <View style={[s.tile, s.tileLast]}>
            <Text style={s.tileLabel}>Net</Text>
            <Text style={s.tileValue}><Rupee n={p.totals.net} bold signed /></Text>
          </View>
        </View>

        {cats.length > 0 && (
          <View wrap={false}>
            <Text style={s.h2}>Spending by category</Text>
            <View style={s.thead}>
              <Text style={[s.th, { width: "55%" }]}>CATEGORY</Text>
              <Text style={[s.th, s.right, { width: "15%" }]}>ENTRIES</Text>
              <Text style={[s.th, s.right, { width: "30%" }]}>TOTAL</Text>
            </View>
            {cats.map((c, i) => (
              <View key={`${c.category_id ?? "none"}-${i}`} style={i % 2 ? [s.tr] : [s.tr, s.trAlt]} wrap={false}>
                <Text style={{ width: "55%" }}>{clean(c.name) || "Uncategorised"}</Text>
                <Text style={[s.right, { width: "15%" }]}>{c.entries}</Text>
                <Text style={[s.right, { width: "30%" }]}><Rupee n={c.total} /></Text>
              </View>
            ))}
          </View>
        )}

        <Text style={s.h2}>Transactions ({p.rows.length})</Text>
        {groups.map((g) => {
          const m = p.months.find((x) => x.key === g.key);
          return (
            <View key={g.key}>
              <Text style={s.monthTitle} minPresenceAhead={60}>{monthTitle(g.key)}</Text>
              <View style={s.thead} wrap={false}>
                <Text style={[s.th, { width: W.date }]}>DATE</Text>
                <Text style={[s.th, { width: W.desc }]}>DESCRIPTION</Text>
                <Text style={[s.th, { width: W.cat }]}>CATEGORY</Text>
                <Text style={[s.th, { width: W.wallet }]}>WALLET</Text>
                <Text style={[s.th, s.right, { width: W.amt }]}>AMOUNT</Text>
              </View>
              {g.rows.map((r, i) => {
                const kind = rowKind(r);
                const a = Number(r.amount);
                const signed = kind === "expense" ? -Math.abs(a) : kind === "income" ? Math.abs(a) : a;
                const desc =
                  clean(r.description) ||
                  (r.is_opening_balance ? "Opening balance" : kind === "transfer" ? "Transfer" : "");
                return (
                  <View key={r.id} style={i % 2 ? [s.tr] : [s.tr, s.trAlt]} wrap={false}>
                    <Text style={{ width: W.date }}>{prettyDate(r.date)}</Text>
                    <Text style={{ width: W.desc }}>{desc}</Text>
                    <Text style={{ width: W.cat }}>{clean(r.categories?.name)}</Text>
                    <Text style={{ width: W.wallet }}>{clean(r.wallet?.name)}</Text>
                    <Text style={[s.right, { width: W.amt }]}>
                      <Rupee n={signed} signed />
                    </Text>
                  </View>
                );
              })}
              {m && (
                <View style={s.monthSum} wrap={false}>
                  <Text style={[s.bold, { width: "34%" }]}>{monthTitle(g.key)}</Text>
                  <Text style={{ width: "22%" }}>Income <Rupee n={m.income} bold /></Text>
                  <Text style={{ width: "22%" }}>Expense <Rupee n={m.expense} bold /></Text>
                  <Text style={[s.right, { width: "22%" }]}>Net <Rupee n={m.net} signed bold /></Text>
                </View>
              )}
            </View>
          );
        })}

        <View wrap={false}>
          <Text style={s.h2}>Final summary</Text>
          <View style={s.thead}>
            <Text style={[s.th, { width: "34%" }]}>MONTH</Text>
            <Text style={[s.th, s.right, { width: "22%" }]}>INCOME</Text>
            <Text style={[s.th, s.right, { width: "22%" }]}>EXPENSE</Text>
            <Text style={[s.th, s.right, { width: "22%" }]}>NET</Text>
          </View>
          {p.months.map((m, i) => (
            <View key={m.key} style={i % 2 ? [s.tr] : [s.tr, s.trAlt]} wrap={false}>
              <Text style={{ width: "34%" }}>{monthTitle(m.key)}</Text>
              <Text style={[s.right, { width: "22%" }]}><Rupee n={m.income} /></Text>
              <Text style={[s.right, { width: "22%" }]}><Rupee n={m.expense} /></Text>
              <Text style={[s.right, { width: "22%" }]}><Rupee n={m.net} signed /></Text>
            </View>
          ))}
          <View style={s.grand}>
            <View style={s.grandFull}>
              <Text style={[s.grandText, { width: "34%" }]}>TOTAL ({p.totals.entries} entries)</Text>
              <Text style={[s.grandText, s.right, { width: "22%" }]}><Rupee n={p.totals.income} bold color="#fff" /></Text>
              <Text style={[s.grandText, s.right, { width: "22%" }]}><Rupee n={p.totals.expense} bold color="#fff" /></Text>
              <Text style={[s.grandText, s.right, { width: "22%" }]}><Rupee n={p.totals.net} signed bold color="#fff" /></Text>
            </View>
          </View>
          {(p.totals.transfers_in > 0 || p.totals.transfers_out > 0) && (
            <Text style={{ marginTop: 6, fontSize: 8, color: MUTED }}>
              Transfers between your wallets are not counted in income or expense: moved in{" "}
              <Rupee n={p.totals.transfers_in} /> · moved out <Rupee n={p.totals.transfers_out} />
            </Text>
          )}
        </View>

        <View style={s.footer} fixed>
          <Text>MBL PFin · mblpfin.com</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
