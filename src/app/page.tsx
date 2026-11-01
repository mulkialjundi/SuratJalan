"use client";

import { useState } from "react";
import { PdfUploader } from "@/components/pdf-uploader";
import { TextUploader } from "@/components/text-uploader";
import { DataEditor } from "@/components/data-editor";
import { SuratJalanPreview } from "@/components/surat-jalan-preview";
import { StepIndicator } from "@/components/step-indicator";
import type { SuratJalanData } from "@/lib/types";
import { Truck, FileUp, ClipboardType } from "lucide-react";

type InputMode = "pdf" | "text";

export default function Home() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [mode, setMode] = useState<InputMode>("pdf");
  const [suratJalanList, setSuratJalanList] = useState<SuratJalanData[]>([]);

  const handleDataExtracted = (list: SuratJalanData[]) => {
    setSuratJalanList(list);
    setStep(2);
  };

  const handleDataConfirmed = (confirmedList: SuratJalanData[]) => {
    setSuratJalanList(confirmedList);
    setStep(3);
  };

  const handleReset = () => {
    setStep(1);
    setSuratJalanList([]);
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    } else if (step === 3) {
      setStep(2);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50/70">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-600 rounded-xl p-2.5 text-white shadow-sm">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-slate-900 leading-tight">
                    Alam Cabe Barokah
                  </h1>
                  <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    Sistem Surat Jalan
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Otomasi Pembacaan PO & Pembuatan Surat Jalan
                </p>
              </div>
            </div>

            {suratJalanList.length > 0 && (
              <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                {suratJalanList.length} Cabang Terdeteksi
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Step Indicator */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <StepIndicator currentStep={step} />
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {step === 1 && (
          <div className="space-y-6">
            {/* Input Mode Selector */}
            <div className="max-w-3xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMode("pdf")}
                  className={`text-left rounded-2xl border-2 p-4 transition-all ${
                    mode === "pdf"
                      ? "border-emerald-500 bg-emerald-50/60 shadow-sm"
                      : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/20"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`rounded-xl p-2.5 ${
                        mode === "pdf"
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <FileUp className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        Scan PDF PO
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        2 outlet per halaman A4
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMode("text")}
                  className={`text-left rounded-2xl border-2 p-4 transition-all ${
                    mode === "text"
                      ? "border-emerald-500 bg-emerald-50/60 shadow-sm"
                      : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/20"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`rounded-xl p-2.5 ${
                        mode === "text"
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <ClipboardType className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        Scan Teks PO
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        1 outlet per halaman A4 penuh
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {mode === "pdf" ? (
              <PdfUploader onDataExtracted={handleDataExtracted} />
            ) : (
              <TextUploader onDataExtracted={handleDataExtracted} />
            )}
          </div>
        )}
        {step === 2 && suratJalanList.length > 0 && (
          <DataEditor
            suratJalanList={suratJalanList}
            onConfirm={handleDataConfirmed}
            onBack={handleBack}
          />
        )}
        {step === 3 && suratJalanList.length > 0 && (
          <SuratJalanPreview
            suratJalanList={suratJalanList}
            layout={mode === "text" ? "single" : "duo"}
            onReset={handleReset}
            onBack={handleBack}
          />
        )}
      </div>
    </main>
  );
}
