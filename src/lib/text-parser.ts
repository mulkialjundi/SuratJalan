import type { SuratJalanData, SuratJalanItem } from "./types";
import { PRODUCT_COLUMNS } from "./pdf-extractor";

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const MONTH_ALIASES: Record<string, number> = {
  jan: 0, januari: 0, january: 0,
  feb: 1, februari: 1, february: 1,
  mar: 2, maret: 2, march: 2,
  apr: 3, april: 3,
  mei: 4, may: 4,
  jun: 5, juni: 5, june: 5,
  jul: 6, juli: 6, july: 6,
  agu: 7, agt: 7, agustus: 7, aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  okt: 9, oktober: 9, oct: 9, october: 9,
  nov: 10, november: 10,
  des: 11, desember: 11, dec: 11, december: 11,
};

interface ParsedOutlet {
  outlet: string;
  date: string;
  items: SuratJalanItem[];
}

/**
 * Parses a pasted PO text into SuratJalanData[].
 *
 * Supported formats (auto-detected):
 * 1. Tabel tab / pipe (`|`) dengan baris header produk.
 *    Tanggal | Outlet | Ceciwis | Timun | ... | Bawang Putih Kupas
 *    1 Nov 2026 | Aren Jaya | 0,5 | 2 | ... | 0,5
 * 2. Baris ringkas: tanggal + nama outlet + deretan angka (urutan kolom produk).
 *    1 Nov Aren Jaya 0,5 2 0 0 0,5 4 2 0,5 0,5
 * 3. Blok per outlet:
 *    Outlet: Aren Jaya
 *    Tanggal: 1 Nov 2026
 *    Timun 2 kg
 *    Jukut 4
 */
export function parseTextInput(raw: string): SuratJalanData[] {
  const text = (raw || "").replace(/\r\n?/g, "\n");
  const lines = text
    .split("\n")
    .map((line) => line.replace(/\u00a0/g, " ").trimEnd());

  if (!lines.some((line) => line.trim())) return [];

  const nonEmpty = lines.filter((line) => line.trim());

  const parsed =
    parseDelimitedTable(nonEmpty) ??
    parseCompactRows(nonEmpty) ??
    parseBlocks(nonEmpty) ??
    [];

  return toSuratJalanList(parsed);
}

/** Sample text used by the UI demo button. */
export const SAMPLE_TEXT_PO = `PO Pengiriman SENIN Tgl 2/11
- BAWANG BOMBAY (1000 GRM) (4.0) : 1.5 kg
- CABAI KERITING MERAH BERSIH (1000 GRM) (4.0) : 22 kg
- CABAI RAWIT MERAH BERSIH (1000 GRM) (4.0) : 66 kg
- DAUN BAWANG (1000 GRM) (4.0) : 1 kg
- KECOMBRANG (1000 GRM) (4.0) : 7 kg
- LABU SIAM (1000 GRM) (4.0) : 5 kg
- NANAS (1000 GRM) (4.0) KUPAS : 9 kg
- SAWI PUTIH (1000 GRM) (4.0) : 3 kg

Mohon diproses kirim ke CK DEPOK.`;

/* -------------------------------------------------------------------------- */
/*                            Format 1: tabel delimited                       */
/* -------------------------------------------------------------------------- */

