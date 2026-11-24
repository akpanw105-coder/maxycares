"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { useInventory } from "@/context/InventoryContext";
import { Lock, Mail, ArrowLeft, ShieldCheck, AlertCircle, CheckCircle2, KeyRound } from "lucide-react";

export default function StaffLoginPage() {
  const router = useRouter();
  const { loginAsOwner } = useInventory();
  
  // Authorized owner credentials (test@gmail.com)
  const [email, setEmail] = useState("test@gmail.com");
  const [password, setPassword] = useState("MaxiCare2026!Secure");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleOwnerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Simulate verified owner verification with configured Clerk account
    setTimeout(() => {
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail === "test@gmail.com" || normalizedEmail === "owner@maxicare.ng") {
        loginAsOwner(email);
        router.push("/staff/inventory");
      } else {
        setError("Access restricted. Only the single authorized MaxiCare Pharmacy owner account is permitted.");
        setIsLoading(false);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#f8fafa] flex flex-col justify-between p-4 sm:p-6 lg:p-8 selection:bg-teal-100">
      {/* Discreet top bar */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-[#4e6360] hover:text-[#0b2520] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dispensary Portal</span>
        </Link>

        <span className="inline-flex items-center gap-1.5 text-[11px] font-mono tracking-wider px-3.5 py-1 rounded-full bg-teal-900/5 text-teal-900 border border-teal-900/15">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
          AUTHORISED OWNER GATEWAY
        </span>
      </div>

      {/* Main card */}
      <div className="w-full max-w-md mx-auto my-10">
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#dce8e5] shadow-xl shadow-teal-950/5 space-y-7">
          <div className="text-center space-y-2.5">
            <div className="flex justify-center mb-1">
              <Logo size="md" />
            </div>
            <h1 className="text-2xl font-bold text-[#0b2520] tracking-tight">
              Dispensary Authentication
            </h1>
            <p className="text-xs text-[#526a66] leading-relaxed">
              Discreet pharmacy management gateway. Single authorised owner account required to access inventory, sales, and clinical records.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleOwnerLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#0b2520] mb-1.5">
                Authorised Owner Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="test@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#dce8e5] text-xs focus:outline-none focus:ring-2 focus:ring-[#0f766e] bg-[#f8fafa] text-[#0b2520]"
                />
                <Mail className="w-4 h-4 text-[#526a66] absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0b2520] mb-1.5">
                Owner Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#dce8e5] text-xs focus:outline-none focus:ring-2 focus:ring-[#0f766e] bg-[#f8fafa] text-[#0b2520] font-mono"
                />
                <Lock className="w-4 h-4 text-[#526a66] absolute left-3.5 top-3" />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-teal-50/60 border border-teal-100/80 text-[11px] text-[#0b2520] space-y-1">
              <div className="font-semibold text-teal-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" />
                <span>Pre-configured Credentials</span>
              </div>
              <p className="text-teal-800">
                Email: <span className="font-mono font-medium">test@gmail.com</span>
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-[#0b2520] hover:bg-[#0f766e] text-white font-medium text-xs transition-all shadow-md shadow-teal-950/10 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? "Authenticating..." : "Sign In to Dispensary Operations"}
            </button>
          </form>
        </div>
      </div>

      {/* Discreet footer note */}
      <div className="max-w-md w-full mx-auto text-center text-[11px] text-[#526a66]">
        &copy; 2026 MaxiCare Pharmacy Ltd. Clinical Operations &middot; Confidential
      </div>
    </div>
  );
}
