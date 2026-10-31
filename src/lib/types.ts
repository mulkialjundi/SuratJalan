export interface SuratJalanItem {
  no: number;
  namaBarang: string;
  qty: number;
}

export interface SuratJalanData {
  id: string; // Unique identifier for selection
  tanggal: string; // e.g. "1 November 2026" or "29 Oktober 2026"
  idBarang: string; // e.g. "A029"
  kepada: string; // e.g. "Uena Aren Jaya"
  alamat: string; // e.g. "Uena Aren Jaya"
  kendaraan: string; // default empty or "Mobil Box"
  noPolisi: string; // default empty
  items: SuratJalanItem[];
  totalQty?: number;
}

export interface OutletOrder {
  id: string;
  location: string;
  date: string;
  items: { namaBarang: string; qty: number }[];
  totalKg: number;
}