function parseDelimitedTable(lines: string[]): ParsedOutlet[] | null {
  let headerIndex = -1;
  let headerCells: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const cells = splitDelimitedCells(lines[i]);
    if (cells.length < 3) continue;
    // Header rows never contain data values (dates/qty). This avoids
    // mistaking a data row that mentions product names for a header.
    if (cells.some((cell) => /\d/.test(cell))) continue;

    const productMatches = cells.filter((cell) => matchProduct(cell) !== null);
    if (productMatches.length >= 2) {
      headerIndex = i;
      headerCells = cells;
      break;
    }
  }

  if (headerIndex === -1) return null;

  const productColumns: { index: number; name: string }[] = [];
  headerCells.forEach((cell, index) => {
    const product = matchProduct(cell);
    if (product) productColumns.push({ index, name: product });
  });
  if (productColumns.length === 0) return null;

  const dateColumn = headerCells.findIndex((cell) =>
    /^(tanggal|tgl|date)$/i.test(cell.trim())
  );
  const outletColumn = headerCells.findIndex((cell) =>
    /^(outlet|cabang|toko|kepada|nama|nama outlet)$/i.test(cell.trim())
  );
  const results: ParsedOutlet[] = [];
  let currentDate = "";

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const cells = splitDelimitedCells(lines[i]);
    if (cells.length < 2) continue;

    const dateRaw =
      dateColumn >= 0
        ? cells[dateColumn]
        : cells.find((cell) => parseDateCell(cell) !== null) || "";
    const formattedDate = parseDateCell(dateRaw);
    if (formattedDate) currentDate = formattedDate;

    let outlet =
      outletColumn >= 0
        ? cells[outletColumn]
        : cells.find(
            (cell) =>
              cell &&
              parseDateCell(cell) === null &&
              matchProduct(cell) === null &&
              !isNumericCell(cell)
          ) || "";

    outlet = cleanOutletName(outlet);
    if (!outlet) continue;

    const items = buildItems(
      productColumns.map((col) => ({
        name: col.name,
        qty: parseQtyFromCell(cells[col.index]),
      }))
    );

    if (items.length === 0) {
      // Fallback: if the row only contains numbers, map them in product order.
      const numericCells = cells
        .filter((_, index) => index !== dateColumn && index !== outletColumn)
        .filter((cell) => isNumericCell(cell))
        .map(parseQtyFromCell);
      const fallbackItems = buildItems(
        PRODUCT_COLUMNS.map((name, index) => ({
          name,
          qty: numericCells[index] ?? 0,
        }))
      );
      if (fallbackItems.length > 0) {
        results.push({
          outlet,
          date: currentDate || todayAsIndonesian(),
          items: fallbackItems,
        });
      }
      continue;
    }

    results.push({
      outlet,
      date: currentDate || todayAsIndonesian(),
      items,
    });
  }

  return results.length > 0 ? results : null;
}

/* -------------------------------------------------------------------------- */
/*                     Format 2: baris tanggal + outlet + angka              */
/* -------------------------------------------------------------------------- */

function parseCompactRows(lines: string[]): ParsedOutlet[] | null {
  const results: ParsedOutlet[] = [];

  for (const line of lines) {
    const split = splitLeadingDate(line);
    if (!split) continue;

    let rest = split.rest.trim();
    if (!rest) continue;

    // Table header or label rows should not be treated as data.
    if (/^[|,\t]/.test(rest)) rest = rest.replace(/^[|,\t\s]+/, "");
    if (!rest) continue;

    // Rows that mention product names explicitly, e.g.
    // "1 Nov 2026 | Aren Jaya | Ceciwis 1 | Timun 2"
    const namedItems = extractProductsFromLine(rest);
    if (namedItems.length > 0) {
      const namedCells = splitDelimitedCells(rest);
      let outlet = "";

      if (namedCells.length > 1) {
        outlet = cleanOutletName(
          namedCells.find(
            (cell) =>
              cell &&
              matchProduct(cell) === null &&
              !isNumericCell(cell)
          ) || namedCells[0]
        );
      } else {
        const productPositions = PRODUCT_COLUMNS.map((product) =>
          rest.toLowerCase().indexOf(product.toLowerCase())
        ).filter((position) => position >= 0);
        const firstProductPosition =
          productPositions.length > 0 ? Math.min(...productPositions) : -1;
        if (firstProductPosition > 0) {
          outlet = cleanOutletName(rest.slice(0, firstProductPosition));
        }
      }

      if (outlet) {
        results.push({
          outlet,
          date: split.date,
          items: namedItems,
        });
        continue;
      }
    }

    const cells = splitDelimitedCells(rest);
    let outlet = "";
    let numericValues: number[] = [];

    if (cells.length > 1) {
      outlet = cleanOutletName(cells[0]);
      numericValues = cells.slice(1).map(parseQtyFromCell);
    } else {
      const tokens = rest.split(/\s+/).filter(Boolean);
      const firstNumber = tokens.findIndex((token) => isNumericCell(token));
      if (firstNumber <= 0) continue;
      outlet = cleanOutletName(tokens.slice(0, firstNumber).join(" "));
      numericValues = tokens
        .slice(firstNumber)
        .filter((token) => isNumericCell(token))
        .map(parseQtyFromCell);
    }

    if (!outlet || numericValues.length === 0) continue;

    // Last value is commonly the total weight column.
    const quantities =
      numericValues.length > PRODUCT_COLUMNS.length
        ? numericValues.slice(0, PRODUCT_COLUMNS.length)
        : numericValues;

    const items = buildItems(
      PRODUCT_COLUMNS.map((name, index) => ({
        name,
        qty: quantities[index] ?? 0,
      }))
    );

    if (items.length === 0) continue;

    results.push({
      outlet,
      date: split.date,
      items,
    });
  }

  return results.length > 0 ? results : null;
}

