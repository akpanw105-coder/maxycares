"use client";

import React, { useState } from "react";
import { useInventory } from "@/context/InventoryContext";
import { ArrowLeftRight, AlertCircle, X, Warehouse, Store } from "lucide-react";

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TransferModal({ isOpen, onClose }: TransferModalProps) {
  const { products, batches, transferStock, activeShift } = useInventory();

  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [direction, setDirection] = useState<"to_pos" | "to_main">("to_pos");
  const [quantity, setQuantity] = useState<number>(5);
  const [reason, setReason] = useState("Routine counter replenishment");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const currentProductId = selectedProductId || products[0]?.id;
  const productBatches = batches.filter((b) => b.product_id === currentProductId);
  const activeBatch = productBatches.find((b) => b.id === (selectedBatchId || productBatches[0]?.id));

  const availableInSource = activeBatch
    ? direction === "to_pos"
      ? activeBatch.quantity_main_store
      : activeBatch.quantity_pos_terminal
    : 0;

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!activeShift) {
      setErrorMsg("An active staff shift is strictly required to execute transfers.");
      return;
    }

    const batchIdToUse = selectedBatchId || productBatches[0]?.id;
    if (!batchIdToUse) {
      setErrorMsg("Please select a specific batch to transfer.");
      return;
    }

    if (quantity <= 0) {
      setErrorMsg("Quantity must be greater than zero.");
      return;
    }

    if (quantity > availableInSource) {
      setErrorMsg(
        `Insufficient stock in ${
          direction === "to_pos" ? "Main Store" : "POS Counter"
        }. Available: ${availableInSource} units.`
      );
      return;
    }

    setIsSubmitting(true);
    const res = await transferStock(batchIdToUse, quantity, direction, reason);
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
              <ArrowLeftRight className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#0b2520]">Transfer Stock Locations</h2>
              <p className="text-xs text-[#526a66]">Move stock between Main Store and POS Counter</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-[#0b2520] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleTransfer} className="p-6 space-y-4 text-xs">
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
                    {p.name} ({p.sku} &middot; Main: {p.total_main_store || 0}, POS: {p.total_pos_terminal || 0})
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

          <div>
            <label className="block text-[#0b2520] font-medium mb-1.5">Transfer Direction *</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDirection("to_pos")}
                className={`py-2.5 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  direction === "to_pos"
                    ? "bg-[#0b2520] text-white border-[#0b2520] shadow-xs"
                    : "bg-[#f8fafa] text-[#526a66] border-[#dce8e5] hover:bg-stone-50"
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>To POS Counter</span>
              </button>
              <button
                type="button"
                onClick={() => setDirection("to_main")}
                className={`py-2.5 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  direction === "to_main"
                    ? "bg-[#0b2520] text-white border-[#0b2520] shadow-xs"
                    : "bg-[#f8fafa] text-[#526a66] border-[#dce8e5] hover:bg-stone-50"
                }`}
              >
                <Warehouse className="w-3.5 h-3.5" />
                <span>To Main Store</span>
              </button>
            </div>
            <div className="text-[11px] text-[#526a66] mt-1.5">
              Available in source location: <strong className="text-[#0b2520] font-mono">{availableInSource} units</strong>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#0b2520] font-medium mb-1.5">Quantity to Transfer *</label>
              <input
                type="number"
                min="1"
                max={availableInSource}
                required
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-[#dce8e5] bg-[#f8fafa] font-mono text-[#0b2520] focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
              />
            </div>

            <div>
              <label className="block text-[#0b2520] font-medium mb-1.5">Operational Reason</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Replenishment or restock"
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
              disabled={isSubmitting || availableInSource <= 0}
              className="px-5 py-2.5 bg-[#0b2520] hover:bg-[#0f766e] text-white rounded-xl font-medium transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? "Executing Transfer..." : "Confirm Transfer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
