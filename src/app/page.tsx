"use client";

import { useState } from "react";
import { PdfUploader } from "@/components/pdf-uploader";
import { DataEditor } from "@/components/data-editor";
import { SuratJalanPreview } from "@/components/surat-jalan-preview";
import { StepIndicator } from "@/components/step-indicator";
import type { SuratJalanData } from "@/lib/types";
import { Truck } from "lucide-react";

export default function Home() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
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
                  Otomasi Pembacaan PO & Pembuatan Surat Jalan 2 Rangkap
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
          <PdfUploader onDataExtracted={handleDataExtracted} />
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
            onReset={handleReset}
            onBack={handleBack}
          />
        )}
      </div>
    </main>
  );
}
