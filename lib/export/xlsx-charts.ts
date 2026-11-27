import JSZip from "jszip";

/**
 * exceljs writes formulas, styles and filters but has no chart support, so the
 * charts are added afterwards as plain OOXML parts: one drawing per sheet, one
 * chart part per chart, plus the relationships and content types that link them.
 */

export interface ChartSeries {
  /** Absolute range like 'Summary'!$B$14:$B$16 */
  values: string;
  /** Cell holding the series name, or a literal name */
  nameRef?: string;
  name?: string;
  color: string; // hex, no #
}

export type ChartSpec =
  | {
      kind: "bar";
      title: string;
      categories: string;
      series: ChartSeries[];
      /** Category axis number format for date categories; omit for text categories */
      catFormat?: string;
      legend: boolean;
      anchor: { col: number; row: number }; // zero-based
      widthCm: number;
      heightCm: number;
    }
  | {
      kind: "pie";
      title: string;
      categories: string;
      values: string;
      points: number;
      anchor: { col: number; row: number };
      widthCm: number;
      heightCm: number;
    };

const PIE_COLORS = ["1B2142", "3B4A8C", "6C7BC4", "2E7D5B", "6FB58F", "E0A526", "D9663A", "A23B5B", "8C8C8C", "B9C2E6"];
const NS_C = "http://schemas.openxmlformats.org/drawingml/2006/chart";
const NS_A = "http://schemas.openxmlformats.org/drawingml/2006/main";
const NS_R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const REL_CHART = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart";
const REL_DRAWING = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing";
const CT_CHART = "application/vnd.openxmlformats-officedocument.drawingml.chart+xml";
const CT_DRAWING = "application/vnd.openxmlformats-officedocument.drawing+xml";
const EMU_PER_CM = 360000;

export const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function title(text: string) {
  return (
    `<c:title><c:tx><c:rich><a:bodyPr/><a:p><a:pPr><a:defRPr sz="1200" b="1"/></a:pPr>` +
    `<a:r><a:rPr lang="en-IN" sz="1200" b="1"/><a:t>${esc(text)}</a:t></a:r></a:p></c:rich></c:tx>` +
    `<c:overlay val="0"/></c:title><c:autoTitleDeleted val="0"/>`
  );
}

const fill = (hex: string) => `<a:solidFill><a:srgbClr val="${hex}"/></a:solidFill>`;

function barXml(spec: Extract<ChartSpec, { kind: "bar" }>) {
  const sers = spec.series
    .map((s, i) => {
      const tx = s.nameRef
        ? `<c:tx><c:strRef><c:f>${esc(s.nameRef)}</c:f></c:strRef></c:tx>`
        : `<c:tx><c:v>${esc(s.name ?? "")}</c:v></c:tx>`;
      return (
        `<c:ser><c:idx val="${i}"/><c:order val="${i}"/>${tx}` +
        `<c:spPr>${fill(s.color)}<a:ln><a:noFill/></a:ln></c:spPr><c:invertIfNegative val="0"/>` +
        (spec.catFormat
          ? `<c:cat><c:numRef><c:f>${esc(spec.categories)}</c:f></c:numRef></c:cat>`
          : `<c:cat><c:strRef><c:f>${esc(spec.categories)}</c:f></c:strRef></c:cat>`) +
        `<c:val><c:numRef><c:f>${esc(s.values)}</c:f></c:numRef></c:val></c:ser>`
      );
    })
    .join("");
  const catFmt = spec.catFormat
    ? `<c:numFmt formatCode="${esc(spec.catFormat)}" sourceLinked="0"/>`
    : `<c:numFmt formatCode="General" sourceLinked="1"/>`;
  return (
    `<c:barChart><c:barDir val="col"/><c:grouping val="clustered"/><c:varyColors val="0"/>${sers}` +
    `<c:gapWidth val="120"/><c:axId val="10"/><c:axId val="100"/></c:barChart>` +
    `<c:catAx><c:axId val="10"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/>` +
    `<c:axPos val="b"/>${catFmt}<c:majorTickMark val="none"/><c:minorTickMark val="none"/>` +
    `<c:tickLblPos val="low"/><c:crossAx val="100"/><c:crosses val="autoZero"/><c:auto val="1"/>` +
    `<c:lblAlgn val="ctr"/><c:lblOffset val="100"/><c:noMultiLvlLbl val="0"/></c:catAx>` +
    `<c:valAx><c:axId val="100"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/>` +
    `<c:axPos val="l"/><c:numFmt formatCode="&quot;₹&quot;#,##0" sourceLinked="0"/>` +
    `<c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/>` +
    `<c:crossAx val="10"/><c:crosses val="autoZero"/><c:crossBetween val="between"/></c:valAx>`
  );
}

