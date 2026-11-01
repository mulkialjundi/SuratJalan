"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ClipboardType,
  Sparkles,
  ScanText,
  Eraser,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { parseTextInput, SAMPLE_TEXT_PO } from "@/lib/text-parser";
import type { SuratJalanData } from "@/lib/types";
import { toast } from "@/components/ui/use-toast";

interface TextUploaderProps {
  onDataExtracted: (list: SuratJalanData[]) => void;
}

export function TextUploader({ onDataExtracted }: TextUploaderProps) {
  const [text, setText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const preview = useMemo(() => {
    if (!text.trim()) return null;
    try {
      return parseTextInput(text);
    } catch {
      return null;
    }
  }, [text]);

  const handleScan = () => {
    if (!text.trim()) {
      toast({
        title: "Teks masih kosong",
        description: "Tempelkan data PO terlebih dahulu, lalu klik Scan Teks.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const result = parseTextInput(text);

      if (!result || result.length === 0) {
        toast({
          title: "Tidak ada data pesanan ditemukan",
          description:
            "Pastikan teks memuat tanggal, nama outlet, dan minimal 1 nama barang dengan QTY.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Teks PO Berhasil Diproses!",
        description: `Ditemukan ${result.length} outlet aktif. Setiap outlet akan dicetak pada 1 halaman A4 penuh.`,
      });

      onDataExtracted(result);
    } catch (error) {
      console.error("Error parsing PO text:", error);
      toast({
        title: "Gagal memproses teks",
        description: "Terjadi kesalahan saat membaca teks PO.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card className="shadow-lg border-emerald-100">
        <CardHeader className="text-center pb-2">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-2 text-emerald-600 shadow-sm border border-emerald-100">
            <ClipboardType className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-800">
            Scan Teks PO (Purchase Order)
          </CardTitle>
          <CardDescription className="text-slate-500 max-w-lg mx-auto">
            Tempel teks PO dari WhatsApp/Excel/catatan, lalu sistem membaca
            otomatis seluruh outlet & barangnya. Output PDF{" "}
            <strong>1 outlet per halaman A4</strong>.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          <div className="relative">
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              disabled={isProcessing}
              spellCheck={false}
              placeholder={`Tempel teks PO di sini...\n\nContoh format PO pengiriman:\nPO Pengiriman SENIN Tgl 2/11\n- BAWANG BOMBAY (1000 GRM) (4.0) : 1.5 kg\n- CABAI RAWIT MERAH BERSIH (1000 GRM) (4.0) : 66 kg\n- NANAS (1000 GRM) (4.0) KUPAS : 9 kg\n\nMohon diproses kirim ke CK DEPOK`}
              className="w-full min-h-[300px] max-h-[520px] resize-y rounded-2xl border border-slate-200 bg-slate-50/40 p-4 font-mono text-xs leading-relaxed text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 disabled:opacity-60"
            />
            {text && (
              <div className="absolute bottom-3 right-3 text-[10px] font-medium text-slate-400 bg-white/90 border border-slate-200 rounded-full px-2.5 py-1">
                {text.split("\n").length} baris
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setText(SAMPLE_TEXT_PO)}
                disabled={isProcessing}
                className="text-xs text-slate-600 hover:text-emerald-700 border-slate-200"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
                Isi Data Contoh
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setText("")}
                disabled={isProcessing || !text}
                className="text-xs text-slate-500"
              >
                <Eraser className="h-3.5 w-3.5 mr-1.5" />
                Kosongkan
              </Button>
            </div>

            <div className="flex items-center gap-3">
              {preview && preview.length > 0 && (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1.5 rounded-full whitespace-nowrap">
                  {preview.length} outlet terdeteksi
                </span>
              )}
              <Button
                size="sm"
                onClick={handleScan}
                disabled={isProcessing}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm text-xs h-9 px-4"
              >
                {isProcessing ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <ScanText className="h-3.5 w-3.5 mr-1.5" />
                )}
                Scan Teks & Lanjut
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-emerald-100 bg-gradient-to-r from-emerald-50/80 via-teal-50/50 to-white shadow-sm">
        <CardContent className="pt-5 pb-5">
          <div className="flex gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-slate-600 space-y-1">
              <p className="font-semibold text-slate-800">
                Format Teks yang Didukung:
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                <li>
                  <strong>Format PO pengiriman:</strong> baris{" "}
                  <code className="bg-slate-100 px-1 rounded">
                    PO Pengiriman ... Tgl 2/11
                  </code>
                  , daftar barang{" "}
                  <code className="bg-slate-100 px-1 rounded">
                    - NAMA BARANG (...) : 1.5 kg
                  </code>
                  , lalu{" "}
                  <code className="bg-slate-100 px-1 rounded">
                    kirim ke CK DEPOK
                  </code>
                  .
                </li>
                <li>
                  <strong>Tabel (tab atau pipe |):</strong> baris header berisi
                  nama produk, lalu baris data berisi tanggal, outlet, dan QTY.
                </li>
                <li>
                  <strong>Baris ringkas:</strong> tanggal + nama outlet +
                  deretan angka sesuai urutan kolom produk.
                </li>
                <li>
                  <strong>Blok per outlet:</strong> baris{" "}
                  <code className="bg-slate-100 px-1 rounded">Outlet:</code>,{" "}
                  <code className="bg-slate-100 px-1 rounded">Tanggal:</code>,
                  lalu nama barang beserta QTY.
                </li>
                <li>
                  Nama barang bebas (tidak harus produk tetap) dan desimal boleh
                  memakai koma atau titik (contoh:{" "}
                  <code className="bg-slate-100 px-1 rounded">0,5</code> /{" "}
                  <code className="bg-slate-100 px-1 rounded">1.5</code>).
                </li>
              </ul>
              <p className="pt-1 text-emerald-700 font-medium">
                Output: 1 outlet = 1 halaman A4 penuh, format surat jalan sama
                seperti sebelumnya.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
