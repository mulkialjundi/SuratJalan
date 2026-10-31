import jsPDF from "jspdf";
import type { SuratJalanData } from "./types";
import { LOGO_BASE64 } from "./logo-base64";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const HALF_HEIGHT = PAGE_HEIGHT / 2; // 420.945 pt

/**
 * Filters and sanitizes the outlet data:
 * - Removes any items with qty <= 0 or empty name
 * - Completely removes any outlets that have 0 items (tidak ada item tidak perlu ada di PDF)
 */
export function getValidOutlets(dataList: SuratJalanData[]): SuratJalanData[] {
  return dataList
    .map((data) => {
      const activeItems = (data.items || [])
        .filter(
          (item) =>
            item.namaBarang &&
            item.namaBarang.trim() &&
            !isNaN(Number(item.qty)) &&
            Number(item.qty) > 0
        )
        .map((item, idx) => ({
          ...item,
          no: idx + 1,
          qty: Number(item.qty),
        }));

      const totalWeight = activeItems.reduce((sum, it) => sum + it.qty, 0);

      return {
        ...data,
        items: activeItems,
        totalQty: totalWeight,
      };
    })
    .filter((data) => data.items.length > 0 && (data.totalQty || 0) > 0);
}

/**
 * Generates ONE unified PDF file containing ALL valid outlets.
 * Exactly 2 distinct addresses/outlets per A4 page (top half & bottom half).
 * Outlets with no items are completely excluded!
 */
export function generateCombinedPDF(dataList: SuratJalanData[]): jsPDF {
  const validOutlets = getValidOutlets(dataList);

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  if (validOutlets.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(
      "Tidak ada data cabang dengan item pesanan (QTY > 0).",
      40,
      100
    );
    return doc;
  }

  for (let i = 0; i < validOutlets.length; i += 2) {
    if (i > 0) {
      doc.addPage("a4", "portrait");
    }

    const outlet1 = validOutlets[i];
    const outlet2 = validOutlets[i + 1]; // undefined if odd total

    // 1. Render Top Half: Outlet 1
    renderSingleSuratJalan(doc, outlet1, 0);

    // 2. If there is a second outlet on this page, draw cut line & render bottom half
    if (outlet2) {
      // Middle cut line
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.5);
      doc.setLineDashPattern([3, 3], 0);
      doc.line(30, HALF_HEIGHT, PAGE_WIDTH - 30, HALF_HEIGHT);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(140, 140, 140);
      doc.text("- - potong di sini - -", PAGE_WIDTH / 2, HALF_HEIGHT - 4, {
        align: "center",
      });
      doc.setLineDashPattern([], 0); // reset dash pattern

      // Render Bottom Half: Outlet 2
      renderSingleSuratJalan(doc, outlet2, HALF_HEIGHT);
    }
  }

  return doc;
}

/**
 * Renders a single Surat Jalan slip in half of an A4 page (height: ~420 pt)
 */
