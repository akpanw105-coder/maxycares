"use client";

import React, { useState } from "react";
import { useInventory } from "@/context/InventoryContext";
import { Sliders, AlertCircle, X, Warehouse, Store } from "lucide-react";

interface AdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdjustModal({ isOpen, onClose }: AdjustModalProps) {
  const { products, batches, adjustStock, activeShift } = useInventory();

  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [location, setLocation] = useState<"main_store" | "pos_terminal">("main_store");
  const [adjustType, setAdjustType] = useState<"add" | "reduce" | "correct">("add");
  const [delta, setDelta] = useState<number>(5);
  const [reason, setReason] = useState("Damaged box write-off");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const currentProductId = selectedProductId || products[0]?.id;
  const productBatches = batches.filter((b) => b.product_id === currentProductId);
  const activeBatch = productBatches.find((b) => b.id === (selectedBatchId || productBatches[0]?.id));

  const currentQty = activeBatch
    ? location === "main_store"
      ? activeBatch.quantity_main_store
      : activeBatch.quantity_pos_terminal
    : 0;

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!activeShift) {
      setErrorMsg("An active staff shift is strictly required to adjust stock.");
      return;
    }

    const batchIdToUse = selectedBatchId || productBatches[0]?.id;
    if (!batchIdToUse) {
      setErrorMsg("Please select a specific batch.");
      return;
    }

    if (delta <= 0 && adjustType !== "correct") {
      setErrorMsg("Adjustment quantity must be greater than zero.");
      return;
    }

    if (adjustType === "reduce" && delta > currentQty) {
      setErrorMsg(`Cannot reduce more than current quantity (${currentQty} units available).`);
      return;
    }

    setIsSubmitting(true);
    const res = await adjustStock(batchIdToUse, location, adjustType, delta, reason);
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
              <Sliders className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#0b2520]">Stock Quantity Adjustment</h2>
              <p className="text-xs text-[#526a66]">Intake addition, damage write-off, or discrepancy correction</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-[#0b2520] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleAdjust} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-[#0b2520] font-medium mb-1.5">Select Medicine *</label>
            <select
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                setSelectedBatchId("");
              }}
              className="w-full px-3 py-2 rounded-xl border border-[#dce8e5] bg-[#f8fafa] text-[#0b2520] focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
            >
              {products
                .filter((p) => p.is_active)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku} &middot; Total Stock: {p.total_quantity || 0})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-[#0b2520] font-medium mb-1.5">Select Specific Batch Lot *</label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#dce8e5] bg-[#f8fafa] font-mono text-[#0b2520] focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
            >
              {productBatches.length === 0 ? (
                <option value="">No batches registered for this medicine</option>
              ) : (
                productBatches.map((b) => (
                  <option key={b.id} value={b.id}>
                    Batch {b.batch_number} (Exp: {b.expiry_date}) &middot; Main: {b.quantity_main_store}, POS: {b.quantity_pos_terminal}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#0b2520] font-medium mb-1.5">Target Location *</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLocation("main_store")}
                  className={`py-2 px-2.5 rounded-xl border text-[11px] font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                    location === "main_store"
                      ? "bg-[#0b2520] text-white border-[#0b2520] shadow-xs"
                      : "bg-[#f8fafa] text-[#526a66] border-[#dce8e5] hover:bg-stone-50"
                  }`}
                >
                  <Warehouse className="w-3.5 h-3.5" />
                  <span>Main Store</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLocation("pos_terminal")}
                  className={`py-2 px-2.5 rounded-xl border text-[11px] font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                    location === "pos_terminal"
                      ? "bg-[#0b2520] text-white border-[#0b2520] shadow-xs"
                      : "bg-[#f8fafa] text-[#526a66] border-[#dce8e5] hover:bg-stone-50"
                  }`}
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>POS Counter</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[#0b2520] font-medium mb-1.5">Adjustment Action *</label>
              <select
                value={adjustType}
                onChange={(e) => setAdjustType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-[#dce8e5] bg-[#f8fafa] text-[#0b2520] focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
              >
                <option value="add">Add Units (+)</option>
                <option value="reduce">Reduce / Write-off (-)</option>
                <option value="correct">Count Correction (=)</option>
              </select>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#f8fafa] border border-[#dce8e5] flex items-center justify-between">
            <span className="text-[#526a66]">Current Location Units:</span>
            <span className="font-mono text-sm font-bold text-[#0b2520]">{currentQty} units</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#0b2520] font-medium mb-1.5">
                {adjustType === "correct" ? "New Set Quantity *" : "Quantity Delta *"}
              </label>
              <input
                type="number"
                min="0"
                required
                value={delta}
                onChange={(e) => setDelta(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-[#dce8e5] bg-[#f8fafa] font-mono text-[#0b2520] focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
              />
            </div>

            <div>
              <label className="block text-[#0b2520] font-medium mb-1.5">Documented Reason *</label>
              <input
                type="text"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Damage, expired, or recount audit"
                className="w-full px-3 py-2 rounded-xl border border-[#dce8e5] bg-[#f8fafa] text-[#0b2520] focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
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
              {isSubmitting ? "Adjusting..." : "Apply Adjustment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
