"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Download,
  Printer,
  RotateCcw,
  CheckCircle2,
  Loader2,
  FileText,
  Sparkles,
} from "lucide-react";
import type { SuratJalanData } from "@/lib/types";
import {
  downloadCombinedPDF,
  getCombinedPDFPreviewURL,
  getSJFilename,
} from "@/lib/pdf-generator";
import { toast } from "@/components/ui/use-toast";

interface SuratJalanPreviewProps {
  suratJalanList: SuratJalanData[];
  onReset: () => void;
  onBack: () => void;
}

export function SuratJalanPreview({
  suratJalanList,
  onReset,
  onBack,
}: SuratJalanPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);

  const totalPages = Math.ceil(suratJalanList.length / 2);
  const fileName = getSJFilename(suratJalanList);

  useEffect(() => {
    if (!suratJalanList || suratJalanList.length === 0) return;
    setIsGenerating(true);
    const timer = setTimeout(() => {
      try {
        const url = getCombinedPDFPreviewURL(suratJalanList);
        setPreviewUrl(url);
      } catch (err) {
        console.error("Preview generation error:", err);
        toast({
          title: "Gagal memuat preview",
          description: "Terjadi kesalahan saat menyusun dokumen PDF.",
          variant: "destructive",
        });
      } finally {
        setIsGenerating(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [suratJalanList]);

  const handleDownloadAll = () => {
    try {
      const savedName = downloadCombinedPDF(suratJalanList);
      toast({
        title: "PDF Berhasil Diunduh!",
        description: `File "${savedName}" berisi seluruh ${suratJalanList.length} cabang (${totalPages} halaman A4) telah disimpan.`,
      });
    } catch (e) {
      console.error(e);
      toast({
        title: "Gagal mengunduh PDF",
        variant: "destructive",
      });
    }
  };

  const handlePrint = () => {
    if (previewUrl) {
      const printWindow = window.open(previewUrl, "_blank");
      if (printWindow) {
        printWindow.addEventListener("load", () => {
          printWindow.print();
        });
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Banner Utama: 1 PDF Berisi Seluruh Data Tanpa Duplikat */}
      <Card className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 text-white border-none shadow-xl">
        <CardContent className="pt-6 pb-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md shrink-0">
                <CheckCircle2 className="h-8 w-8 text-white" />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/40 text-emerald-100 text-xs font-semibold mb-1">
                  <Sparkles className="h-3 w-3" />
                  1 File PDF Siap Cetak • Tanpa Duplikat
                </div>
                <h3 className="font-extrabold text-xl sm:text-2xl text-white tracking-tight">
                  1 File PDF Berisi Seluruh {suratJalanList.length} Cabang
                </h3>
                <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed max-w-xl">
                  Setiap lembar A4 memuat <strong>2 alamat outlet berbeda</strong> (atas &
                  bawah) dengan garis potong. Total <strong>{totalPages} halaman</strong>, hemat
                  50% kertas & tidak ada duplikasi data.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto shrink-0">
              <Button
                size="lg"
                onClick={handleDownloadAll}
                className="bg-white text-emerald-900 hover:bg-emerald-50 font-bold shadow-lg text-sm px-6 h-12"
              >
                <Download className="h-5 w-5 mr-2 text-emerald-700" />
                Unduh PDF ({fileName})
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handlePrint}
                className="bg-emerald-800/60 hover:bg-emerald-800 text-white border-emerald-400/40 text-sm h-12"
              >
                <Printer className="h-5 w-5 mr-2" />
                Cetak Semua
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rangkuman Cabang */}
      <Card className="border-slate-200 shadow-sm bg-white">
        <CardHeader className="py-3.5 px-4 border-b border-slate-100 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-emerald-600" />
            <CardTitle className="text-sm font-bold text-slate-800">
              Rangkuman Pengiriman ({suratJalanList.length} Outlet / {totalPages} Halaman A4)
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onBack}
              className="h-8 text-xs text-slate-600"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              Edit Data
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onReset}
              className="h-8 text-xs text-slate-500 hover:text-slate-800"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              PO Baru
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
            {suratJalanList.map((sj, idx) => {
              const pageNum = Math.floor(idx / 2) + 1;
              const isTop = idx % 2 === 0;
              return (
                <div
                  key={sj.id}
                  className="p-2 rounded-lg border border-slate-100 bg-slate-50/60 flex flex-col justify-between"
                >
                  <div className="font-semibold text-slate-800 truncate">
                    #{idx + 1} {sj.kepada.replace("Uena ", "")}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                    <span>Hlm {pageNum} ({isTop ? "Atas" : "Bawah"})</span>
                    <span className="font-bold text-emerald-700">{sj.items.length} item</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* PDF Visual Viewer */}
      <Card className="shadow-lg border-slate-200 overflow-hidden">
        <CardHeader className="py-3 px-4 bg-slate-50 border-b border-slate-200 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-slate-800">
              Preview Dokumen PDF (Seluruh Halaman)
            </CardTitle>
            <CardDescription className="text-xs">
              Scroll ke bawah di dalam kotak untuk melihat semua {totalPages} halaman A4
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={handleDownloadAll}
            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Unduh {fileName}
          </Button>
        </CardHeader>
        <CardContent className="p-0 bg-slate-100">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center h-[750px] gap-3 text-slate-500">
              <Loader2 className="h-9 w-9 animate-spin text-emerald-600" />
              <p className="text-sm font-medium">
                Menggabungkan seluruh {suratJalanList.length} cabang ke dalam 1 file PDF...
              </p>
            </div>
          ) : previewUrl ? (
            <iframe
              src={previewUrl}
              className="w-full h-[820px] border-none"
              title="Preview 1 PDF Lengkap"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-[600px] gap-2 text-slate-400">
              <p>Gagal memuat visual preview.</p>
              <Button size="sm" onClick={handleDownloadAll}>
                Unduh PDF Langsung
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
