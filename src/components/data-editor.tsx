"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  ClipboardEdit,
  Store,
  Calendar,
  Truck,
  Hash,
  AlertCircle,
} from "lucide-react";
import type { SuratJalanData, SuratJalanItem } from "@/lib/types";
import { toast } from "@/components/ui/use-toast";

interface DataEditorProps {
  suratJalanList: SuratJalanData[];
  onConfirm: (confirmedList: SuratJalanData[]) => void;
  onBack: () => void;
}

export function DataEditor({
  suratJalanList,
  onConfirm,
  onBack,
}: DataEditorProps) {
  const [list, setList] = useState<SuratJalanData[]>(suratJalanList);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const currentSJ = list[selectedIndex] || list[0];

  const updateCurrentSJ = (field: keyof SuratJalanData, value: any) => {
    setList((prev) => {
      const updated = [...prev];
      updated[selectedIndex] = {
        ...updated[selectedIndex],
        [field]: value,
      };
      return updated;
    });
  };

  const updateItem = (
    itemIndex: number,
    field: keyof SuratJalanItem,
    value: any
  ) => {
    setList((prev) => {
      const updated = [...prev];
      const targetSJ = { ...updated[selectedIndex] };
      const updatedItems = [...targetSJ.items];
      updatedItems[itemIndex] = {
        ...updatedItems[itemIndex],
        [field]: value,
      };
      targetSJ.items = updatedItems;
      targetSJ.totalQty = updatedItems.reduce(
        (sum, it) => sum + (Number(it.qty) || 0),
        0
      );
      updated[selectedIndex] = targetSJ;
      return updated;
    });
  };

  const addItem = () => {
    setList((prev) => {
      const updated = [...prev];
      const targetSJ = { ...updated[selectedIndex] };
      targetSJ.items = [
        ...targetSJ.items,
        {
          no: targetSJ.items.length + 1,
          namaBarang: "",
          qty: 1,
        },
      ];
      updated[selectedIndex] = targetSJ;
      return updated;
    });
  };

  const removeItem = (itemIndex: number) => {
    setList((prev) => {
      const updated = [...prev];
      const targetSJ = { ...updated[selectedIndex] };
      const filtered = targetSJ.items
        .filter((_, idx) => idx !== itemIndex)
        .map((it, idx) => ({ ...it, no: idx + 1 }));
      targetSJ.items = filtered;
      targetSJ.totalQty = filtered.reduce(
        (sum, it) => sum + (Number(it.qty) || 0),
        0
      );
      updated[selectedIndex] = targetSJ;
      return updated;
    });
  };

  const removeCurrentOutlet = () => {
    if (list.length <= 1) {
      toast({
        title: "Tidak bisa dihapus",
        description: "Minimal harus ada 1 cabang tersisa.",
        variant: "destructive",
      });
      return;
    }
    const outletName = currentSJ.kepada;
    setList((prev) => prev.filter((_, idx) => idx !== selectedIndex));
    setSelectedIndex((prev) => Math.max(0, prev - 1));
    toast({
      title: "Cabang Dihapus",
      description: `${outletName} telah dihapus dari daftar pengiriman.`,
    });
  };

  const handleApplyToAll = (field: "kendaraan" | "noPolisi" | "tanggal") => {
    const val = currentSJ[field];
    setList((prev) =>
      prev.map((item) => ({
        ...item,
        [field]: val,
      }))
    );
    toast({
      title: "Diterapkan ke Semua Cabang",
      description: `${field} disamakan untuk seluruh ${list.length} cabang.`,
    });
  };

  const handleFinish = () => {
    // Filter only outlets that have active items with qty > 0
    const filteredList = list
      .map((sj) => {
        const activeItems = (sj.items || [])
          .filter(
            (it) =>
              it.namaBarang &&
              it.namaBarang.trim() &&
              !isNaN(Number(it.qty)) &&
              Number(it.qty) > 0
          )
          .map((it, idx) => ({ ...it, no: idx + 1, qty: Number(it.qty) }));

        return {
          ...sj,
          items: activeItems,
          totalQty: activeItems.reduce((sum, it) => sum + it.qty, 0),
        };
      })
      .filter((sj) => sj.items.length > 0 && sj.totalQty > 0);

    if (filteredList.length === 0) {
      toast({
        title: "Tidak ada pesanan barang",
        description:
          "Semua cabang memiliki 0 item. Tambahkan minimal 1 item produk dengan QTY > 0.",
        variant: "destructive",
      });
      return;
    }

    const removedCount = list.length - filteredList.length;
    if (removedCount > 0) {
      toast({
        title: `${removedCount} Cabang Tanpa Item Dilewati`,
        description: `Hanya ${filteredList.length} cabang dengan item aktif yang dimasukkan ke PDF.`,
      });
    }

    onConfirm(filteredList);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Banner / Outlet Navigator */}
      <Card className="border-emerald-100 shadow-md bg-white">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-xl font-bold flex items-center gap-2 text-slate-800">
                <ClipboardEdit className="h-5 w-5 text-emerald-600" />
                Pemeriksaan & Koreksi Surat Jalan
              </CardTitle>
              <CardDescription>
                Hanya cabang dengan item pesanan (QTY &gt; 0) yang akan masuk ke PDF.
                Cabang tanpa item akan otomatis dilewati.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onBack}
                className="text-slate-600"
              >
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Ganti PO
              </Button>
              <Button
                size="sm"
                onClick={handleFinish}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              >
                Lanjut ke Cetak ({list.filter((s) => s.items.length > 0).length})
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Pilih Cabang untuk Mengedit:
          </p>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {list.map((sj, idx) => {
              const activeCount = sj.items.filter(
                (i) => i.namaBarang && Number(i.qty) > 0
              ).length;
              return (
                <button
                  key={sj.id}
                  onClick={() => setSelectedIndex(idx)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                    idx === selectedIndex
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : activeCount === 0
                      ? "bg-red-50 text-red-600 border-red-200"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200"
                  }`}
                >
                  <span className="font-bold mr-1.5 opacity-80">#{idx + 1}</span>
                  {sj.kepada.replace("Uena ", "")}
                  <span
                    className={`ml-1.5 font-normal ${
                      activeCount === 0 ? "font-bold text-red-600" : "opacity-75"
                    }`}
                  >
                    ({activeCount} item)
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Current Outlet Form */}
      {currentSJ && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Header & Meta Settings */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="pb-3 bg-slate-50/50 rounded-t-xl border-b border-slate-100 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-800">
                  <Store className="h-4 w-4 text-emerald-600" />
                  Informasi Surat Jalan
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeCurrentOutlet}
                  className="h-7 px-2 text-xs text-red-600 hover:bg-red-50"
                  title="Hapus cabang ini dari daftar cetak"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Hapus Cabang
                </Button>
              </CardHeader>
              <CardContent className="space-y-4 pt-4 text-sm">
                <div>
                  <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    Tanggal Surat Jalan
                  </Label>
                  <div className="flex gap-1.5 mt-1">
                    <Input
                      value={currentSJ.tanggal}
                      onChange={(e) =>
                        updateCurrentSJ("tanggal", e.target.value)
                      }
                      className="h-9 text-xs"
                      placeholder="e.g. 1 November 2026"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-[11px] h-9 px-2 shrink-0"
                      onClick={() => handleApplyToAll("tanggal")}
                      title="Terapkan tanggal ini ke semua cabang"
                    >
                      Semua
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                    <Hash className="h-3.5 w-3.5 text-slate-400" />
                    ID Barang
                  </Label>
                  <Input
                    value={currentSJ.idBarang}
                    onChange={(e) => updateCurrentSJ("idBarang", e.target.value)}
                    className="h-9 text-xs mt-1"
                    placeholder="e.g. A029"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold text-slate-600">
                    KEPADA (Nama Penerima)
                  </Label>
                  <Input
                    value={currentSJ.kepada}
                    onChange={(e) => updateCurrentSJ("kepada", e.target.value)}
                    className="h-9 text-xs mt-1 font-medium"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold text-slate-600">
                    ALAMAT
                  </Label>
                  <Input
                    value={currentSJ.alamat}
                    onChange={(e) => updateCurrentSJ("alamat", e.target.value)}
                    className="h-9 text-xs mt-1"
                  />
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5 text-slate-400" />
                    KENDARAAN (Opsional)
                  </Label>
                  <div className="flex gap-1.5 mt-1">
                    <Input
                      value={currentSJ.kendaraan}
                      onChange={(e) =>
                        updateCurrentSJ("kendaraan", e.target.value)
                      }
                      placeholder="e.g. Mobil Box / Grandmax"
                      className="h-9 text-xs"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-[11px] h-9 px-2 shrink-0"
                      onClick={() => handleApplyToAll("kendaraan")}
                      title="Terapkan kendaraan ini ke semua cabang"
                    >
                      Semua
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-slate-600">
                    NO. POLISI (Opsional)
                  </Label>
                  <div className="flex gap-1.5 mt-1">
                    <Input
                      value={currentSJ.noPolisi}
                      onChange={(e) =>
                        updateCurrentSJ("noPolisi", e.target.value)
                      }
                      placeholder="e.g. B 1234 ABC"
                      className="h-9 text-xs"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-[11px] h-9 px-2 shrink-0"
                      onClick={() => handleApplyToAll("noPolisi")}
                      title="Terapkan no polisi ini ke semua cabang"
                    >
                      Semua
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table of Items */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="pb-3 bg-slate-50/50 rounded-t-xl border-b border-slate-100 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-slate-800">
                    Rincian Barang — {currentSJ.kepada}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {currentSJ.items.filter((i) => Number(i.qty) > 0).length}{" "}
                    item aktif (item dengan QTY 0 tidak dimasukkan ke PDF)
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addItem}
                  className="h-8 text-xs border-dashed text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Tambah Barang
                </Button>
              </CardHeader>
              <CardContent className="pt-4">
                {currentSJ.items.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 space-y-3">
                    <AlertCircle className="h-8 w-8 mx-auto text-amber-500 opacity-60" />
                    <p className="text-xs text-slate-500">
                      Cabang ini tidak memiliki item pesanan. Cabang tanpa item
                      otomatis <strong>tidak akan dicetak di PDF</strong>.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={addItem}
                      className="text-xs"
                    >
                      Tambah Barang
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50">
                          <th className="py-2.5 px-3 text-left w-12">NO</th>
                          <th className="py-2.5 px-3 text-left">NAMA BARANG</th>
                          <th className="py-2.5 px-3 text-right w-28">QTY (Kg)</th>
                          <th className="py-2.5 px-2 text-center w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {currentSJ.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/60">
                            <td className="py-2 px-3 font-mono text-slate-400 font-medium">
                              {String(idx + 1).padStart(2, "0")}
                            </td>
                            <td className="py-2 px-3">
                              <Input
                                value={item.namaBarang}
                                onChange={(e) =>
                                  updateItem(idx, "namaBarang", e.target.value)
                                }
                                className="h-8 text-xs font-medium text-slate-800"
                                placeholder="Nama barang"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <Input
                                type="number"
                                step="0.1"
                                value={item.qty}
                                onChange={(e) =>
                                  updateItem(
                                    idx,
                                    "qty",
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="h-8 text-xs text-right font-bold text-slate-900"
                              />
                            </td>
                            <td className="py-2 px-2 text-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeItem(idx)}
                                className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-slate-200 bg-emerald-50/40 font-bold text-slate-900">
                          <td colSpan={2} className="py-3 px-3 text-right text-xs">
                            TOTAL BERAT (Kg):
                          </td>
                          <td className="py-3 px-3 text-right text-sm text-emerald-800 font-mono">
                            {currentSJ.items
                              .filter((it) => Number(it.qty) > 0)
                              .reduce((s, it) => s + (Number(it.qty) || 0), 0)
                              .toString()
                              .replace(".", ",")}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bottom Navigation */}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={selectedIndex === 0}
                onClick={() => setSelectedIndex((prev) => Math.max(0, prev - 1))}
                className="text-xs"
              >
                ← Cabang Sebelumnya
              </Button>
              <span className="text-xs text-slate-500">
                Cabang {selectedIndex + 1} dari {list.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={selectedIndex === list.length - 1}
                onClick={() =>
                  setSelectedIndex((prev) =>
                    Math.min(list.length - 1, prev + 1)
                  )
                }
                className="text-xs"
              >
                Cabang Berikutnya →
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