/* -------------------------------------------------------------------------- */
/*                        Format 3: blok teks per outlet                     */
/* -------------------------------------------------------------------------- */

function parseBlocks(lines: string[]): ParsedOutlet[] | null {
  const results: ParsedOutlet[] = [];

  let currentDate = "";
  let currentOutlet = "";
  let currentItems: SuratJalanItem[] = [];
  let pendingNumbers: number[] = [];

  const flush = () => {
    if (currentOutlet && currentItems.length > 0) {
      results.push({
        outlet: currentOutlet,
        date: currentDate || todayAsIndonesian(),
        items: currentItems,
      });
      currentItems = [];
      currentOutlet = "";
    } else {
      currentItems = [];
    }
    pendingNumbers = [];
  };

  const startOutlet = (name: string) => {
    if (!currentOutlet && currentItems.length > 0) {
      // Outlet is mentioned after its product list (e.g. "kirim ke CK DEPOK").
      currentOutlet = name;
      return;
    }
    if (currentOutlet && currentItems.length === 0) {
      currentOutlet = name;
      return;
    }
    flush();
    currentOutlet = name;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flush();
      continue;
    }

    // Separators like "---" or "==="
    if (/^[-=_*]{3,}$/.test(line)) {
      flush();
      continue;
    }

    // Date anywhere: "Tanggal: 1 Nov 2026", "PO Pengiriman SENIN Tgl 2/11"
    const inlineDate =
      extractInlineDate(line) || splitLeadingDate(line)?.date || null;
    if (inlineDate) {
      if (currentItems.length > 0) flush();
      currentDate = inlineDate;
      const outletFromMessage =
        extractOutletFromMessage(line) || extractOutletLabel(line);
      if (outletFromMessage) startOutlet(outletFromMessage);
      continue;
    }

    // Explicit outlet label, e.g. "Outlet: Aren Jaya"
    const labeledOutlet = extractOutletLabel(line);
    if (labeledOutlet) {
      startOutlet(labeledOutlet);
      continue;
    }

    // Outlet mentioned in a sentence, e.g. "Mohon diproses kirim ke CK DEPOK"
    const messageOutlet = extractOutletFromMessage(line);
    if (messageOutlet) {
      startOutlet(messageOutlet);
      continue;
    }

    // Header row, ignore
    if (
      /^(no\.?|nomor|nama barang|barang|qty|jumlah|total|kg|keterangan)\b/i.test(
        line
      )
    ) {
      continue;
    }

    // Pure numeric line -> map sequentially to product columns
    const tokens = line.split(/[\s|,;]+/).filter(Boolean);
    if (tokens.length > 0 && tokens.every((token) => isNumericCell(token))) {
      pendingNumbers = tokens.map(parseQtyFromCell);
      const items = buildItems(
        PRODUCT_COLUMNS.map((name, index) => ({
          name,
          qty: pendingNumbers[index] ?? 0,
        }))
      ).filter(
        (item) =>
          !currentItems.some(
            (existing) => existing.namaBarang === item.namaBarang
          )
      );
      currentItems = [...currentItems, ...items];
      continue;
    }

    // Generic product line, e.g.
    // "- BAWANG BOMBAY (1000 GRM) (4.0) : 1.5 kg"
    const genericItem = extractGenericProductLine(line);
    if (genericItem) {
      const existingIndex = currentItems.findIndex(
        (existing) => existing.namaBarang === genericItem.namaBarang
      );
      if (existingIndex >= 0) {
        currentItems[existingIndex] = genericItem;
      } else {
        currentItems.push(genericItem);
      }
      continue;
    }

    // Product lines: "Timun 2", "Timun: 2 kg", "2 kg Timun"
    const productItems = extractProductsFromLine(line);
    if (productItems.length > 0) {
      for (const item of productItems) {
        const existingIndex = currentItems.findIndex(
          (existing) => existing.namaBarang === item.namaBarang
        );
        if (existingIndex >= 0) {
          currentItems[existingIndex] = item;
        } else {
          currentItems.push(item);
        }
      }
      continue;
    }

    // Plain text line -> candidate outlet name
    if (
      !/\d/.test(line) &&
      line.length <= 60 &&
      !/^(kepada|alamat|outlet|cabang|toko|tanggal|tgl)\b/i.test(line)
    ) {
      const name = cleanOutletName(line);
      if (name) startOutlet(name);
    }
  }

  flush();

  return results.length > 0 ? results : null;
}

