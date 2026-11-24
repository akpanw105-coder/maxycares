"use client";

import React, { useState } from "react";
import { useInventory } from "@/context/InventoryContext";
import { KeyRound, AlertCircle, Clock, ShieldCheck, UserCheck } from "lucide-react";

export function ShiftGateModal() {
  const {
    staffProfiles,
    activeShift,
    startStaffShift,
    isStartingShift,
  } = useInventory();

  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [pin, setPin] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const handleStartShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!selectedStaffId) {
      setErrorMsg("Please select your staff identity.");
      return;
    }

    const isDemoMode = true;
    const isValidLength = isDemoMode ? pin.length === 6 || pin.length >= 8 : pin.length >= 8;
    if (!isValidLength) {
      setErrorMsg(
        isDemoMode
          ? "Staff PIN must be 6 digits (demo) or at least 8 digits."
          : "Staff PIN must be at least 8 digits/characters."
      );
      return;
    }

    const res = await startStaffShift(selectedStaffId, pin);
    if (!res.success) {
      setErrorMsg(res.message);
    } else {
      setPin("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#071916]/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full border border-[#dce8e5] shadow-2xl overflow-hidden">
        {/* Clean Header */}
        <div className="px-6 py-5 border-b border-[#e5eeec] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center border border-teal-100/60 shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#0b2520]">Dispensary Shift Access</h2>
            <p className="text-xs text-[#526a66]">Select staff profile and enter PIN to activate duty shift</p>
          </div>
        </div>

        {/* Existing active shift notice */}
        {activeShift && activeShift.status === "active" && (
          <div className="m-5 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Active Shift In Progress:</span>
              <p className="mt-0.5 leading-relaxed text-amber-800">
                Held by <strong className="text-[#0b2520]">{activeShift.staff_name}</strong>. The current duty officer must end shift and reconcile cash before a new staff member can assume duty.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleStartShift} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-[#0b2520] font-medium mb-1.5">Staff Identity *</label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-xl border border-[#dce8e5] bg-[#f8fafa] text-[#0b2520] focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
            >
              <option value="">Select your registered profile</option>
              {staffProfiles
                .filter((s) => s.is_active)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name} ({s.staff_code} &middot; {s.role})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-[#0b2520] font-medium mb-1.5">Personal Shift PIN *</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[#dce8e5] bg-[#f8fafa] font-mono text-[#0b2520] focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
            />
            <span className="text-[10px] text-[#526a66] block mt-1">
              Protected by cryptographic bcrypt hashing verification.
            </span>
          </div>

          <button
            type="submit"
            disabled={isStartingShift}
            className="w-full py-2.5 mt-2 rounded-xl bg-[#0b2520] hover:bg-[#0f766e] text-white font-medium transition-colors shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isStartingShift ? "Authenticating..." : "Start Dispensary Duty"}
          </button>
        </form>
      </div>
    </div>
  );
}
