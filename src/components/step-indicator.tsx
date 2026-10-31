"use client";

import { CheckCircle2 } from "lucide-react";

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3;
}

const steps = [
  { number: 1, title: "Upload PDF", description: "Unggah file PDF pesanan" },
  { number: 2, title: "Periksa Data", description: "Koreksi data hasil ekstraksi" },
  { number: 3, title: "Surat Jalan", description: "Preview & unduh PDF" },
];

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-0">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center">
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                step.number < currentStep
                  ? "bg-green-500 border-green-500 text-white"
                  : step.number === currentStep
                  ? "bg-primary border-primary text-primary-foreground"
                  : "border-gray-300 text-gray-400"
              }`}
            >
              {step.number < currentStep ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <span className="text-sm font-semibold">{step.number}</span>
              )}
            </div>
            <div className="hidden sm:block">
              <p
                className={`text-sm font-medium ${
                  step.number <= currentStep ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {step.title}
              </p>
              <p className="text-xs text-muted-foreground">{step.description}</p>
            </div>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`w-12 sm:w-24 h-0.5 mx-3 ${
                step.number < currentStep ? "bg-green-500" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