function extractProductsFromLine(line: string): SuratJalanItem[] {
  const found: { name: string; index: number; qty: number }[] = [];

  const sortedProducts = [...PRODUCT_COLUMNS].sort(
    (a, b) => b.length - a.length
  );

  for (const product of sortedProducts) {
    const re = new RegExp(escapeRegExp(product), "ig");
    let match: RegExpExecArray | null;
    while ((match = re.exec(line)) !== null) {
      const after = line.slice(match.index + match[0].length, match.index + match[0].length + 24);
      const before = line.slice(Math.max(0, match.index - 12), match.index);
      const afterQty = firstNumber(after);
      const beforeQty = firstNumber(before);
      const qty = afterQty ?? beforeQty;
      if (qty !== null) {
        found.push({ name: product, index: match.index, qty });
        break;
      }
    }
  }

  return found
    .sort((a, b) => a.index - b.index)
    .filter((entry) => entry.qty > 0)
    .map((entry, idx) => ({
      no: idx + 1,
      namaBarang: entry.name,
      qty: entry.qty,
    }));
}

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

function toSuratJalanList(parsed: ParsedOutlet[]): SuratJalanData[] {
  const results: SuratJalanData[] = [];
  const seen = new Set<string>();

  for (const entry of parsed) {
    const outlet = cleanOutletName(entry.outlet);
    if (!outlet) continue;

    const key = outlet.toLowerCase();
    if (seen.has(key)) continue;

    const items = entry.items
      .filter((item) => item.namaBarang && item.qty > 0)
      .map((item, index) => ({ ...item, no: index + 1 }));
    if (items.length === 0) continue;

    seen.add(key);

    const displayName = outlet;
    const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
    const number = String(results.length + 1).padStart(3, "0");

    results.push({
      id: `sj-text-${results.length + 1}`,
      tanggal: entry.date || todayAsIndonesian(),
      idBarang: `A${number}`,
      kepada: displayName,
      alamat: displayName,
      kendaraan: "",
      noPolisi: "",
      items,
      totalQty,
    });
  }

  return results;
}

function buildItems(entries: { name: string; qty: number }[]): SuratJalanItem[] {
  return entries
    .filter((entry) => entry.qty > 0)
    .map((entry, index) => ({
      no: index + 1,
      namaBarang: entry.name,
      qty: entry.qty,
    }));
}

function splitDelimitedCells(line: string): string[] {
  if (line.includes("\t")) {
    return line.split("\t").map((cell) => cell.trim());
  }
  if (line.includes("|")) {
    return line.split("|").map((cell) => cell.trim());
  }
  return [];
}