function pieXml(spec: Extract<ChartSpec, { kind: "pie" }>) {
  const pts = Array.from({ length: spec.points }, (_, i) =>
    `<c:dPt><c:idx val="${i}"/><c:bubble3D val="0"/><c:spPr>${fill(PIE_COLORS[i % PIE_COLORS.length])}` +
    `<a:ln><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></a:ln></c:spPr></c:dPt>`
  ).join("");
  return (
    `<c:pieChart><c:varyColors val="1"/><c:ser><c:idx val="0"/><c:order val="0"/>${pts}` +
    `<c:dLbls><c:numFmt formatCode="0%" sourceLinked="0"/><c:spPr><a:noFill/><a:ln><a:noFill/></a:ln></c:spPr>` +
    `<c:dLblPos val="bestFit"/><c:showLegendKey val="0"/><c:showVal val="0"/>` +
    `<c:showCatName val="0"/><c:showSerName val="0"/><c:showPercent val="1"/><c:showBubbleSize val="0"/>` +
    `<c:showLeaderLines val="1"/></c:dLbls>` +
    `<c:cat><c:strRef><c:f>${esc(spec.categories)}</c:f></c:strRef></c:cat>` +
    `<c:val><c:numRef><c:f>${esc(spec.values)}</c:f></c:numRef></c:val></c:ser>` +
    `<c:firstSliceAng val="0"/></c:pieChart>`
  );
}

export function chartXml(spec: ChartSpec): string {
  const legend =
    spec.kind === "pie"
      ? `<c:legend><c:legendPos val="r"/><c:overlay val="0"/></c:legend>`
      : spec.legend
        ? `<c:legend><c:legendPos val="b"/><c:overlay val="0"/></c:legend>`
        : "";
  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<c:chartSpace xmlns:c="${NS_C}" xmlns:a="${NS_A}" xmlns:r="${NS_R}">` +
    `<c:roundedCorners val="0"/><c:chart>${title(spec.title)}<c:plotArea><c:layout/>` +
    (spec.kind === "bar" ? barXml(spec) : pieXml(spec)) +
    `</c:plotArea>${legend}<c:plotVisOnly val="1"/><c:dispBlanksAs val="gap"/></c:chart>` +
    `<c:txPr><a:bodyPr/><a:p><a:pPr><a:defRPr sz="900"><a:latin typeface="Arial"/></a:defRPr></a:pPr>` +
    `<a:endParaRPr lang="en-IN"/></a:p></c:txPr></c:chartSpace>`
  );
}

function drawingXml(specs: ChartSpec[], firstRelId: number) {
  const anchors = specs
    .map((s, i) => {
      const cx = Math.round(s.widthCm * EMU_PER_CM);
      const cy = Math.round(s.heightCm * EMU_PER_CM);
      return (
        `<xdr:oneCellAnchor><xdr:from><xdr:col>${s.anchor.col}</xdr:col><xdr:colOff>0</xdr:colOff>` +
        `<xdr:row>${s.anchor.row}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from><xdr:ext cx="${cx}" cy="${cy}"/>` +
        `<xdr:graphicFrame macro=""><xdr:nvGraphicFramePr><xdr:cNvPr id="${i + 2}" name="Chart ${i + 1}"/>` +
        `<xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr><xdr:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></xdr:xfrm>` +
        `<a:graphic><a:graphicData uri="${NS_C}"><c:chart xmlns:c="${NS_C}" r:id="rId${firstRelId + i}"/>` +
        `</a:graphicData></a:graphic></xdr:graphicFrame><xdr:clientData/></xdr:oneCellAnchor>`
      );
    })
    .join("");
  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" ` +
    `xmlns:a="${NS_A}" xmlns:r="${NS_R}">${anchors}</xdr:wsDr>`
  );
}

// Elements that must come after <drawing> in a worksheet (ECMA-376 order).
const AFTER_DRAWING = ["<legacyDrawing", "<legacyDrawingHF", "<picture", "<oleObjects", "<controls", "<webPublishItems", "<tableParts", "<extLst"];

