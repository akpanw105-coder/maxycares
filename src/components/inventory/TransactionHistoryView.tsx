"use client";

import React, { useState, useMemo } from "react";
import { useInventory } from "@/context/InventoryContext";
import { SaleRecord, PurchaseRecord } from "@/lib/supabaseClient";
import { TableEmptyState, StatusBadge } from "./UIComponents";
import {
  Search,
  Receipt,
  Truck,
  RotateCcw,
  Eye,
  AlertCircle,
  X,
  CreditCard,
  Banknote,
  Calendar,
  CheckCircle2
} from "lucide-react";

export function TransactionHistoryView() {
  const { sales, purchases, reverseSale, isOwnerAuthenticated } = useInventory();

  const [activeSubTab, setActiveSubTab] = useState<"sales" | "purchases">("sales");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "cash" | "bank_transfer">("all");

  const [selectedSale, setSelectedSale] = useState<SaleRecord | null>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseRecord | null>(null);

  const [reversalSale, setReversalSale] = useState<SaleRecord | null>(null);
  const [reversalReason, setReversalReason] = useState("");
  const [isReversing, setIsReversing] = useState(false);
  const [reversalError, setReversalError] = useState("");

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfWeek = startOfToday - 7 * 24 * 60 * 60 * 1000;
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const saleTime = new Date(s.created_at).getTime();

      if (dateFilter === "today" && saleTime < startOfToday) return false;
      if (dateFilter === "week" && saleTime < startOfWeek) return false;
      if (dateFilter === "month" && saleTime < startOfMonth) return false;

      if (paymentFilter !== "all" && s.payment_method !== paymentFilter) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesRef = s.receipt_number.toLowerCase().includes(term);
        const matchesStaff = s.staff_name.toLowerCase().includes(term);
        const matchesCust = (s.customer_name || "").toLowerCase().includes(term);
        const matchesItem = s.items?.some((i) => i.product_name.toLowerCase().includes(term));
        if (!matchesRef && !matchesStaff && !matchesCust && !matchesItem) return false;
      }

      return true;
    });
  }, [sales, dateFilter, paymentFilter, searchTerm, startOfToday, startOfWeek, startOfMonth]);

  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      const pTime = new Date(p.created_at).getTime();

      if (dateFilter === "today" && pTime < startOfToday) return false;
      if (dateFilter === "week" && pTime < startOfWeek) return false;
      if (dateFilter === "month" && pTime < startOfMonth) return false;

      if (paymentFilter !== "all" && p.payment_method !== paymentFilter) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesInv = p.invoice_number.toLowerCase().includes(term);
        const matchesSup = p.supplier.toLowerCase().includes(term);
        const matchesItem = p.items?.some((i) => i.product_name.toLowerCase().includes(term));
        if (!matchesInv && !matchesSup && !matchesItem) return false;
      }

      return true;
    });
  }, [purchases, dateFilter, paymentFilter, searchTerm, startOfToday, startOfWeek, startOfMonth]);

  const handleConfirmReversal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reversalSale) return;

    setIsReversing(true);
    setReversalError("");

    if (!reversalReason.trim() || reversalReason.trim().length < 5) {
      setReversalError("A reason of at least 5 characters is required.");
      setIsReversing(false);
      return;
    }

    const res = await reverseSale(reversalSale.id, reversalReason.trim());
    if (!res.success) {
      setReversalError(res.message);
      setIsReversing(false);
    } else {
      setIsReversing(false);
      setReversalSale(null);
      setReversalReason("");
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-2xl border border-[#dce8e5] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-[#0b2520]">Transaction History</h2>
          <p className="text-xs text-[#526a66]">
            Immutable records for dispensary sales and incoming stock purchases
          </p>
        </div>

        {/* Sub-tab selection */}
        <div className="flex rounded-xl bg-[#f8fafa] p-1 border border-[#dce8e5] text-xs font-medium">
          <button
            onClick={() => setActiveSubTab("sales")}
            className={`py-1.5 px-3.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === "sales"
                ? "bg-white text-[#0b2520] shadow-xs font-semibold"
                : "text-[#526a66] hover:text-[#0b2520]"
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Sales Receipts ({sales.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab("purchases")}
            className={`py-1.5 px-3.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === "purchases"
                ? "bg-white text-[#0b2520] shadow-xs font-semibold"
                : "text-[#526a66] hover:text-[#0b2520]"
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Stock In Purchases ({purchases.length})</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-[#dce8e5] flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="relative flex-1 min-w-[240px]">
          <input
            type="text"
            placeholder={
              activeSubTab === "sales"
                ? "Filter by receipt #, staff, customer, or medicine..."
                : "Filter by invoice #, supplier, or product..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#dce8e5] bg-[#f8fafa] text-[#0b2520] text-xs focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
          />
          <Search className="w-3.5 h-3.5 text-[#526a66] absolute left-2.5 top-2" />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-lg border border-[#dce8e5] bg-[#f8fafa] text-[#0b2520]"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="week">Past 7 Days</option>
            <option value="month">This Month</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-lg border border-[#dce8e5] bg-[#f8fafa] text-[#0b2520]"
          >
            <option value="all">All Payment Channels</option>
            <option value="cash">Physical Cash Only</option>
            <option value="bank_transfer">Bank Transfer Only</option>
          </select>
        </div>
      </div>

      {/* SALES TABLE */}
      {activeSubTab === "sales" && (
        <div className="bg-white rounded-2xl border border-[#dce8e5] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8fafa] border-b border-[#e5eeec] text-[#526a66] font-medium text-[11px]">
                <tr>
                  <th className="px-5 py-3">Receipt #</th>
                  <th className="px-5 py-3">Date &amp; Time</th>
                  <th className="px-5 py-3">Medicines Dispensed</th>
                  <th className="px-5 py-3">Channel</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3">Duty Staff</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5eeec]">
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <TableEmptyState
                        icon={Receipt}
                        title="No sales receipts found"
                        description="Transactions matching the search or date filter will appear here."
                      />
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((s) => {
                    const itemCount = s.items?.reduce((a, b) => a + b.quantity, 0) || 0;
                    return (
                      <tr key={s.id} className="hover:bg-[#f8fafa]/80 transition-colors">
                        <td className="px-5 py-3.5 font-mono font-medium text-[#0b2520]">{s.receipt_number}</td>
                        <td className="px-5 py-3.5 font-mono text-[#526a66]">
                          {new Date(s.created_at).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="font-medium text-[#0b2520]">
                            {s.items?.[0]?.product_name || "Prescription item"}
                            {s.items && s.items.length > 1 && (
                              <span className="text-[11px] text-[#526a66] font-normal ml-1">
                                +{s.items.length - 1} more
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-[#526a66]">({itemCount} units total)</div>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-[11px] uppercase text-[#526a66]">
                          {s.payment_method.replace("_", " ")}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono font-semibold text-[#0b2520]">
                          ₦{s.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-5 py-3.5 text-[#526a66]">{s.staff_name}</td>
                        <td className="px-5 py-3.5 text-center">
                          <StatusBadge
                            variant={s.status === "completed" ? "success" : "danger"}
                            size="sm"
                          >
                            {s.status.toUpperCase()}
                          </StatusBadge>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedSale(s)}
                              className="px-2.5 py-1 rounded-lg border border-[#dce8e5] text-[#526a66] hover:text-[#0b2520] hover:bg-stone-50 transition-colors flex items-center gap-1 text-[11px] font-medium cursor-pointer"
                              title="View Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </button>
                            {s.status === "completed" && isOwnerAuthenticated && (
                              <button
                                onClick={() => setReversalSale(s)}
                                className="px-2.5 py-1 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-[11px] font-medium transition-colors cursor-pointer"
                              >
                                Reverse
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PURCHASES TABLE */}
      {activeSubTab === "purchases" && (
        <div className="bg-white rounded-2xl border border-[#dce8e5] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8fafa] border-b border-[#e5eeec] text-[#526a66] font-medium text-[11px]">
                <tr>
                  <th className="px-5 py-3">Invoice #</th>
                  <th className="px-5 py-3">Date &amp; Time</th>
                  <th className="px-5 py-3">Supplier</th>
                  <th className="px-5 py-3">Destination</th>
                  <th className="px-5 py-3">Payment Channel</th>
                  <th className="px-5 py-3 text-right">Outflow Amount</th>
                  <th className="px-5 py-3">Recorded By</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5eeec]">
                {filteredPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <TableEmptyState
                        icon={Truck}
                        title="No purchase records found"
                        description="Incoming inventory purchase receipts will be listed here."
                      />
                    </td>
                  </tr>
                ) : (
                  filteredPurchases.map((p) => (
                    <tr key={p.id} className="hover:bg-[#f8fafa]/80 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-medium text-[#0b2520]">{p.invoice_number}</td>
                      <td className="px-5 py-3.5 font-mono text-[#526a66]">
                        {new Date(p.created_at).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-[#0b2520]">{p.supplier}</td>
                      <td className="px-5 py-3.5 font-mono text-[11px] uppercase text-[#526a66]">
                        {p.stock_location.replace("_", " ")}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[11px] uppercase text-[#526a66]">
                        {p.payment_method.replace("_", " ")}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-semibold text-rose-700">
                        ₦{p.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3.5 text-[#526a66]">{p.recorded_by}</td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => setSelectedPurchase(p)}
                          className="px-2.5 py-1 rounded-lg border border-[#dce8e5] text-[#526a66] hover:text-[#0b2520] hover:bg-stone-50 transition-colors flex items-center gap-1 text-[11px] font-medium ml-auto cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sale Details Modal */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#071916]/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#dce8e5] shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e5eeec] flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#526a66] uppercase tracking-wider font-semibold">Receipt Details</span>
                <h3 className="text-sm font-semibold font-mono text-[#0b2520]">{selectedSale.receipt_number}</h3>
              </div>
              <button
                onClick={() => setSelectedSale(null)}
                className="p-1.5 text-stone-400 hover:text-[#0b2520] rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2.5 p-3.5 rounded-xl bg-[#f8fafa] border border-[#dce8e5]">
                <div>
                  <span className="text-[10px] text-[#526a66]">Customer / Patient:</span>
                  <div className="font-medium text-[#0b2520] mt-0.5">{selectedSale.customer_name || "Walk-in"}</div>
                </div>
                <div>
                  <span className="text-[10px] text-[#526a66]">Duty Staff:</span>
                  <div className="font-medium text-[#0b2520] mt-0.5">{selectedSale.staff_name}</div>
                </div>
                <div>
                  <span className="text-[10px] text-[#526a66]">Payment Channel:</span>
                  <div className="font-mono uppercase text-[#0b2520] mt-0.5">{selectedSale.payment_method.replace("_", " ")}</div>
                </div>
                <div>
                  <span className="text-[10px] text-[#526a66]">Dispense Date:</span>
                  <div className="font-mono text-[#0b2520] mt-0.5">{new Date(selectedSale.created_at).toLocaleString()}</div>
                </div>
              </div>

              <div>
                <span className="font-semibold text-[#0b2520] block mb-2">Dispensed Medicines</span>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedSale.items?.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl border border-[#e5eeec] flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium text-[#0b2520]">{item.product_name}</div>
                        <div className="text-[10px] text-[#526a66] font-mono mt-0.5">
                          Batch {item.batch_number} &middot; {item.quantity} units @ ₦{item.unit_selling_price.toLocaleString()}
                        </div>
                      </div>
                      <div className="font-mono font-semibold text-[#0b2520]">
                        ₦{item.total_price.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-teal-50/60 border border-teal-100 flex items-center justify-between">
                <span className="font-medium text-[#0b2520]">Total Amount Paid</span>
                <span className="text-base font-bold font-mono text-teal-900">
                  ₦{selectedSale.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Details Modal */}
      {selectedPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#071916]/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#dce8e5] shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e5eeec] flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#526a66] uppercase tracking-wider font-semibold">Purchase Delivery Invoice</span>
                <h3 className="text-sm font-semibold font-mono text-[#0b2520]">{selectedPurchase.invoice_number}</h3>
              </div>
              <button
                onClick={() => setSelectedPurchase(null)}
                className="p-1.5 text-stone-400 hover:text-[#0b2520] rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2.5 p-3.5 rounded-xl bg-[#f8fafa] border border-[#dce8e5]">
                <div>
                  <span className="text-[10px] text-[#526a66]">Pharmaceutical Supplier:</span>
                  <div className="font-medium text-[#0b2520] mt-0.5">{selectedPurchase.supplier}</div>
                </div>
                <div>
                  <span className="text-[10px] text-[#526a66]">Target Destination:</span>
                  <div className="font-mono uppercase text-[#0b2520] mt-0.5">{selectedPurchase.stock_location.replace("_", " ")}</div>
                </div>
                <div>
                  <span className="text-[10px] text-[#526a66]">Payment Method:</span>
                  <div className="font-mono uppercase text-[#0b2520] mt-0.5">{selectedPurchase.payment_method.replace("_", " ")}</div>
                </div>
                <div>
                  <span className="text-[10px] text-[#526a66]">Recorded By:</span>
                  <div className="text-[#0b2520] mt-0.5">{selectedPurchase.recorded_by}</div>
                </div>
              </div>

              <div>
                <span className="font-semibold text-[#0b2520] block mb-2">Received Medicine Items</span>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedPurchase.items?.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl border border-[#e5eeec] flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium text-[#0b2520]">{item.product_name}</div>
                        <div className="text-[10px] text-[#526a66] font-mono mt-0.5">
                          Batch {item.batch_number} &middot; Exp: {item.expiry_date} ({item.quantity} units @ ₦{item.unit_purchase_cost.toLocaleString()})
                        </div>
                      </div>
                      <div className="font-mono font-medium text-rose-700">
                        ₦{item.total_amount.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-100 flex items-center justify-between">
                <span className="font-medium text-rose-900">Total Purchase Outflow</span>
                <span className="text-base font-bold font-mono text-rose-950">
                  ₦{selectedPurchase.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sale Reversal Dialog */}
      {reversalSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#071916]/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#dce8e5] shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e5eeec] flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-[#0b2520]">Authorize Sale Reversal</h3>
                <p className="text-xs text-[#526a66]">
                  Receipt #{reversalSale.receipt_number} &middot; ₦{reversalSale.total_amount.toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setReversalSale(null)}
                className="p-1.5 text-stone-400 hover:text-[#0b2520] rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmReversal} className="p-6 space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 leading-relaxed">
                This will restore sold quantities back into batch stock, record an immutable reversal entry in the stock movements audit log, and record a refund outflow in the financial ledger.
              </div>

              {reversalError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
                  {reversalError}
                </div>
              )}

              <div>
                <label className="block text-[#0b2520] font-medium mb-1.5">
                  Reason for Reversal / Refund *
                </label>
                <textarea
                  rows={2}
                  required
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  placeholder="e.g. Patient changed prescription; un-opened medicine returned."
                  className="w-full px-3 py-2 rounded-xl border border-[#dce8e5] bg-[#f8fafa] text-[#0b2520] focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#e5eeec]">
                <button
                  type="button"
                  onClick={() => setReversalSale(null)}
                  className="px-4 py-2 border border-[#dce8e5] rounded-xl font-medium hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReversing}
                  className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl font-medium transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isReversing ? "Reversing..." : "Confirm Reversal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
