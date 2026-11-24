"use client";

import React, { useState } from "react";
import { useInventory } from "@/context/InventoryContext";
import { TableEmptyState, MetricCard, StatusBadge } from "./UIComponents";
import {
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Building,
  AlertCircle,
  X,
  Receipt,
  Scale,
  CreditCard,
  DollarSign,
  FileSpreadsheet
} from "lucide-react";

export function FinancesView() {
  const {
    sales,
    purchases,
    expenses,
    ledgerEntries,
    openingBalances,
    updateOpeningBalances,
    recordExpense,
  } = useInventory();

  const [financeTab, setFinanceTab] = useState<"overview" | "expenses" | "ledger" | "settings">("overview");

  // Record Expense Form Modal
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [category, setCategory] = useState<any>("Electricity");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number>(5000);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "bank_transfer">("cash");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expenseError, setExpenseError] = useState("");

  // Opening Balances Form
  const [cashOpeningInput, setCashOpeningInput] = useState<number>(openingBalances.cash_opening || 0);
  const [bankOpeningInput, setBankOpeningInput] = useState<number>(openingBalances.bank_opening || 0);
  const [openingNotes, setOpeningNotes] = useState(openingBalances.notes || "Initial balance configuration");
  const [isSavingBalances, setIsSavingBalances] = useState(false);
  const [balancesSavedMsg, setBalancesSavedMsg] = useState("");

  const [ledgerChannelFilter, setLedgerChannelFilter] = useState<"all" | "cash" | "bank_transfer">("all");

  // Calculations
  const completedSales = sales.filter((s) => s.status === "completed");
  const totalSalesRevenue = completedSales.reduce((acc, s) => acc + (s.total_amount || 0), 0);
  const totalCashSales = completedSales.filter((s) => s.payment_method === "cash").reduce((acc, s) => acc + (s.total_amount || 0), 0);
  const totalBankSales = completedSales.filter((s) => s.payment_method === "bank_transfer").reduce((acc, s) => acc + (s.total_amount || 0), 0);
  const totalCostOfGoodsSold = completedSales.reduce((acc, s) => acc + (s.total_cost_of_goods || 0), 0);
  const grossProfit = totalSalesRevenue - totalCostOfGoodsSold;

  const totalPurchaseSpending = purchases.reduce((acc, p) => acc + (p.total_amount || 0), 0);
  const cashPurchases = purchases.filter((p) => p.payment_method === "cash").reduce((acc, p) => acc + (p.total_amount || 0), 0);
  const bankPurchases = purchases.filter((p) => p.payment_method === "bank_transfer").reduce((acc, p) => acc + (p.total_amount || 0), 0);

  const totalExpenses = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  const cashExpenses = expenses.filter((e) => e.payment_method === "cash").reduce((acc, e) => acc + (e.amount || 0), 0);
  const bankExpenses = expenses.filter((e) => e.payment_method === "bank_transfer").reduce((acc, e) => acc + (e.amount || 0), 0);

  const netOperatingResult = grossProfit - totalExpenses;

  // Ledger Balances
  const ledgerCashInflows = ledgerEntries
    .filter((e) => e.channel === "cash" && e.direction === "inflow")
    .reduce((acc, e) => acc + e.amount, 0);
  const ledgerCashOutflows = ledgerEntries
    .filter((e) => e.channel === "cash" && e.direction === "outflow")
    .reduce((acc, e) => acc + e.amount, 0);

  const ledgerBankInflows = ledgerEntries
    .filter((e) => e.channel === "bank_transfer" && e.direction === "inflow")
    .reduce((acc, e) => acc + e.amount, 0);
  const ledgerBankOutflows = ledgerEntries
    .filter((e) => e.channel === "bank_transfer" && e.direction === "outflow")
    .reduce((acc, e) => acc + e.amount, 0);

  const expectedCashBalance = (openingBalances.cash_opening || 0) + ledgerCashInflows - ledgerCashOutflows;
  const recordedBankBalance = (openingBalances.bank_opening || 0) + ledgerBankInflows - ledgerBankOutflows;

  const filteredLedger = ledgerEntries.filter((e) => {
    if (ledgerChannelFilter === "all") return true;
    return e.channel === ledgerChannelFilter;
  });

  const handleRecordExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setExpenseError("");
    setIsSubmitting(true);

    if (amount <= 0) {
      setExpenseError("Expense amount must be greater than zero.");
      setIsSubmitting(false);
      return;
    }

    if (!description.trim()) {
      setExpenseError("Description is required.");
      setIsSubmitting(false);
      return;
    }

    const res = await recordExpense(category, description.trim(), Number(amount), paymentMethod, notes.trim());
    if (!res.success) {
      setExpenseError(res.message);
    } else {
      setDescription("");
      setAmount(5000);
      setNotes("");
      setIsAddExpenseOpen(false);
    }
    setIsSubmitting(false);
  };

  const handleSaveBalances = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBalances(true);
    setBalancesSavedMsg("");

    const res = await updateOpeningBalances(
      Number(cashOpeningInput),
      Number(bankOpeningInput),
      openingNotes
    );

    if (res.success) {
      setBalancesSavedMsg("Opening balances saved and reconciled successfully.");
      setTimeout(() => setBalancesSavedMsg(""), 4000);
    } else {
      alert(res.message);
    }
    setIsSavingBalances(false);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-2xl border border-[#dce8e5] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-[#0b2520]">Financial Management</h2>
          <p className="text-xs text-[#526a66]">
            Reconciled physical cash &middot; Recorded electronic bank transfers &middot; Real-time profit &amp; expenses
          </p>
        </div>
        <button
          onClick={() => setIsAddExpenseOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0b2520] hover:bg-[#0f766e] text-white text-xs font-medium transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Record Expense</span>
        </button>
      </div>

      {/* Clean Pill Sub-tabs */}
      <div className="flex border-b border-[#e5eeec] text-xs font-medium gap-6">
        {[
          { id: "overview", label: "Financial Overview" },
          { id: "expenses", label: `Operational Expenses (${expenses.length})` },
          { id: "ledger", label: `Double-Entry Ledger (${ledgerEntries.length})` },
          { id: "settings", label: "Opening Balances" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setFinanceTab(t.id as any)}
            className={`pb-3 transition-colors cursor-pointer border-b-2 -mb-px ${
              financeTab === t.id
                ? "border-[#0b2520] text-[#0b2520] font-semibold"
                : "border-transparent text-[#526a66] hover:text-[#0b2520]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: FINANCIAL OVERVIEW */}
      {financeTab === "overview" && (
        <div className="space-y-5">
          {/* Main Account Balances */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CASH DRAWER */}
            <div className="bg-white p-5 rounded-2xl border border-[#dce8e5] shadow-xs space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center border border-teal-100/60">
                    <Wallet className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-[#0b2520]">Physical Cash Account</h3>
                    <p className="text-[11px] text-[#526a66]">Dispensary drawer register</p>
                  </div>
                </div>
                <StatusBadge variant="success" size="sm">
                  RECONCILED
                </StatusBadge>
              </div>

              <div>
                <span className="text-[11px] text-[#526a66]">Expected Drawer Balance</span>
                <div className="text-2xl font-bold font-mono text-[#0b2520] mt-0.5">
                  ₦{expectedCashBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-[#e5eeec] text-xs">
                <div className="p-2.5 rounded-xl bg-[#f8fafa] border border-[#e5eeec]">
                  <div className="text-[10px] text-[#526a66]">Opening Cash</div>
                  <div className="font-mono font-medium text-[#0b2520] mt-0.5">
                    ₦{(openingBalances.cash_opening || 0).toLocaleString()}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100">
                  <div className="text-[10px] text-emerald-700">Cash Inflows (+)</div>
                  <div className="font-mono font-medium text-emerald-900 mt-0.5">
                    ₦{totalCashSales.toLocaleString()}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-rose-50/50 border border-rose-100">
                  <div className="text-[10px] text-rose-700">Cash Outflows (-)</div>
                  <div className="font-mono font-medium text-rose-900 mt-0.5">
                    ₦{(cashPurchases + cashExpenses).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* BANK ACCOUNT */}
            <div className="bg-white p-5 rounded-2xl border border-[#dce8e5] shadow-xs space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center border border-teal-100/60">
                    <Building className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-[#0b2520]">Recorded Bank Transfers</h3>
                    <p className="text-[11px] text-[#526a66]">Dispensary electronic receipts</p>
                  </div>
                </div>
                <StatusBadge variant="info" size="sm">
                  RECORDED
                </StatusBadge>
              </div>

              <div>
                <span className="text-[11px] text-[#526a66]">Recorded Bank Balance</span>
                <div className="text-2xl font-bold font-mono text-teal-900 mt-0.5">
                  ₦{recordedBankBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-[#e5eeec] text-xs">
                <div className="p-2.5 rounded-xl bg-[#f8fafa] border border-[#e5eeec]">
                  <div className="text-[10px] text-[#526a66]">Opening Bank</div>
                  <div className="font-mono font-medium text-[#0b2520] mt-0.5">
                    ₦{(openingBalances.bank_opening || 0).toLocaleString()}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100">
                  <div className="text-[10px] text-emerald-700">Transfer Sales (+)</div>
                  <div className="font-mono font-medium text-emerald-900 mt-0.5">
                    ₦{totalBankSales.toLocaleString()}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-rose-50/50 border border-rose-100">
                  <div className="text-[10px] text-rose-700">Outflows (-)</div>
                  <div className="font-mono font-medium text-rose-900 mt-0.5">
                    ₦{(bankPurchases + bankExpenses).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Operating Result Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Sales Revenue"
              value={`₦${totalSalesRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
              subtitle={`${completedSales.length} Dispensed Sales Transactions`}
              icon={Receipt}
            />

            <MetricCard
              title="Cost of Goods (COGS)"
              value={`₦${totalCostOfGoodsSold.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
              subtitle="Batch lot purchase cost basis"
              icon={Scale}
            />

            <MetricCard
              title="Gross Trading Profit"
              value={`₦${grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
              subtitle={`Margin: ${totalSalesRevenue > 0 ? ((grossProfit / totalSalesRevenue) * 100).toFixed(1) : 0}%`}
              icon={ArrowUpRight}
            />

            <MetricCard
              title="Net Operating Result"
              value={`₦${netOperatingResult.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
              subtitle={`After ₦${totalExpenses.toLocaleString()} Operational Expenses`}
              icon={DollarSign}
              trend={{
                label: netOperatingResult >= 0 ? "Surplus" : "Deficit",
                positive: netOperatingResult >= 0,
              }}
            />
          </div>
        </div>
      )}

      {/* TAB 2: EXPENSES */}
      {financeTab === "expenses" && (
        <div className="bg-white rounded-2xl border border-[#dce8e5] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8fafa] border-b border-[#e5eeec] text-[#526a66] font-medium text-[11px]">
                <tr>
                  <th className="px-5 py-3">Ref #</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3">Channel</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5eeec]">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <TableEmptyState
                        title="No operational expenses recorded yet"
                        description="Click 'Record Expense' to log dispensary utility bills, repairs, or disbursements."
                      />
                    </td>
                  </tr>
                ) : (
                  expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-[#f8fafa]/80 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-[#526a66]">{exp.expense_number}</td>
                      <td className="px-5 py-3.5 text-[#526a66]">{exp.expense_date}</td>
                      <td className="px-5 py-3.5 text-[#0b2520] font-medium">{exp.category}</td>
                      <td className="px-5 py-3.5 text-[#0b2520]">{exp.description}</td>
                      <td className="px-5 py-3.5 font-mono text-[11px] uppercase text-[#526a66]">
                        {exp.payment_method.replace("_", " ")}
                      </td>
                      <td className="px-5 py-3.5 font-mono font-medium text-rose-700 text-right">
                        -₦{exp.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3.5 text-[#526a66]">{exp.recorded_by}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT LEDGER */}
      {financeTab === "ledger" && (
        <div className="bg-white rounded-2xl border border-[#dce8e5] shadow-xs overflow-hidden">
          {/* Channel Filter */}
          <div className="p-3.5 border-b border-[#e5eeec] flex flex-wrap items-center justify-between gap-2.5 text-xs">
            <span className="text-[#526a66]">Double-entry ledger log (Immutable financial audit trail)</span>
            <div className="flex items-center gap-2">
              <span className="text-[#526a66]">Filter Channel:</span>
              <select
                value={ledgerChannelFilter}
                onChange={(e) => setLedgerChannelFilter(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-lg border border-[#dce8e5] bg-[#f8fafa] text-[#0b2520]"
              >
                <option value="all">All Channels</option>
                <option value="cash">Physical Cash Only</option>
                <option value="bank_transfer">Bank Transfer Only</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8fafa] border-b border-[#e5eeec] text-[#526a66] font-medium text-[11px]">
                <tr>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">Ref #</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Channel</th>
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3 text-right">Flow Amount</th>
                  <th className="px-5 py-3">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5eeec]">
                {filteredLedger.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <TableEmptyState
                        icon={FileSpreadsheet}
                        title="No ledger entries found"
                        description="Transactions and reconciliation logs will appear here."
                      />
                    </td>
                  </tr>
                ) : (
                  filteredLedger.map((entry) => (
                    <tr key={entry.id} className="hover:bg-[#f8fafa]/80 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-[#526a66]">
                        {new Date(entry.created_at).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[#0b2520]">{entry.transaction_ref}</td>
                      <td className="px-5 py-3.5 font-mono text-[11px] uppercase text-[#526a66]">{entry.entry_type}</td>
                      <td className="px-5 py-3.5 font-mono text-[11px] uppercase text-[#526a66]">{entry.channel.replace("_", " ")}</td>
                      <td className="px-5 py-3.5 text-[#0b2520]">{entry.description}</td>
                      <td className="px-5 py-3.5 text-right font-mono font-medium">
                        {entry.direction === "inflow" ? (
                          <span className="text-emerald-700">
                            +₦{entry.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-rose-700">
                            -₦{entry.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-[#526a66]">{entry.recorded_by}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SETTINGS / OPENING BALANCES */}
      {financeTab === "settings" && (
        <div className="max-w-xl bg-white p-6 rounded-2xl border border-[#dce8e5] shadow-xs space-y-4 text-xs">
          <div>
            <h3 className="text-sm font-semibold text-[#0b2520]">Dispensary Opening Balances</h3>
            <p className="text-xs text-[#526a66]">Base financial foundation for physical drawer and electronic bank tracking</p>
          </div>

          {balancesSavedMsg && (
            <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 font-medium">
              {balancesSavedMsg}
            </div>
          )}

          <form onSubmit={handleSaveBalances} className="space-y-3.5">
            <div>
              <label className="block text-[#0b2520] font-medium mb-1">Starting Cash in Drawer (₦)</label>
              <input
                type="number"
                min="0"
                value={cashOpeningInput}
                onChange={(e) => setCashOpeningInput(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-[#dce8e5] bg-[#f8fafa] font-mono text-[#0b2520] focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
              />
            </div>

            <div>
              <label className="block text-[#0b2520] font-medium mb-1">Starting Bank Balance (₦)</label>
              <input
                type="number"
                min="0"
                value={bankOpeningInput}
                onChange={(e) => setBankOpeningInput(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-[#dce8e5] bg-[#f8fafa] font-mono text-[#0b2520] focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
              />
            </div>

            <div>
              <label className="block text-[#0b2520] font-medium mb-1">Setup Notes</label>
              <input
                type="text"
                value={openingNotes}
                onChange={(e) => setOpeningNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#dce8e5] bg-[#f8fafa] text-[#0b2520] focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
              />
            </div>

            <button
              type="submit"
              disabled={isSavingBalances}
              className="px-4 py-2.5 bg-[#0b2520] hover:bg-[#0f766e] text-white rounded-xl font-medium transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isSavingBalances ? "Saving..." : "Save & Reconcile Opening Balances"}
            </button>
          </form>
        </div>
      )}

      {/* Record Expense Form Modal */}
      {isAddExpenseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#071916]/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#dce8e5] shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e5eeec] flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-[#0b2520]">Record Operational Expense</h3>
                <p className="text-xs text-[#526a66]">Log utility bills, cleaning, logistics, or maintenance</p>
              </div>
              <button
                onClick={() => setIsAddExpenseOpen(false)}
                className="p-1.5 text-stone-400 hover:text-[#0b2520] rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordExpenseSubmit} className="p-6 space-y-4 text-xs">
              {expenseError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{expenseError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#0b2520] font-medium mb-1">Expense Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#dce8e5] bg-[#f8fafa] text-[#0b2520] focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                  >
                    <option value="Electricity">Electricity / Generator</option>
                    <option value="Staff Refreshments">Staff Refreshments</option>
                    <option value="Cleaning & Sanitation">Cleaning &amp; Sanitation</option>
                    <option value="Store Supplies">Store Supplies</option>
                    <option value="Repairs & Maintenance">Repairs &amp; Maintenance</option>
                    <option value="Logistics & Delivery">Logistics &amp; Delivery</option>
                    <option value="Other">Other Operational</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#0b2520] font-medium mb-1">Amount (₦) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-[#dce8e5] bg-[#f8fafa] font-mono text-[#0b2520] focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#0b2520] font-medium mb-1">Description / Vendor *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fuel for generator - 25 Litres"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#dce8e5] bg-[#f8fafa] text-[#0b2520] focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                />
              </div>

              <div>
                <label className="block text-[#0b2520] font-medium mb-1">Disbursement Channel *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cash")}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                      paymentMethod === "cash"
                        ? "bg-[#0b2520] text-white border-[#0b2520]"
                        : "bg-[#f8fafa] text-[#526a66] border-[#dce8e5] hover:bg-stone-50"
                    }`}
                  >
                    Cash Drawer Outflow
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("bank_transfer")}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                      paymentMethod === "bank_transfer"
                        ? "bg-[#0b2520] text-white border-[#0b2520]"
                        : "bg-[#f8fafa] text-[#526a66] border-[#dce8e5] hover:bg-stone-50"
                    }`}
                  >
                    Bank Transfer Outflow
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[#0b2520] font-medium mb-1">Additional Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="Receipt # or approval reference"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#dce8e5] bg-[#f8fafa] text-[#0b2520] focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#e5eeec]">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseOpen(false)}
                  className="px-4 py-2 border border-[#dce8e5] rounded-xl font-medium hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#0b2520] hover:bg-[#0f766e] text-white rounded-xl font-medium transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Recording..." : "Record Disbursement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
