"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, Loader2, Sparkles, CheckCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { parsePOFile } from "@/lib/pdf-extractor";
import type { SuratJalanData } from "@/lib/types";
import { toast } from "@/components/ui/use-toast";

interface PdfUploaderProps {
  onDataExtracted: (list: SuratJalanData[]) => void;
}

export function PdfUploader({ onDataExtracted }: PdfUploaderProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      if (file.type !== "application/pdf") {
        toast({
          title: "Format file salah",
          description: "Mohon unggah file dengan format PDF.",
          variant: "destructive",
        });
        return;
      }

      setFileName(file.name);
      setIsProcessing(true);

      try {
        setProcessingStatus("Membaca dan memproses tabel PO...");
        const result = await parsePOFile(file);

        if (!result || result.length === 0) {
          toast({
            title: "Tidak ada data pesanan ditemukan",
            description: "Pastikan file PDF adalah dokumen PO yang memiliki data pesanan.",
            variant: "destructive",
          });
          setIsProcessing(false);
          return;
        }

        const totalPages = Math.ceil(result.length / 2);
        toast({
          title: "PO Berhasil Diproses!",
          description: `Ditemukan ${result.length} cabang aktif (${totalPages} halaman A4, 2 alamat per halaman tanpa duplikat).`,
        });

        onDataExtracted(result);
      } catch (error) {
        console.error("Error processing PO PDF:", error);
        toast({
          title: "Gagal memproses PDF",
          description: "Terjadi kesalahan saat memproses file. Silakan coba lagi.",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
        setProcessingStatus("");
      }
    },
    [onDataExtracted]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    disabled: isProcessing,
  });

  const handleSampleData = () => {
    const sampleList: SuratJalanData[] = [
      {
        id: "sj-1",
        tanggal: "1 November 2026",
        idBarang: "A001",
        kepada: "Uena Aren Jaya",
        alamat: "Uena Aren Jaya",
        kendaraan: "",
        noPolisi: "",
        items: [
          { no: 1, namaBarang: "Ceciwis", qty: 0.5 },
          { no: 2, namaBarang: "Timun", qty: 2 },
          { no: 3, namaBarang: "Bawang Merah Kupas", qty: 0.5 },
          { no: 4, namaBarang: "Jukut", qty: 4 },
          { no: 5, namaBarang: "Kangkung", qty: 2 },
          { no: 6, namaBarang: "Cabai Rawit Hijau", qty: 0.5 },
          { no: 7, namaBarang: "Bawang Putih Kupas", qty: 0.5 },
        ],
        totalQty: 10,
      },
      {
        id: "sj-2",
        tanggal: "1 November 2026",
        idBarang: "A002",
        kepada: "Uena Bojong Nangka",
        alamat: "Uena Bojong Nangka",
        kendaraan: "",
        noPolisi: "",
        items: [
          { no: 1, namaBarang: "Ceciwis", qty: 1.5 },
          { no: 2, namaBarang: "Timun", qty: 3 },
          { no: 3, namaBarang: "Seledri", qty: 0.5 },
          { no: 4, namaBarang: "Bawang Merah Kupas", qty: 0.5 },
          { no: 5, namaBarang: "Jukut", qty: 6 },
          { no: 6, namaBarang: "Kangkung", qty: 3 },
          { no: 7, namaBarang: "Bawang Putih Kupas", qty: 0.5 },
        ],
        totalQty: 15,
      },
      {
        id: "sj-3",
        tanggal: "1 November 2026",
        idBarang: "A003",
        kepada: "Uena Cagar Alam",
        alamat: "Uena Cagar Alam",
        kendaraan: "",
        noPolisi: "",
        items: [
          { no: 1, namaBarang: "Timun", qty: 2 },
          { no: 2, namaBarang: "Bawang Merah Kupas", qty: 0.5 },
          { no: 3, namaBarang: "Jukut", qty: 5 },
          { no: 4, namaBarang: "Kangkung", qty: 2 },
          { no: 5, namaBarang: "Cabai Rawit Hijau", qty: 0.5 },
        ],
        totalQty: 10,
      },
      {
        id: "sj-4",
        tanggal: "1 November 2026",
        idBarang: "A004",
        kepada: "Uena Cakung Timur",
        alamat: "Uena Cakung Timur",
        kendaraan: "",
        noPolisi: "",
        items: [
          { no: 1, namaBarang: "Ceciwis", qty: 0.5 },
          { no: 2, namaBarang: "Timun", qty: 1 },
          { no: 3, namaBarang: "Jukut", qty: 6 },
          { no: 4, namaBarang: "Kangkung", qty: 2 },
          { no: 5, namaBarang: "Cabai Rawit Hijau", qty: 0.5 },
          { no: 6, namaBarang: "Bawang Putih Kupas", qty: 0.5 },
        ],
        totalQty: 11,
      },
    ];
    onDataExtracted(sampleList);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="shadow-lg border-emerald-100">
        <CardHeader className="text-center pb-2">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-2 text-emerald-600 shadow-sm border border-emerald-100">
            <Upload className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-800">
            Upload PDF PO (Purchase Order)
          </CardTitle>
          <CardDescription className="text-slate-500 max-w-md mx-auto">
            1 kali upload langsung menghasilkan <strong>1 file PDF lengkap</strong> yang
            memuat seluruh cabang. <strong>1 halaman A4 berisi 2 alamat</strong> tanpa duplikat.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
              isDragActive
                ? "border-emerald-500 bg-emerald-50/50 scale-[1.01]"
                : isProcessing
                ? "border-amber-400 bg-amber-50/50"
                : "border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/20"
            }`}
          >
            <input {...getInputProps()} />

            {isProcessing ? (
              <div className="space-y-4 py-4">
                <Loader2 className="h-12 w-12 mx-auto text-emerald-600 animate-spin" />
                <div>
                  <p className="text-lg font-semibold text-slate-800">
                    Memproses Dokumen PO...
                  </p>
                  <p className="text-sm text-slate-500 mt-1">{processingStatus}</p>
                  {fileName && (
                    <p className="text-xs text-emerald-700 font-medium mt-2 bg-emerald-100/60 inline-block px-3 py-1 rounded-full">
                      {fileName}
                    </p>
                  )}
                </div>
              </div>
            ) : isDragActive ? (
              <div className="space-y-4 py-6">
                <FileText className="h-14 w-14 mx-auto text-emerald-600 animate-bounce" />
                <p className="text-lg font-medium text-emerald-700">
                  Lepaskan file PDF di sini...
                </p>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                <div className="flex justify-center">
                  <div className="bg-emerald-100/60 text-emerald-600 rounded-2xl p-4">
                    <FileText className="h-8 w-8" />
                  </div>
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-800">
                    Seret & lepaskan file PDF PO di sini
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    atau klik untuk memilih file dari komputer
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 font-medium">
                  <Sparkles className="h-3.5 w-3.5" />
                  1 File PDF • 2 Alamat per Halaman A4 • Bebas Duplikat
                </div>
              </div>
            )}
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
                Spesifikasi Output:
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                <li>
                  <strong>1 File PDF Tunggal:</strong> Mengumpulkan semua surat jalan dalam satu unduhan.
                </li>
                <li>
                  <strong>2 Alamat per Halaman A4:</strong> Bagian atas Cabang A, bagian bawah Cabang B (ada garis potong di tengah).
                </li>
                <li>
                  <strong>Tanpa Duplikasi:</strong> Tiap pesanan cabang hanya dicetak 1 kali dan cabang dengan pesanan 0 kg dilewati secara otomatis.
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Demo Button */}
      <div className="text-center pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSampleData}
          className="text-xs text-slate-600 hover:text-emerald-700 border-slate-200"
        >
          <Sparkles className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
          Uji Coba dengan Data Contoh (4 Cabang / 2 Halaman A4)
        </Button>
      </div>
    </div>
  );
}