function splitLeadingDate(
  line: string
): { date: string; rest: string } | null {
  const trimmed = line.trim();

  const textDate = trimmed.match(
    /^(\d{1,2}\s+[A-Za-z]{3,9}(?:\s+\d{2,4})?)\b\s*(.*)$/
  );
  if (textDate) {
    const formatted = parseDateCell(textDate[1]);
    if (formatted) return { date: formatted, rest: textDate[2] };
  }

  const numericDate = trimmed.match(
    /^(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)\b\s*(.*)$/
  );
  if (numericDate) {
    const formatted = parseDateCell(numericDate[1]);
    if (formatted) return { date: formatted, rest: numericDate[2] };
  }

  return null;
}

function extractOutletLabel(line: string): string | null {
  const match = line.match(
    /(?:outlet|cabang|toko|kepada|nama(?:\s+outlet)?|penerima)\s*[:\-]\s*(.+)$/i
  );
  if (!match) return null;
  return cleanOutletName(match[1].split(/[|,;]/)[0]);
}

function extractInlineDate(line: string): string | null {
  const match = line.match(
    /(?:tanggal|tgl|date)\s*[:\-]?\s*(\d{1,2}\s+[A-Za-z]{3,9}(?:\s+\d{2,4})?|\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)/i
  );
  if (!match) return null;
  return parseDateCell(match[1]);
}

const OUTLET_STOPWORDS = new Set([
  "teks",
  "yang",
  "diterima",
  "seperti",
  "ini",
  "itu",
  "mohon",
  "diproses",
  "dikirim",
  "dan",
  "untuk",
  "dengan",
  "besok",
  "hari",
  "tanggal",
  "tgl",
  "jam",
  "pukul",
  "agar",
  "supaya",
  "segera",
]);

function extractOutletFromMessage(line: string): string | null {
  const match = line.match(
    /(?:kirim(?:kan)?|antar(?:kan)?|dikirim|diantar|tujuan|alamat\s+pengiriman)\s+ke\s+(.+)$/i
  );
  if (!match) return null;

  const raw = match[1].trim();
  const words = raw.split(/\s+/);
  const collected: string[] = [];

  for (const word of words) {
    const cleaned = word.replace(/^[|,;:]+|[.,;:]+$/g, "");
    if (!cleaned) break;
    const lower = cleaned.toLowerCase();
    if (OUTLET_STOPWORDS.has(lower)) break;

    if (collected.length > 0) {
      const previous = collected[0];
      const previousIsCaps =
        /[A-Z]/.test(previous) && previous === previous.toUpperCase();
      const currentIsCaps =
        /[A-Z]/.test(cleaned) && cleaned === cleaned.toUpperCase();

      // For ALL-CAPS outlets take the uppercase run; for mixed/title case
      // take words until a stopword or a lowercase word.
      if (previousIsCaps && !currentIsCaps) break;
      if (!previousIsCaps && /^[a-z]/.test(cleaned)) break;
    }

    collected.push(cleaned);
    if (collected.length >= 5) break;
  }

  const name = cleanOutletName(collected.join(" "));
  return name || null;
}

function extractGenericProductLine(rawLine: string): SuratJalanItem | null {
  const line = rawLine.trim();
  const bullet = /^[-–—•*]\s*/.test(line);
  const content = line.replace(/^[-–—•*]\s*/, "").trim();
  if (!content) return null;

  const colonIndex = content.lastIndexOf(":");
  let namePart = "";
  let qtyPart = "";

  if (colonIndex > 0) {
    namePart = content.slice(0, colonIndex);
    qtyPart = content.slice(colonIndex + 1);
  } else {
    // Without a colon only accept bullet lines, e.g. "- Timun 2 kg".
    if (!bullet) return null;
    const match = content.match(
      /^(.*?)\s*(-?\d+(?:[.,]\d+)?)\s*(?:kg|kgs?|kilogram)?\s*$/i
    );
    if (!match) return null;
    namePart = match[1];
    qtyPart = match[2];
  }

  const qty = firstNumber(qtyPart);
  if (qty === null || qty <= 0) return null;

  const name = prettifyProductName(namePart);
  if (!name || !/[A-Za-z]/.test(name)) return null;
  if (
    /^(no|nomor|total|jumlah|qty|tanggal|tgl|outlet|cabang|kepada|alamat)\b/i.test(
      name
    )
  ) {
    return null;
  }

  return { no: 1, namaBarang: name, qty };
}

