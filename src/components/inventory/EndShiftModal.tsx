"use client";

import React, { useState } from "react";
import { useInventory } from "@/context/InventoryContext";
import { X, Wallet, AlertCircle, CheckCircle2, DollarSign, Store } from "lucide-react";

interface EndShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EndShiftModal({ isOpen, onClose }: EndShiftModalProps) {
  const {
    activeStaff,
    activeShift,
    shiftDurationFormatted,
    movements,
    sales,
    endStaffShift,
  } = useInventory();

  const [countedCash, setCountedCash] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen || !activeShift) return null;

  // Shift Sales
  const shiftSales = sales.filter((s) => s.shift_id === activeShift.id && s.status === "completed");
  const shiftTotalSales = shiftSales.reduce((acc, s) => acc + s.total_amount, 0);
  const shiftCashSales = shiftSales.filter((s) => s.payment_method === "cash").reduce((acc, s) => acc + s.total_amount, 0);
  const shiftBankSales = shiftSales.filter((s) => s.payment_method === "bank_transfer").reduce((acc, s) => acc + s.total_amount, 0);

  // Expected cash in drawer
  const expectedCash = (activeShift.opening_cash || 0) + (activeShift.expected_cash || shiftCashSales);
  const difference = Number(countedCash) - expectedCash;

  const handleConfirmEndShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    const res = await endStaffShift(Number(countedCash), notes.trim());
    if (!res.success) {
      setErrorMsg(res.message);
      setIsSubmitting(false);
    } else {
      setIsSubmitting(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#071916]/70 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-[#dce8e5] shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-[#e5eeec] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center border border-teal-100/60">
              <Wallet className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#0b2520]">End Duty Shift &amp; Cash Reconciliation</h2>
              <p className="text-xs text-[#526a66]">
                {activeShift.staff_name} &middot; Duty Active for {shiftDurationFormatted}
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

        {/* Content */}
        <form onSubmit={handleConfirmEndShift} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Operational Metrics of This Shift */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 rounded-xl bg-[#f8fafa] border border-[#dce8e5]">
              <span className="text-[10px] text-[#526a66] uppercase font-medium">Total Shift Sales</span>
              <div className="text-sm font-bold font-mono text-[#0b2520] mt-1">
                ₦{shiftTotalSales.toLocaleString()}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-teal-50/50 border border-teal-100">
              <span className="text-[10px] text-teal-800 uppercase font-medium">Cash Sales</span>
              <div className="text-sm font-bold font-mono text-teal-950 mt-1">
                ₦{shiftCashSales.toLocaleString()}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100">
              <span className="text-[10px] text-indigo-800 uppercase font-medium">Bank Transfers</span>
              <div className="text-sm font-bold font-mono text-indigo-950 mt-1">
                ₦{shiftBankSales.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#f8fafa] border border-[#dce8e5] space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#526a66]">Calculated Expected Cash in Drawer:</span>
              <span className="font-mono text-sm font-bold text-[#0b2520]">
                ₦{expectedCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-[11px] text-[#526a66]">
              Includes starting drawer balance + cash receipts recorded during this duty shift.
            </p>
          </div>

          <div>
            <label className="block text-[#0b2520] font-medium mb-1.5">
              Physical Cash Counted in Drawer (₦) *
            </label>
            <input
              type="number"
              min="0"
              required
              value={countedCash}
              onChange={(e) => setCountedCash(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl border border-[#dce8e5] bg-[#f8fafa] font-mono text-[#0b2520] focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
            />
          </div>

          {/* Real-time Discrepancy indicator */}
          <div
            className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
              difference === 0
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : difference > 0
                ? "bg-amber-50 border-amber-200 text-amber-900"
                : "bg-rose-50 border-rose-200 text-rose-900"
            }`}
          >
            <span>
              {difference === 0
                ? "Exact Cash Match"
                : difference > 0
                ? "Cash Surplus Detected"
                : "Cash Shortage Detected"}
            </span>
            <span className="font-mono font-bold">
              {difference >= 0 ? `+₦${difference.toLocaleString()}` : `-₦${Math.abs(difference).toLocaleString()}`}
            </span>
          </div>

          <div>
            <label className="block text-[#0b2520] font-medium mb-1.5">Handover Notes / Discrepancy Comments</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Handed over key to next shift officer; float intact."
              className="w-full px-3 py-2 rounded-xl border border-[#dce8e5] bg-[#f8fafa] text-[#0b2520] focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
            />
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
              {isSubmitting ? "Closing Shift..." : "Complete Handover & End Shift"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
