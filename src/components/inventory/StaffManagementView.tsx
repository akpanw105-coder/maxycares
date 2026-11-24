"use client";

import React, { useState } from "react";
import { useInventory } from "@/context/InventoryContext";
import { TableEmptyState, StatusBadge } from "./UIComponents";
import {
  Users,
  UserPlus,
  KeyRound,
  RotateCcw,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  Lock
} from "lucide-react";

export function StaffManagementView() {
  const {
    staffProfiles,
    registerStaffProfile,
    updateStaffProfile,
    resetStaffPin,
    ownerEmail,
  } = useInventory();

  // Registration form
  const [fullName, setFullName] = useState("");
  const [staffCode, setStaffCode] = useState("");
  const [role, setRole] = useState("Pharmacist");
  const [pin, setPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // PIN Reset state
  const [resetStaffId, setResetStaffId] = useState<string | null>(null);
  const [newPin, setNewPin] = useState("");
  const [resetSuccessMsg, setResetSuccessMsg] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    if (pin.length !== 6 && pin.length < 8) {
      setErrorMsg("Staff PIN must be 6 digits (demo) or at least 8 digits.");
      setIsSubmitting(false);
      return;
    }

    const res = await registerStaffProfile(fullName.trim(), staffCode.trim(), role, pin.trim());
    if (!res.success) {
      setErrorMsg(res.message);
    } else {
      setSuccessMsg(`Staff profile "${fullName.trim()}" created successfully.`);
      setFullName("");
      setStaffCode("");
      setPin("");
      setTimeout(() => setSuccessMsg(""), 4000);
    }
    setIsSubmitting(false);
  };

  const handleResetPin = async (staffId: string) => {
    if (newPin.length !== 6 && newPin.length < 8) {
      alert("New PIN must be 6 digits (demo) or at least 8 digits.");
      return;
    }

    const res = await resetStaffPin(staffId, newPin.trim());
    if (res.success) {
      setResetSuccessMsg("PIN reset successfully with bcrypt hash.");
      setTimeout(() => setResetSuccessMsg(""), 4000);
      setResetStaffId(null);
      setNewPin("");
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-[#dce8e5] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-[#0b2520]">Staff Directory &amp; Access Control</h2>
          <p className="text-xs text-[#526a66]">
            Owner administration &middot; Registered staff profiles with bcrypt PIN authentication for shift access
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-medium px-3 py-1.5 rounded-xl bg-[#f8fafa] border border-[#dce8e5] text-[#0b2520]">
            {staffProfiles.length} Registered Staff
          </span>
        </div>
      </div>

      {resetSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
          <span>{resetSuccessMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Register Staff Form */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-[#dce8e5] shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#e5eeec]">
            <UserPlus className="w-4 h-4 text-teal-800" />
            <h3 className="text-sm font-semibold text-[#0b2520]">Register New Staff Member</h3>
          </div>

          <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-[#0b2520] font-medium mb-1.5">Full Professional Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Pharm. Zainab Balogun"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#dce8e5] bg-[#f8fafa] text-[#0b2520] focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#0b2520] font-medium mb-1.5">Staff Code *</label>
                <input
                  type="text"
                  required
                  placeholder="STF-004"
                  value={staffCode}
                  onChange={(e) => setStaffCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#dce8e5] bg-[#f8fafa] font-mono text-[#0b2520] focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                />
              </div>

              <div>
                <label className="block text-[#0b2520] font-medium mb-1.5">Designated Role *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg border border-[#dce8e5] bg-[#f8fafa] text-[#0b2520] focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                >
                  <option value="Lead Pharmacist">Lead Pharmacist</option>
                  <option value="Pharmacist">Pharmacist</option>
                  <option value="Dispensing Specialist">Dispensing Specialist</option>
                  <option value="Inventory Officer">Inventory Officer</option>
                  <option value="Cashier">Cashier</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[#0b2520] font-medium mb-1.5">
                Shift Access PIN (6 or 8 digits) *
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#dce8e5] bg-[#f8fafa] font-mono text-[#0b2520] focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
              />
              <span className="text-[10px] text-[#526a66] block mt-1">
                Used to authorize shifts and log into dispensing duty.
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 mt-2 rounded-xl bg-[#0b2520] hover:bg-[#0f766e] text-white font-medium transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? "Registering..." : "Create Staff Profile"}
            </button>
          </form>
        </div>

        {/* Staff Profiles Table */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#dce8e5] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#e5eeec]">
            <h3 className="text-sm font-semibold text-[#0b2520]">Registered Staff Directory</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8fafa] border-b border-[#e5eeec] text-[#526a66] font-medium text-[11px]">
                <tr>
                  <th className="px-5 py-3">Staff Code</th>
                  <th className="px-5 py-3">Full Name</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3 text-center">Duty Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5eeec]">
                {staffProfiles.map((s) => (
                  <tr key={s.id} className="hover:bg-[#f8fafa]/80 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-medium text-[#0b2520]">{s.staff_code}</td>
                    <td className="px-5 py-3.5 font-medium text-[#0b2520]">{s.full_name}</td>
                    <td className="px-5 py-3.5 text-[#526a66]">{s.role}</td>
                    <td className="px-5 py-3.5 text-center">
                      <StatusBadge variant={s.is_active ? "success" : "neutral"} size="sm">
                        {s.is_active ? "ACTIVE" : "INACTIVE"}
                      </StatusBadge>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setResetStaffId(s.id)}
                          className="px-2.5 py-1 rounded-lg border border-[#dce8e5] text-[#526a66] hover:text-[#0b2520] hover:bg-stone-50 text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          Reset PIN
                        </button>
                        <button
                          onClick={() => updateStaffProfile(s.id, { is_active: !s.is_active })}
                          className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer ${
                            s.is_active
                              ? "border-[#dce8e5] text-[#526a66] hover:text-rose-700 hover:border-rose-200"
                              : "border-teal-200 text-teal-800 bg-teal-50 hover:bg-teal-100"
                          }`}
                        >
                          {s.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Reset PIN Inline Box */}
          {resetStaffId && (
            <div className="p-4 bg-teal-50/60 border-t border-[#e5eeec] flex flex-col sm:flex-row items-end sm:items-center justify-between gap-3 text-xs">
              <div className="flex-1 w-full">
                <label className="block text-[#0b2520] font-medium mb-1">
                  Enter New PIN for {staffProfiles.find((s) => s.id === resetStaffId)?.full_name}
                </label>
                <input
                  type="password"
                  placeholder="Minimum 6 or 8 digits"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-[#dce8e5] bg-white font-mono text-xs text-[#0b2520] focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                />
              </div>
              <div className="flex items-center gap-2 self-end">
                <button
                  type="button"
                  onClick={() => setResetStaffId(null)}
                  className="px-3 py-1.5 rounded-lg border border-[#dce8e5] text-[#526a66] hover:bg-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleResetPin(resetStaffId)}
                  className="px-3.5 py-1.5 rounded-lg bg-[#0b2520] hover:bg-[#0f766e] text-white font-medium transition-colors cursor-pointer"
                >
                  Confirm PIN
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