function prettifyProductName(value: string): string {
  const cleaned = (value || "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/[|,;]+$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (!cleaned) return "";

  // Convert ALL CAPS names to Title Case for a consistent PDF look.
  if (cleaned === cleaned.toUpperCase()) {
    return cleaned
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  return cleaned;
}

function parseDateCell(raw: string): string | null {
  const value = (raw || "").trim().replace(/^[|,\s]+|[|,\s]+$/g, "");
  if (!value) return null;

  const textMatch = value.match(
    /^(\d{1,2})\s+([A-Za-z]+)(?:\s+(\d{2,4}))?$/
  );
  if (textMatch) {
    const monthIndex = MONTH_ALIASES[textMatch[2].toLowerCase()];
    if (monthIndex === undefined) return null;
    let year = textMatch[3]
      ? Number(textMatch[3])
      : new Date().getFullYear();
    if (year < 100) year += 2000;
    return `${Number(textMatch[1])} ${MONTH_NAMES[monthIndex]} ${year}`;
  }

  const numericMatch = value.match(
    /^(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?$/
  );
  if (numericMatch) {
    const day = Number(numericMatch[1]);
    const month = Number(numericMatch[2]);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    let year = numericMatch[3]
      ? Number(numericMatch[3])
      : new Date().getFullYear();
    if (year < 100) year += 2000;
    return `${day} ${MONTH_NAMES[month - 1]} ${year}`;
  }

  const isoMatch = value.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return `${day} ${MONTH_NAMES[month - 1]} ${year}`;
  }

  return null;
}

function matchProduct(cell: string): string | null {
  const normalized = (cell || "").trim().toLowerCase();
  if (!normalized) return null;

  const sorted = [...PRODUCT_COLUMNS].sort((a, b) => b.length - a.length);
  for (const product of sorted) {
    const name = product.toLowerCase();
    if (normalized === name || normalized.includes(name)) {
      return product;
    }
  }

  // Common shorthand / OCR variants
  const aliases: Record<string, string> = {
    ceciwis: "Ceciwis",
    timun: "Timun",
    seledri: "Seledri",
    jukut: "Jukut",
    kangkung: "Kangkung",
    "bawang merah": "Bawang Merah Kupas",
    "bawang putih kating": "Bawang Putih Kating",
    "bawang putih kupas": "Bawang Putih Kupas",
    "cabai rawit": "Cabai Rawit Hijau",
    "cabe rawit": "Cabai Rawit Hijau",
  };
  for (const [alias, product] of Object.entries(aliases)) {
    if (normalized.includes(alias)) return product;
  }

  return null;
}

function parseQtyFromCell(cell: string): number {
  return firstNumber(cell) ?? 0;
}

function firstNumber(value: string): number | null {
  const match = (value || "").match(/-?\d+(?:[.,]\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0].replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function isNumericCell(value: string): boolean {
  const cleaned = (value || "")
    .trim()
    .replace(/\s*(kg|kgs|kilogram)\s*$/i, "")
    .replace(/[.,]$/, "");
  return /^-?\d+(?:[.,]\d+)?$/.test(cleaned);
}

function cleanOutletName(value: string): string {
  return (value || "")
    .replace(/^\s*(outlet|cabang|toko|kepada|nama|penerima)\s*[:\-]\s*/i, "")
    .replace(/[|,;\t]+$/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s*\|\s*/g, " ")
    .trim();
}

function todayAsIndonesian(): string {
  const today = new Date();
  return `${today.getDate()} ${
    MONTH_NAMES[today.getMonth()]
  } ${today.getFullYear()}`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