function insertDrawing(sheetXml: string, relId: string): string {
  if (!/xmlns:r=/.test(sheetXml.slice(0, 1000))) {
    sheetXml = sheetXml.replace(/<worksheet\b/, `<worksheet xmlns:r="${NS_R}"`);
  }
  const tag = `<drawing r:id="${relId}"/>`;
  let at = -1;
  for (const t of AFTER_DRAWING) {
    const i = sheetXml.indexOf(t);
    if (i !== -1 && (at === -1 || i < at)) at = i;
  }
  if (at === -1) at = sheetXml.lastIndexOf("</worksheet>");
  return sheetXml.slice(0, at) + tag + sheetXml.slice(at);
}

/** Adds the charts to an exceljs-written workbook. `charts` is keyed by sheet name. */
export async function addCharts(xlsx: Buffer | ArrayBuffer, charts: Map<string, ChartSpec[]>): Promise<Buffer> {
  const zip = await JSZip.loadAsync(xlsx);
  const wbXml = await zip.file("xl/workbook.xml")!.async("string");
  const wbRels = await zip.file("xl/_rels/workbook.xml.rels")!.async("string");

  // sheet name -> worksheet part path
  const relTarget = new Map<string, string>();
  for (const m of wbRels.matchAll(/<Relationship\b[^>]*>/g)) {
    const id = /Id="([^"]+)"/.exec(m[0])?.[1];
    const target = /Target="([^"]+)"/.exec(m[0])?.[1];
    if (id && target) relTarget.set(id, target.replace(/^\/?xl\//, "").replace(/^\//, ""));
  }
  const sheetPath = new Map<string, string>();
  for (const m of wbXml.matchAll(/<sheet\b[^>]*>/g)) {
    const name = /name="([^"]+)"/.exec(m[0])?.[1];
    const rid = /r:id="([^"]+)"/.exec(m[0])?.[1];
    if (name && rid && relTarget.has(rid)) {
      const unescaped = name.replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
      sheetPath.set(unescaped, `xl/${relTarget.get(rid)}`);
    }
  }

  let ct = await zip.file("[Content_Types].xml")!.async("string");
  const overrides: string[] = [];
  let chartNo = 0;
  let drawingNo = 0;

  for (const [sheetName, specs] of charts) {
    if (!specs.length) continue;
    const path = sheetPath.get(sheetName);
    if (!path) throw new Error(`xlsx charts: sheet not found: ${sheetName}`);
    drawingNo += 1;

    const drawRels: string[] = [];
    specs.forEach((spec, i) => {
      chartNo += 1;
      zip.file(`xl/charts/chart${chartNo}.xml`, chartXml(spec));
      overrides.push(`<Override PartName="/xl/charts/chart${chartNo}.xml" ContentType="${CT_CHART}"/>`);
      drawRels.push(`<Relationship Id="rId${i + 1}" Type="${REL_CHART}" Target="../charts/chart${chartNo}.xml"/>`);
    });
    zip.file(`xl/drawings/drawing${drawingNo}.xml`, drawingXml(specs, 1));
    zip.file(
      `xl/drawings/_rels/drawing${drawingNo}.xml.rels`,
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${drawRels.join("")}</Relationships>`
    );
    overrides.push(`<Override PartName="/xl/drawings/drawing${drawingNo}.xml" ContentType="${CT_DRAWING}"/>`);

    // sheet -> drawing relationship
    const file = path.split("/").pop()!;
    const relsPath = path.replace(file, `_rels/${file}.rels`);
    const relId = "rIdMblDrawing1";
    const rel = `<Relationship Id="${relId}" Type="${REL_DRAWING}" Target="../drawings/drawing${drawingNo}.xml"/>`;
    const existing = zip.file(relsPath);
    if (existing) {
      const x = await existing.async("string");
      zip.file(relsPath, x.replace("</Relationships>", `${rel}</Relationships>`));
    } else {
      zip.file(
        relsPath,
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rel}</Relationships>`
      );
    }
    const sheetXml = await zip.file(path)!.async("string");
    zip.file(path, insertDrawing(sheetXml, relId));
  }

  ct = ct.replace("</Types>", `${overrides.join("")}</Types>`);
  zip.file("[Content_Types].xml", ct);
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}
