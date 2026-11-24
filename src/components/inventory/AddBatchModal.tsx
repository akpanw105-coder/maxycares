"use client";

import React, { useState } from "react";
import { useInventory } from "@/context/InventoryContext";
import { ProductItem } from "@/lib/supabaseClient";
import { Layers, X, AlertCircle } from "lucide-react";

interface AddBatchModalProps {
  product: ProductItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AddBatchModal({ product, isOpen, onClose }: AddBatchModalProps) {
  const { addBatch } = useInventory();

  const [batchNumber, setBatchNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("2028-12-31");
  const [purchaseCost, setPurchaseCost] = useState<number>(1000);
  const [quantityMain, setQuantityMain] = useState<number>(20);
  const [quantityPos, setQuantityPos] = useState<number>(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen || !product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!batchNumber.trim()) {
      setErrorMsg("Batch number is required.");
      return;
    }

    setIsSubmitting(true);
    const res = await addBatch(product.id, {
      batch_number: batchNumber.trim(),
      expiry_date: expiryDate,
      purchase_cost: Number(purchaseCost),
      quantity_main_store: Number(quantityMain),
      quantity_pos_terminal: Number(quantityPos),
    });

    if (!res.success) {
      setErrorMsg(res.message);
      setIsSubmitting(false);
    } else {
      setIsSubmitting(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#071916]/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-[#dce8e5] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-[#e5eeec] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center border border-teal-100/60">
              <Layers className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#0b2520]">Add Stock Batch Lot</h2>
              <p className="text-xs text-[#526a66]">
                {product.name} ({product.sku})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-[#0b2520] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#0b2520] font-medium mb-1.5">Batch / Lot Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. BT-2026-X1"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#dce8e5] text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#0f766e] bg-[#f8fafa] text-[#0b2520]"
              />
            </div>
            <div>
              <label className="block text-[#0b2520] font-medium mb-1.5">Expiry Date (FEFO) *</label>
              <input
                type="date"
                required
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#dce8e5] text-xs focus:outline-none focus:ring-1 focus:ring-[#0f766e] bg-[#f8fafa] text-[#0b2520]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#0b2520] font-medium mb-1.5">Purchase Unit Cost (₦) *</label>
            <input
              type="number"
              min="0"
              required
              value={purchaseCost}
              onChange={(e) => setPurchaseCost(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-[#dce8e5] text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#0f766e] bg-[#f8fafa] text-[#0b2520]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#0b2520] font-medium mb-1.5">Main Store Initial Units</label>
              <input
                type="number"
                min="0"
                value={quantityMain}
                onChange={(e) => setQuantityMain(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-[#dce8e5] text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#0f766e] bg-[#f8fafa] text-[#0b2520]"
              />
            </div>
            <div>
              <label className="block text-[#0b2520] font-medium mb-1.5">POS Counter Initial Units</label>
              <input
                type="number"
                min="0"
                value={quantityPos}
                onChange={(e) => setQuantityPos(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-[#dce8e5] text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#0f766e] bg-[#f8fafa] text-[#0b2520]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#e5eeec]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-[#dce8e5] rounded-xl font-medium hover:bg-stone-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-[#0b2520] hover:bg-[#0f766e] text-white rounded-xl font-medium transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? "Adding..." : "Add Batch Lot"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
