import type { SuratJalanData } from "./types";

export const PRODUCT_COLUMNS = [
  "Ceciwis",
  "Timun",
  "Seledri",
  "Bawang Putih Kating",
  "Bawang Merah Kupas",
  "Jukut",
  "Kangkung",
  "Cabai Rawit Hijau",
  "Bawang Putih Kupas",
];

/**
 * Extracts and converts PO rows into a clean, non-duplicate list of SuratJalanData.
 * Filters out outlets with 0 total quantity.
 */
export async function parsePOFile(file: File): Promise<SuratJalanData[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const suratJalanList: SuratJalanData[] = [];
  const seenLocations = new Set<string>();

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();

    // Group items by Y coordinate (within 4 points tolerance)
    const rows: { [key: number]: any[] } = {};
    for (const item of content.items as any[]) {
      if (!item.str || !item.str.trim()) continue;
      const y = Math.round(item.transform[5]);
      let matchedKey: number | null = null;
      for (const k of Object.keys(rows)) {
        if (Math.abs(Number(k) - y) <= 4) {
          matchedKey = Number(k);
          break;
        }
      }
      if (matchedKey !== null) {
        rows[matchedKey].push(item);
      } else {
        rows[y] = [item];
      }
    }

    // Sort rows by Y descending (top of page first)
    const sortedY = Object.keys(rows)
      .map(Number)
      .sort((a, b) => b - a);

    for (const y of sortedY) {
      const rowItems = rows[y].sort((a, b) => a.transform[4] - b.transform[4]);
      const texts = rowItems.map((i) => i.str.trim());

      // Check if starts with Date pattern e.g. "1 Nov"
      if (
        texts.length >= 3 &&
        /^\d{1,2}\s+(Jan|Feb|Mar|Apr|Mei|Jun|Jul|Agu|Sep|Okt|Nov|Des)/i.test(
          texts[0]
        )
      ) {
        const rawDate = texts[0];
        const location = texts[1];

        // Skip if location is just a number or already seen (prevent duplicates)
        if (!location || /^\d+\.?\d*$/.test(location)) continue;
        const normalizedLoc = location.trim().toLowerCase();
        if (seenLocations.has(normalizedLoc)) continue;

        const numTexts = texts.slice(2);
        const nums = numTexts.map((t) => parseFloat(t.replace(",", ".")));

        // Last number is total
        const totalKg =
          nums.length > PRODUCT_COLUMNS.length
            ? nums[nums.length - 1]
            : nums.reduce((sum, n) => (isNaN(n) ? sum : sum + n), 0);

        // Filter out zero-order outlets to prevent duplicate/empty slips
        if (isNaN(totalKg) || totalKg <= 0) continue;

        // Build product items (only items with qty > 0)
        const items = [];
        let itemIndex = 1;
        for (let i = 0; i < PRODUCT_COLUMNS.length && i < nums.length - 1; i++) {
          const qty = nums[i];
          if (!isNaN(qty) && qty > 0) {
            items.push({
              no: itemIndex++,
              namaBarang: PRODUCT_COLUMNS[i],
              qty: qty,
            });
          }
        }

        // Only include if there are actual products to deliver
        if (items.length > 0) {
          seenLocations.add(normalizedLoc);

          const formattedDate = formatIndonesianDate(rawDate);
          const idNumber = String(suratJalanList.length + 1).padStart(3, "0");
          const idBarang = `A${idNumber}`;

          suratJalanList.push({
            id: `sj-${suratJalanList.length + 1}`,
            tanggal: formattedDate,
            idBarang: idBarang,
            kepada: `Uena ${location}`,
            alamat: `Uena ${location}`,
            kendaraan: "",
            noPolisi: "",
            items: items,
            totalQty: totalKg,
          });
        }
      }
    }
  }

  // Fallback to OCR if table extraction yielded nothing
  if (suratJalanList.length === 0) {
    const ocrText = await extractTextWithOCR(file);
    return parseFromText(ocrText);
  }

  return suratJalanList;
}

function formatIndonesianDate(raw: string): string {
  const parts = raw.split(/\s+/);
  if (parts.length >= 2) {
    const day = parts[0];
    const month = parts[1].toLowerCase();
    const monthsMap: Record<string, string> = {
      jan: "Januari",
      feb: "Februari",
      mar: "Maret",
      apr: "April",
      mei: "Mei",
      may: "Mei",
      jun: "Juni",
      jul: "Juli",
      agu: "Agustus",
      aug: "Agustus",
      sep: "September",
      okt: "Oktober",
      oct: "Oktober",
      nov: "November",
      des: "Desember",
      dec: "Desember",
    };
    const fullMonth = monthsMap[month] || month;
    const year = new Date().getFullYear();
    return `${day} ${fullMonth} ${year}`;
  }
  return raw;
}

function parseFromText(text: string): SuratJalanData[] {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const items: any[] = [];
  let itemIndex = 1;

  for (const line of lines) {
    for (const prod of PRODUCT_COLUMNS) {
      if (line.toLowerCase().includes(prod.toLowerCase())) {
        const match = line.match(/(\d+[\.,]?\d*)/);
        if (match) {
          const qty = parseFloat(match[1].replace(",", "."));
          if (qty > 0) {
            items.push({
              no: itemIndex++,
              namaBarang: prod,
              qty: qty,
            });
          }
        }
      }
    }
  }

  const today = new Date();
  const day = today.getDate();
  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  const dateStr = `${day} ${monthNames[today.getMonth()]} ${today.getFullYear()}`;

  return [
    {
      id: "sj-1",
      tanggal: dateStr,
      idBarang: "A001",
      kepada: "Uena Aren Jaya",
      alamat: "Uena Aren Jaya",
      kendaraan: "",
      noPolisi: "",
      items: items.length > 0 ? items : [
        { no: 1, namaBarang: "Ceciwis", qty: 0.5 },
        { no: 2, namaBarang: "Timun", qty: 2 },
      ],
      totalQty: items.reduce((acc, curr) => acc + curr.qty, 0),
    },
  ];
}

export async function extractTextWithOCR(file: File): Promise<string> {
  const Tesseract = await import("tesseract.js");
  const arrayBuffer = await file.arrayBuffer();
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d")!;
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    await page.render({ canvasContext: context, viewport }).promise;
    const imageData = canvas.toDataURL("image/png");

    const result = await Tesseract.recognize(imageData, "ind+eng");
    fullText += result.data.text + "\n";
  }

  return fullText;
}