function renderSingleSuratJalan(
  doc: jsPDF,
  data: SuratJalanData,
  offsetY: number
) {
  const leftMargin = 32;
  const rightMargin = PAGE_WIDTH - 32;

  // 1. Header: Logo & Company Info
  const headerTop = offsetY + 28;

  // Logo
  try {
    if (LOGO_BASE64) {
      doc.addImage(LOGO_BASE64, "PNG", leftMargin, headerTop, 46, 38);
    }
  } catch (e) {
    console.error("Logo render error:", e);
  }

  // Company Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(17, 24, 39);
  doc.text("Alam Cabe Barokah", 86, headerTop + 13);

  // Subtitle
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(5, 150, 105); // emerald green
  doc.text("DISTRIBUTOR SAYUR & BUMBU SEGAR", 86, headerTop + 22);

  // Address
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Jl. Masjid Gedong 1 No. 29A RT 06/RW 01", 86, headerTop + 30);
  doc.text("Kel. Kramat Jati, Kec. Kramat Jati 13510", 86, headerTop + 38);

  // Title: SURAT JALAN
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text("SURAT JALAN", rightMargin, headerTop + 14, { align: "right" });

  // Date | ID Barang
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  const metaText = `${data.tanggal}   |   ID Barang: ${data.idBarang}`;
  doc.text(metaText, rightMargin, headerTop + 27, { align: "right" });

  // 2. Info Bar (KEPADA, ALAMAT, KENDARAAN, NO. POLISI)
  const infoTop = headerTop + 52;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.7);
  doc.line(leftMargin, infoTop - 5, rightMargin, infoTop - 5);

  // Left column: KEPADA & ALAMAT
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("KEPADA", leftMargin, infoTop + 6);
  doc.text("ALAMAT", leftMargin, infoTop + 19);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(data.kepada || "-", leftMargin + 50, infoTop + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(data.alamat || "-", leftMargin + 50, infoTop + 19);

  // Right column: KENDARAAN & NO. POLISI
  const rightColX = 350;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("KENDARAAN", rightColX, infoTop + 6);
  doc.text("NO. POLISI", rightColX, infoTop + 19);

  // Dotted lines for vehicle & plate
  doc.setDrawColor(203, 213, 225);
  doc.setLineDashPattern([1.5, 2], 0);
  doc.line(rightColX + 58, infoTop + 6, rightMargin, infoTop + 6);
  doc.line(rightColX + 58, infoTop + 19, rightMargin, infoTop + 19);
  doc.setLineDashPattern([], 0);

  if (data.kendaraan) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(data.kendaraan, rightColX + 60, infoTop + 5);
  }
  if (data.noPolisi) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(data.noPolisi, rightColX + 60, infoTop + 18);
  }

  // 3. Table Header
  const tableTop = infoTop + 32;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.8);
  doc.line(leftMargin, tableTop, rightMargin, tableTop);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text("NO", leftMargin + 10, tableTop + 11);
  doc.text("NAMA BARANG", leftMargin + 42, tableTop + 11);
  doc.text("QTY", rightMargin - 15, tableTop + 11, { align: "right" });

  doc.line(leftMargin, tableTop + 16, rightMargin, tableTop + 16);

  // 4. Table Rows (Only items with QTY > 0)
  let currentY = tableTop + 28;
  const rowHeight = 16;

  data.items.forEach((item, idx) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    const noStr = String(item.no || idx + 1).padStart(2, "0");
    doc.text(noStr, leftMargin + 10, currentY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(item.namaBarang, leftMargin + 42, currentY);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    const qtyStr = formatQty(item.qty);
    doc.text(qtyStr, rightMargin - 15, currentY, { align: "right" });

    currentY += rowHeight;
  });

  // Total Row
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.8);
  doc.line(leftMargin, currentY - 4, rightMargin, currentY - 4);

  const totalQty =
    data.totalQty ?? data.items.reduce((sum, item) => sum + item.qty, 0);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("TOTAL", rightMargin - 75, currentY + 7);
  doc.text(formatQty(totalQty), rightMargin - 15, currentY + 7, {
    align: "right",
  });

  doc.line(leftMargin, currentY + 12, rightMargin, currentY + 12);

  // 5. Signatures Section
  const sigTop = currentY + 26;
  const col1X = leftMargin + 50;
  const col2X = PAGE_WIDTH / 2;
  const col3X = rightMargin - 50;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text("Pengirim", col1X, sigTop, { align: "center" });
  doc.text("Driver", col2X, sigTop, { align: "center" });
  doc.text("Penerima", col3X, sigTop, { align: "center" });

  // Signature dotted lines
  const sigLineY = sigTop + 40;
  doc.setDrawColor(203, 213, 225);
  doc.setLineDashPattern([1.5, 2], 0);
  doc.line(col1X - 45, sigLineY, col1X + 45, sigLineY);
  doc.line(col2X - 45, sigLineY, col2X + 45, sigLineY);
  doc.line(col3X - 45, sigLineY, col3X + 45, sigLineY);
  doc.setLineDashPattern([], 0);

  // Names under signature
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text("Alam Cabe Barokah", col1X, sigLineY + 9, { align: "center" });
  doc.text("Nama jelas", col2X, sigLineY + 9, { align: "center" });

  const receiverShort = data.kepada.startsWith("Uena") ? "Uena" : data.kepada;
  doc.text(receiverShort, col3X, sigLineY + 9, { align: "center" });

  // Footer Note
  doc.setFont("helvetica", "italic");
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    "Barang diterima dalam kondisi baik dan jumlah sesuai surat jalan",
    PAGE_WIDTH / 2,
    sigLineY + 22,
    { align: "center" }
  );
}

function formatQty(val: number): string {
  if (val === undefined || val === null || isNaN(val)) return "0";
  if (Number.isInteger(val)) {
    return String(val);
  }
  return val.toString().replace(".", ",");
}

/**
 * Generates filename in format: SJ-DDMMYY.pdf (e.g. SJ-011126.pdf)
 */
export function getSJFilename(dataList: SuratJalanData[]): string {
  const firstDate = dataList[0]?.tanggal;
  if (firstDate) {
    const formatted = parseDateToDDMMYY(firstDate);
    if (formatted) {
      return `SJ-${formatted}.pdf`;
    }
  }

  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yy = String(now.getFullYear()).slice(-2);
  return `SJ-${dd}${mm}${yy}.pdf`;
}

function parseDateToDDMMYY(str: string): string | null {
  if (!str) return null;
  const monthMap: Record<string, string> = {
    jan: "01", januari: "01", january: "01",
    feb: "02", februari: "02", february: "02",
    mar: "03", maret: "03", march: "03",
    apr: "04", april: "04",
    mei: "05", may: "05",
    jun: "06", juni: "06", june: "06",
    jul: "07", juli: "07", july: "07",
    agu: "08", agustus: "08", aug: "08", august: "08",
    sep: "09", september: "09",
    okt: "10", oktober: "10", oct: "10", october: "10",
    nov: "11", november: "11",
    des: "12", desember: "12", dec: "12", december: "12",
  };

  const textMatch = str.match(/(\d{1,2})\s+([a-zA-Z]+)(?:\s+(\d{2,4}))?/);
  if (textMatch) {
    const day = textMatch[1].padStart(2, "0");
    const mStr = textMatch[2].toLowerCase();
    const month = monthMap[mStr];
    let year = textMatch[3];
    if (!year) {
      year = String(new Date().getFullYear());
    }
    const yy = year.slice(-2);
    if (month) return `${day}${month}${yy}`;
  }

  const isoMatch = str.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
  if (isoMatch) {
    const yy = isoMatch[1].slice(-2);
    const mm = isoMatch[2].padStart(2, "0");
    const dd = isoMatch[3].padStart(2, "0");
    return `${dd}${mm}${yy}`;
  }

  const dmyMatch = str.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})/);
  if (dmyMatch) {
    const dd = dmyMatch[1].padStart(2, "0");
    const mm = dmyMatch[2].padStart(2, "0");
    const yy = dmyMatch[3].slice(-2);
    return `${dd}${mm}${yy}`;
  }

  return null;
}

/**
 * Downloads the single unified PDF containing ALL valid outlets (2 distinct addresses per page).
 * Formats name as SJ-DDMMYY.pdf (e.g. SJ-011126.pdf)
 */
export function downloadCombinedPDF(
  dataList: SuratJalanData[],
  filename?: string
): string {
  const validList = getValidOutlets(dataList);
  const doc = generateCombinedPDF(validList);
  const name = filename || getSJFilename(validList);
  doc.save(name);
  return name;
}

/**
 * Generates a data URL for multi-page live preview
 */
export function getCombinedPDFPreviewURL(dataList: SuratJalanData[]): string {
  const validList = getValidOutlets(dataList);
  const doc = generateCombinedPDF(validList);
  return doc.output("dataurlstring");
}
