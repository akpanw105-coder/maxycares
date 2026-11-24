"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { useInventory } from "@/context/InventoryContext";
import { ProductItem } from "@/lib/supabaseClient";

// Modals
import { ShiftGateModal } from "@/components/inventory/ShiftGateModal";
import { EndShiftModal } from "@/components/inventory/EndShiftModal";
import { TransferModal } from "@/components/inventory/TransferModal";
import { AdjustModal } from "@/components/inventory/AdjustModal";
import { ProductModal } from "@/components/inventory/ProductModal";
import { EditProductModal } from "@/components/inventory/EditProductModal";
import { AddBatchModal } from "@/components/inventory/AddBatchModal";
import { StockInModal } from "@/components/inventory/StockInModal";

// Views
import { RecordSaleView } from "@/components/inventory/RecordSaleView";
import { FinancesView } from "@/components/inventory/FinancesView";
import { TransactionHistoryView } from "@/components/inventory/TransactionHistoryView";
import { StaffManagementView } from "@/components/inventory/StaffManagementView";
import { TableEmptyState, StatusBadge, MetricCard } from "@/components/inventory/UIComponents";

import {
  LayoutDashboard,
  ShoppingCart,
  Pill,
  ArrowLeftRight,
  TrendingUp,
  ReceiptText,
  Clock,
  Users,
  LogOut,
  Plus,
  PackagePlus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  DollarSign,
  Boxes,
  ShieldCheck,
  ChevronRight,
  Warehouse,
  Store,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

export default function InventoryDashboardPage() {
  const router = useRouter();
  const {
    isOwnerAuthenticated,
    logoutOwner,
    activeShift,
    shiftDurationFormatted,
    products,
    batches,
    shifts,
    sales,
    purchases,
    expenses,
    ledgerEntries,
    openingBalances,
  } = useInventory();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<
    "overview" | "sale" | "products" | "stock" | "finances" | "history" | "shifts" | "staff"
  >("overview");

  // Modals
  const [isEndShiftOpen, setIsEndShiftOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [isStockInOpen, setIsStockInOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [batchingProduct, setBatchingProduct] = useState<ProductItem | null>(null);

  // Filters & Search for Products Tab
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [stockStatusFilter, setStockStatusFilter] = useState<"all" | "in_stock" | "low_stock" | "out_of_stock">("all");

  // Filters for Stock Control Tab
  const [stockSearchTerm, setStockSearchTerm] = useState("");
  const [stockLotStatusFilter, setStockLotStatusFilter] = useState<"all" | "available" | "near_expiry" | "expired" | "depleted">("all");

  if (!isOwnerAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f8fafa] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-[#dce8e5] text-center max-w-sm w-full space-y-4 shadow-xl shadow-teal-950/5">
          <div className="flex justify-center mb-1">
            <Logo size="md" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-[#0b2520]">Owner Authentication Required</h2>
            <p className="text-xs text-[#526a66] leading-relaxed">
              Please sign in through the single authorised MaxiCare owner portal to access dispensary records.
            </p>
          </div>
          <button
            onClick={() => router.push("/staff/login")}
            className="w-full py-2.5 bg-[#0b2520] hover:bg-[#0f766e] text-white rounded-xl text-xs font-medium transition-colors shadow-xs"
          >
            Go to Owner Login
          </button>
        </div>
      </div>
    );
  }

  // Stock Metrics
  const activeProducts = products.filter((p) => p.is_active);
  const totalProducts = activeProducts.length;
  const totalMainStoreUnits = batches.reduce((acc, b) => acc + (b.quantity_main_store || 0), 0);
  const totalPosTerminalUnits = batches.reduce((acc, b) => acc + (b.quantity_pos_terminal || 0), 0);
  const totalAvailableUnits = totalMainStoreUnits + totalPosTerminalUnits;

  // Valuation
  const totalPurchaseValue = batches.reduce((acc, b) => {
    const totalBatchUnits = (b.quantity_main_store || 0) + (b.quantity_pos_terminal || 0);
    return acc + totalBatchUnits * (b.purchase_cost || 0);
  }, 0);

  const totalPotentialSellingValue = activeProducts.reduce((acc, p) => {
    return acc + (p.total_quantity || 0) * (p.selling_price || 0);
  }, 0);

  // Low stock & alerts
  const lowStockProducts = activeProducts.filter(
    (p) => (p.total_quantity || 0) > 0 && (p.total_quantity || 0) <= p.low_stock_threshold
  );
  const outOfStockProducts = activeProducts.filter((p) => (p.total_quantity || 0) === 0);

  // Expiry
  const today = new Date();
  const nearExpiryBatches = batches.filter((b) => {
    const exp = new Date(b.expiry_date);
    const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 180 && ((b.quantity_main_store || 0) + (b.quantity_pos_terminal || 0)) > 0;
  });
  const expiredBatches = batches.filter((b) => {
    const exp = new Date(b.expiry_date);
    return exp < today;
  });

  // Financial Metrics
  const completedSales = sales.filter((s) => s.status === "completed");
  const totalSalesAmount = completedSales.reduce((acc, s) => acc + (s.total_amount || 0), 0);
  const totalCostOfGoodsSold = completedSales.reduce((acc, s) => acc + (s.total_cost_of_goods || 0), 0);
  const totalGrossProfit = totalSalesAmount - totalCostOfGoodsSold;

  // Reconciled Account Balances from Ledger
  const ledgerCashInflows = ledgerEntries
    .filter((e) => e.channel === "cash" && e.direction === "inflow")
    .reduce((a, b) => a + b.amount, 0);
  const ledgerCashOutflows = ledgerEntries
    .filter((e) => e.channel === "cash" && e.direction === "outflow")
    .reduce((a, b) => a + b.amount, 0);
  const expectedCashBalance = (openingBalances.cash_opening || 0) + ledgerCashInflows - ledgerCashOutflows;

  const ledgerBankInflows = ledgerEntries
    .filter((e) => e.channel === "bank_transfer" && e.direction === "inflow")
    .reduce((a, b) => a + b.amount, 0);
  const ledgerBankOutflows = ledgerEntries
    .filter((e) => e.channel === "bank_transfer" && e.direction === "outflow")
    .reduce((a, b) => a + b.amount, 0);
  const recordedBankBalance = (openingBalances.bank_opening || 0) + ledgerBankInflows - ledgerBankOutflows;

  // Filtered Products
  const filteredProducts = activeProducts.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;

    let matchesStatus = true;
    const qty = p.total_quantity || 0;
    if (stockStatusFilter === "out_of_stock") matchesStatus = qty === 0;
    else if (stockStatusFilter === "low_stock") matchesStatus = qty > 0 && qty <= p.low_stock_threshold;
    else if (stockStatusFilter === "in_stock") matchesStatus = qty > p.low_stock_threshold;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Filtered Batches
  const filteredBatches = batches.filter((b) => {
    const prod = products.find((p) => p.id === b.product_id);
    const matchesSearch =
      b.batch_number.toLowerCase().includes(stockSearchTerm.toLowerCase()) ||
      (prod?.name || "").toLowerCase().includes(stockSearchTerm.toLowerCase());

    const isExpired = new Date(b.expiry_date) < today;
    const exp = new Date(b.expiry_date);
    const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const isNearExpiry = !isExpired && diffDays <= 180;
    const totalBatchUnits = (b.quantity_main_store || 0) + (b.quantity_pos_terminal || 0);

    let matchesStatus = true;
    if (stockLotStatusFilter === "expired") matchesStatus = isExpired;
    else if (stockLotStatusFilter === "near_expiry") matchesStatus = isNearExpiry;
    else if (stockLotStatusFilter === "depleted") matchesStatus = totalBatchUnits === 0;
    else if (stockLotStatusFilter === "available") matchesStatus = !isExpired && totalBatchUnits > 0;

    return matchesSearch && matchesStatus;
  });

  const navigationItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "sale", label: "Point of Sale", icon: ShoppingCart },
    { id: "products", label: "Medicines", icon: Pill, badge: totalProducts },
    { id: "stock", label: "Stock Control", icon: ArrowLeftRight },
    { id: "finances", label: "Finances", icon: TrendingUp },
    { id: "history", label: "Transactions", icon: ReceiptText },
    { id: "shifts", label: "Staff Shifts", icon: Clock },
    { id: "staff", label: "Staff Directory", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafa] flex flex-col selection:bg-teal-100">
      {/* Shift Gate Modal if no active shift */}
      {(!activeShift || activeShift.status !== "active") && <ShiftGateModal />}

      {/* Top Professional Header Bar */}
      <header className="bg-[#0b2520] text-white sticky top-0 z-30 shadow-md shadow-teal-950/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Section Title */}
            <div className="flex items-center gap-3.5">
              <Link href="/" className="hover:opacity-90 transition-opacity">
                <Logo variant="light" size="sm" />
              </Link>
              <div className="h-4 w-px bg-teal-800/80" />
              <div className="flex items-center gap-2">
                <span className="text-xs text-teal-300 font-medium">Dispensary Operations</span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono tracking-wider bg-teal-900/60 text-teal-200 border border-teal-700/50">
                  CLINICAL SUITE
                </span>
              </div>
            </div>

            {/* Shift Context & User Actions */}
            <div className="flex items-center gap-3">
              {activeShift && activeShift.status === "active" ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-900/70 border border-teal-700/70 text-xs shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-medium text-white">{activeShift.staff_name}</span>
                  <span className="text-teal-300/90 font-mono text-[11px]">
                    ({shiftDurationFormatted})
                  </span>
                  <button
                    onClick={() => setIsEndShiftOpen(true)}
                    className="ml-1 text-[11px] font-medium text-teal-200 hover:text-white underline underline-offset-2 transition-colors cursor-pointer"
                  >
                    End Shift
                  </button>
                </div>
              ) : (
                <div className="text-xs text-amber-300 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-950/50 border border-amber-600/50 font-mono">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>SHIFT REQUIRED</span>
                </div>
              )}

              <button
                onClick={logoutOwner}
                className="p-2 text-teal-300/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                title="Sign out of owner account"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Streamlined Main Navigation Bar */}
        <div className="bg-[#071916] border-t border-teal-950/80 overflow-x-auto scrollbar-none">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 text-xs">
            {navigationItems.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-3 px-3.5 border-b-2 font-medium transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "border-teal-400 text-white font-semibold bg-white/5"
                      : "border-transparent text-teal-200/70 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isActive
                          ? "bg-teal-400/20 text-teal-200"
                          : "bg-teal-950 text-teal-300/70"
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex-1">
        {/* ========================================================================= */}
        {/* 1. OVERVIEW DASHBOARD */}
        {/* ========================================================================= */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-fade-in">
            {/* Header with Quick Actions */}
            <div className="bg-white p-5 rounded-2xl border border-[#dce8e5] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-base font-semibold text-[#0b2520]">Dispensary Overview</h1>
                <p className="text-xs text-[#526a66]">
                  Real-time stock quantities, daily revenue, and operational priority alerts
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("sale")}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0b2520] hover:bg-[#0f766e] text-white text-xs font-medium transition-all shadow-xs cursor-pointer"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Point of Sale</span>
                </button>

                <button
                  onClick={() => setIsStockInOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#dce8e5] hover:bg-stone-50 text-[#0b2520] text-xs font-medium transition-colors cursor-pointer"
                >
                  <PackagePlus className="w-3.5 h-3.5 text-teal-800" />
                  <span>Stock In</span>
                </button>

                <button
                  onClick={() => setIsTransferOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#dce8e5] hover:bg-stone-50 text-[#0b2520] text-xs font-medium transition-colors cursor-pointer"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-teal-800" />
                  <span>Transfer</span>
                </button>
              </div>
            </div>

            {/* Core Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Sales Revenue"
                value={`₦${totalSalesAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                subtitle={
                  <span className="text-emerald-700 font-medium">
                    Gross Profit: ₦{totalGrossProfit.toLocaleString()}
                  </span>
                }
                icon={TrendingUp}
              />

              <MetricCard
                title="Physical Cash Drawer"
                value={`₦${expectedCashBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                subtitle="Reconciled Expected Balance"
                icon={Boxes}
              />

              <MetricCard
                title="Recorded Bank Receipts"
                value={`₦${recordedBankBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                subtitle="Electronic Transfer Receipts"
                icon={DollarSign}
              />

              <MetricCard
                title="Available Stock on Hand"
                value={`${totalAvailableUnits} units`}
                subtitle={
                  <div className="flex items-center justify-between w-full font-mono text-[10px]">
                    <span className="flex items-center gap-1 text-[#526a66]">
                      <Warehouse className="w-3 h-3 text-stone-500" /> Main: {totalMainStoreUnits}
                    </span>
                    <span className="flex items-center gap-1 text-teal-800 font-medium">
                      <Store className="w-3 h-3 text-teal-600" /> Counter: {totalPosTerminalUnits}
                    </span>
                  </div>
                }
                icon={Pill}
              />
            </div>

            {/* Valuation & Dual Location Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4.5 rounded-2xl border border-[#dce8e5] shadow-xs flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-[#526a66]">Total Catalog Lines</span>
                  <div className="text-xl font-bold font-mono text-[#0b2520]">{totalProducts} active medicines</div>
                  <div className="text-[11px] text-[#526a66]">{batches.length} total batch lots registered</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center border border-teal-100/60">
                  <Pill className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-4.5 rounded-2xl border border-[#dce8e5] shadow-xs flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-[#526a66]">Inventory Purchase Cost</span>
                  <div className="text-xl font-bold font-mono text-[#0b2520]">
                    ₦{totalPurchaseValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[11px] text-[#526a66]">Acquisition cost of active inventory</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center border border-teal-100/60">
                  <Warehouse className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-4.5 rounded-2xl border border-[#dce8e5] shadow-xs flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-[#526a66]">Potential Sales Valuation</span>
                  <div className="text-xl font-bold font-mono text-teal-900">
                    ₦{totalPotentialSellingValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[11px] text-teal-800 font-medium">Estimated retail realisation</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center border border-teal-100/60">
                  <Store className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Split Section: Stock Alerts & Expiry Watch (FEFO) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Low Stock Watch */}
              <div className="bg-white p-5 rounded-2xl border border-[#dce8e5] shadow-xs space-y-3.5">
                <div className="flex items-center justify-between pb-3 border-b border-[#e5eeec]">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <h3 className="text-xs font-semibold text-[#0b2520]">Stock Level Alerts</h3>
                  </div>
                  <span className="text-[11px] font-mono text-[#526a66]">
                    {lowStockProducts.length + outOfStockProducts.length} Requiring Attention
                  </span>
                </div>

                {lowStockProducts.length === 0 && outOfStockProducts.length === 0 ? (
                  <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-100/70 text-teal-900 text-xs flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                    <span>All stock levels meet or exceed minimum clinical safety thresholds.</span>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1 text-xs">
                    {outOfStockProducts.map((p) => (
                      <div
                        key={p.id}
                        className="p-3 rounded-xl border border-rose-200 bg-rose-50/40 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-medium text-rose-950">{p.name}</div>
                          <div className="text-[10px] text-rose-700 mt-0.5">
                            Out of Stock &middot; Safety Threshold: {p.low_stock_threshold} units
                          </div>
                        </div>
                        <button
                          onClick={() => setIsStockInOpen(true)}
                          className="px-2.5 py-1 rounded-lg bg-rose-200/80 hover:bg-rose-300 text-rose-900 font-medium text-[11px] transition-colors"
                        >
                          Stock In
                        </button>
                      </div>
                    ))}
                    {lowStockProducts.map((p) => (
                      <div
                        key={p.id}
                        className="p-3 rounded-xl border border-amber-200 bg-amber-50/40 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-medium text-amber-950">{p.name}</div>
                          <div className="text-[10px] text-amber-800 mt-0.5">
                            Total: {p.total_quantity} &middot; Min: {p.low_stock_threshold} (Main: {p.total_main_store || 0}, POS: {p.total_pos_terminal || 0})
                          </div>
                        </div>
                        <button
                          onClick={() => setIsTransferOpen(true)}
                          className="px-2.5 py-1 rounded-lg bg-amber-200/80 hover:bg-amber-300 text-amber-900 font-medium text-[11px] transition-colors"
                        >
                          Transfer to POS
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Expiry Watch */}
              <div className="bg-white p-5 rounded-2xl border border-[#dce8e5] shadow-xs space-y-3.5">
                <div className="flex items-center justify-between pb-3 border-b border-[#e5eeec]">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-teal-800" />
                    <h3 className="text-xs font-semibold text-[#0b2520]">Expiry Monitoring (FEFO Priority)</h3>
                  </div>
                  <span className="text-[11px] font-mono text-[#526a66]">
                    {nearExpiryBatches.length + expiredBatches.length} Watchlist Batches
                  </span>
                </div>

                {nearExpiryBatches.length === 0 && expiredBatches.length === 0 ? (
                  <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-100/70 text-teal-900 text-xs flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                    <span>No active batches within the 180-day expiry threshold.</span>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1 text-xs">
                    {expiredBatches.map((b) => {
                      const prod = products.find((p) => p.id === b.product_id);
                      return (
                        <div
                          key={b.id}
                          className="p-3 rounded-xl border border-rose-200 bg-rose-50/40 flex items-center justify-between"
                        >
                          <div>
                            <div className="font-medium text-rose-950">{prod?.name || "Product"}</div>
                            <div className="text-[10px] text-rose-700 font-mono mt-0.5">
                              Batch {b.batch_number} &middot; Expired: {b.expiry_date}
                            </div>
                          </div>
                          <StatusBadge variant="danger" size="sm">EXPIRED (LOCKED)</StatusBadge>
                        </div>
                      );
                    })}
                    {nearExpiryBatches.map((b) => {
                      const prod = products.find((p) => p.id === b.product_id);
                      return (
                        <div
                          key={b.id}
                          className="p-3 rounded-xl border border-[#e5eeec] bg-[#f8fafa] flex items-center justify-between"
                        >
                          <div>
                            <div className="font-medium text-[#0b2520]">{prod?.name || "Product"}</div>
                            <div className="text-[10px] text-[#526a66] font-mono mt-0.5">
                              Batch {b.batch_number} &middot; Exp: {b.expiry_date} (POS: {b.quantity_pos_terminal})
                            </div>
                          </div>
                          <StatusBadge variant="warning" size="sm">&lt; 180 Days (Priority)</StatusBadge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. RECORD SALE VIEW */}
        {/* ========================================================================= */}
        {activeTab === "sale" && <RecordSaleView />}

        {/* ========================================================================= */}
        {/* 3. PRODUCTS CATALOG */}
        {/* ========================================================================= */}
        {activeTab === "products" && (
          <div className="space-y-5 animate-fade-in">
            <div className="bg-white p-5 rounded-2xl border border-[#dce8e5] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-[#0b2520]">Medicines Catalog</h2>
                <p className="text-xs text-[#526a66]">
                  Catalog selling prices &middot; Dual-location stock balances &middot; Batch lot links
                </p>
              </div>
              <button
                onClick={() => setIsAddProductOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0b2520] hover:bg-[#0f766e] text-white text-xs font-medium transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Register Medicine</span>
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-3 rounded-xl border border-[#dce8e5] flex flex-wrap items-center justify-between gap-2.5 text-xs">
              <div className="relative flex-1 min-w-[240px]">
                <input
                  type="text"
                  placeholder="Search by medicine name, SKU, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#dce8e5] bg-[#f8fafa] text-[#0b2520] text-xs focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                />
                <Search className="w-3.5 h-3.5 text-[#526a66] absolute left-2.5 top-2" />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-[#dce8e5] bg-[#f8fafa] text-[#0b2520]"
                >
                  <option value="All">All Categories</option>
                  <option value="Antibiotics & Prescriptions">Antibiotics &amp; Prescriptions</option>
                  <option value="Over-the-Counter">Over-the-Counter</option>
                  <option value="Health & Wellness">Health &amp; Wellness</option>
                  <option value="Personal Care">Personal Care</option>
                  <option value="Medical Devices & Assistance">Medical Devices</option>
                  <option value="Maternal & Child Health">Maternal &amp; Child Health</option>
                </select>

                <select
                  value={stockStatusFilter}
                  onChange={(e) => setStockStatusFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 rounded-lg border border-[#dce8e5] bg-[#f8fafa] text-[#0b2520]"
                >
                  <option value="all">All Stock Statuses</option>
                  <option value="in_stock">Adequate Stock</option>
                  <option value="low_stock">Low Stock (At Threshold)</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
              </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-2xl border border-[#dce8e5] shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f8fafa] border-b border-[#e5eeec] text-[#526a66] font-medium text-[11px]">
                    <tr>
                      <th className="px-5 py-3">SKU</th>
                      <th className="px-5 py-3">Medicine Name</th>
                      <th className="px-5 py-3">Category</th>
                      <th className="px-5 py-3 text-right">Selling Price</th>
                      <th className="px-5 py-3 text-center">Main Store</th>
                      <th className="px-5 py-3 text-center">POS Counter</th>
                      <th className="px-5 py-3 text-center">Total Stock</th>
                      <th className="px-5 py-3 text-center">Status</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5eeec]">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={9}>
                          <TableEmptyState
                            icon={Pill}
                            title="No medicines found"
                            description="No medicines match the selected filter criteria or search keyword."
                          />
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((p) => {
                        const isOutOfStock = (p.total_quantity || 0) === 0;
                        const isLowStock = !isOutOfStock && (p.total_quantity || 0) <= p.low_stock_threshold;

                        return (
                          <tr key={p.id} className="hover:bg-[#f8fafa]/80 transition-colors">
                            <td className="px-5 py-3.5 font-mono text-[#526a66]">{p.sku}</td>
                            <td className="px-5 py-3.5 font-medium text-[#0b2520]">
                              {p.name}
                              <div className="text-[11px] font-normal text-[#526a66]">
                                {p.dosage_form} &middot; {p.unit}
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-[#526a66]">{p.category}</td>
                            <td className="px-5 py-3.5 font-mono text-right font-medium text-[#0b2520]">
                              ₦{p.selling_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-5 py-3.5 text-center font-mono text-[#526a66]">
                              {p.total_main_store || 0}
                            </td>
                            <td className="px-5 py-3.5 text-center font-mono font-medium text-teal-900">
                              {p.total_pos_terminal || 0}
                            </td>
                            <td className="px-5 py-3.5 text-center font-mono font-bold text-[#0b2520]">
                              {p.total_quantity || 0}
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              <StatusBadge
                                variant={isOutOfStock ? "danger" : isLowStock ? "warning" : "success"}
                                size="sm"
                              >
                                {isOutOfStock ? "OUT OF STOCK" : isLowStock ? "LOW STOCK" : "ADEQUATE"}
                              </StatusBadge>
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setBatchingProduct(p)}
                                  className="px-2.5 py-1 rounded-lg border border-[#dce8e5] text-[#526a66] hover:text-[#0b2520] hover:bg-stone-50 text-[11px] font-medium transition-colors cursor-pointer"
                                >
                                  + Batch
                                </button>
                                <button
                                  onClick={() => setEditingProduct(p)}
                                  className="p-1.5 text-stone-400 hover:text-[#0b2520] hover:bg-stone-50 rounded-lg transition-colors cursor-pointer"
                                  title="Edit Medicine"
                                >
                                  <Sliders className="w-3.5 h-3.5" />
                                </button>
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
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. STOCK CONTROL */}
        {/* ========================================================================= */}
        {activeTab === "stock" && (
          <div className="space-y-5 animate-fade-in">
            <div className="bg-white p-5 rounded-2xl border border-[#dce8e5] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-[#0b2520]">Stock &amp; Batch Lots</h2>
                <p className="text-xs text-[#526a66]">
                  Dual-location inventory balance &middot; Expiry tracking (FEFO) &middot; Transfers and adjustments
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsStockInOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0b2520] hover:bg-[#0f766e] text-white text-xs font-medium transition-colors shadow-xs cursor-pointer"
                >
                  <PackagePlus className="w-3.5 h-3.5" />
                  <span>Stock In</span>
                </button>
                <button
                  onClick={() => setIsTransferOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#dce8e5] hover:bg-stone-50 text-[#0b2520] text-xs font-medium transition-colors cursor-pointer"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-teal-800" />
                  <span>Transfer Stock</span>
                </button>
                <button
                  onClick={() => setIsAdjustOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#dce8e5] hover:bg-stone-50 text-[#0b2520] text-xs font-medium transition-colors cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5 text-teal-800" />
                  <span>Adjust Stock</span>
                </button>
              </div>
            </div>

            {/* Batch Search & Filter Bar */}
            <div className="bg-white p-3 rounded-xl border border-[#dce8e5] flex flex-wrap items-center justify-between gap-2.5 text-xs">
              <div className="relative flex-1 min-w-[240px]">
                <input
                  type="text"
                  placeholder="Search by batch lot number or medicine name..."
                  value={stockSearchTerm}
                  onChange={(e) => setStockSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#dce8e5] bg-[#f8fafa] text-[#0b2520] text-xs focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                />
                <Search className="w-3.5 h-3.5 text-[#526a66] absolute left-2.5 top-2" />
              </div>

              <select
                value={stockLotStatusFilter}
                onChange={(e) => setStockLotStatusFilter(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-lg border border-[#dce8e5] bg-[#f8fafa] text-[#0b2520]"
              >
                <option value="all">All Lot Statuses</option>
                <option value="available">Available Stock</option>
                <option value="near_expiry">Near Expiry (&lt; 180 Days)</option>
                <option value="expired">Expired Lots</option>
                <option value="depleted">Depleted (0 Units)</option>
              </select>
            </div>

            {/* Batches Table */}
            <div className="bg-white rounded-2xl border border-[#dce8e5] shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f8fafa] border-b border-[#e5eeec] text-[#526a66] font-medium text-[11px]">
                    <tr>
                      <th className="px-5 py-3">Batch #</th>
                      <th className="px-5 py-3">Medicine</th>
                      <th className="px-5 py-3">Expiry Date</th>
                      <th className="px-5 py-3 text-right">Cost Price</th>
                      <th className="px-5 py-3 text-center">Main Store</th>
                      <th className="px-5 py-3 text-center">POS Terminal</th>
                      <th className="px-5 py-3 text-center">Total Quantity</th>
                      <th className="px-5 py-3 text-center">Lot Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5eeec]">
                    {filteredBatches.length === 0 ? (
                      <tr>
                        <td colSpan={8}>
                          <TableEmptyState
                            icon={Layers}
                            title="No batch lots found"
                            description="No inventory lots matched your filter parameters."
                          />
                        </td>
                      </tr>
                    ) : (
                      filteredBatches.map((b) => {
                        const prod = products.find((p) => p.id === b.product_id);
                        const isExpired = new Date(b.expiry_date) < today;
                        const exp = new Date(b.expiry_date);
                        const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                        const isNearExpiry = !isExpired && diffDays <= 180;
                        const lotTotal = (b.quantity_main_store || 0) + (b.quantity_pos_terminal || 0);

                        return (
                          <tr key={b.id} className="hover:bg-[#f8fafa]/80 transition-colors">
                            <td className="px-5 py-3.5 font-mono font-medium text-[#0b2520]">{b.batch_number}</td>
                            <td className="px-5 py-3.5 font-medium text-[#0b2520]">{prod?.name || "Product"}</td>
                            <td className="px-5 py-3.5 font-mono text-[#526a66]">{b.expiry_date}</td>
                            <td className="px-5 py-3.5 font-mono text-right text-[#0b2520]">
                              ₦{b.purchase_cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-5 py-3.5 text-center font-mono text-[#526a66]">{b.quantity_main_store}</td>
                            <td className="px-5 py-3.5 text-center font-mono font-medium text-teal-900">{b.quantity_pos_terminal}</td>
                            <td className="px-5 py-3.5 text-center font-mono font-bold text-[#0b2520]">{lotTotal}</td>
                            <td className="px-5 py-3.5 text-center">
                              <StatusBadge
                                variant={
                                  isExpired
                                    ? "danger"
                                    : lotTotal === 0
                                    ? "neutral"
                                    : isNearExpiry
                                    ? "warning"
                                    : "success"
                                }
                                size="sm"
                              >
                                {isExpired
                                  ? "EXPIRED"
                                  : lotTotal === 0
                                  ? "DEPLETED"
                                  : isNearExpiry
                                  ? "NEAR EXPIRY"
                                  : "AVAILABLE"}
                              </StatusBadge>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. FINANCES VIEW */}
        {/* ========================================================================= */}
        {activeTab === "finances" && <FinancesView />}

        {/* ========================================================================= */}
        {/* 6. HISTORY VIEW */}
        {/* ========================================================================= */}
        {activeTab === "history" && <TransactionHistoryView />}

        {/* ========================================================================= */}
        {/* 7. STAFF SHIFTS */}
        {/* ========================================================================= */}
        {activeTab === "shifts" && (
          <div className="space-y-5 animate-fade-in">
            <div className="bg-white p-5 rounded-2xl border border-[#dce8e5] shadow-xs flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-[#0b2520]">Staff Shifts &amp; Handover History</h2>
                <p className="text-xs text-[#526a66]">
                  Duty shifts, physical cash counted, and discrepancy verification
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#dce8e5] shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f8fafa] border-b border-[#e5eeec] text-[#526a66] font-medium text-[11px]">
                    <tr>
                      <th className="px-5 py-3">Staff Name</th>
                      <th className="px-5 py-3">Start Time</th>
                      <th className="px-5 py-3">End Time</th>
                      <th className="px-5 py-3">Duration</th>
                      <th className="px-5 py-3 text-right">Total Sales</th>
                      <th className="px-5 py-3 text-right">Expected Cash</th>
                      <th className="px-5 py-3 text-right">Counted Cash</th>
                      <th className="px-5 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5eeec]">
                    {shifts.length === 0 ? (
                      <tr>
                        <td colSpan={8}>
                          <TableEmptyState
                            icon={Clock}
                            title="No shifts recorded yet"
                            description="Staff duty shifts and handovers will appear here once initiated."
                          />
                        </td>
                      </tr>
                    ) : (
                      shifts.map((s) => {
                        const hrs = s.duration_seconds ? Math.floor(s.duration_seconds / 3600) : 0;
                        const mins = s.duration_seconds ? Math.floor((s.duration_seconds % 3600) / 60) : 0;
                        return (
                          <tr key={s.id} className="hover:bg-[#f8fafa]/80 transition-colors">
                            <td className="px-5 py-3.5 font-medium text-[#0b2520]">{s.staff_name}</td>
                            <td className="px-5 py-3.5 font-mono text-[#526a66]">{new Date(s.start_time).toLocaleString()}</td>
                            <td className="px-5 py-3.5 font-mono text-[#526a66]">
                              {s.end_time ? new Date(s.end_time).toLocaleString() : "—"}
                            </td>
                            <td className="px-5 py-3.5 font-mono text-[#0b2520]">
                              {s.duration_seconds ? `${hrs}h ${mins}m` : "Active"}
                            </td>
                            <td className="px-5 py-3.5 text-right font-mono text-[#0b2520]">
                              ₦{(s.total_sales_amount || 0).toLocaleString()}
                            </td>
                            <td className="px-5 py-3.5 text-right font-mono text-[#526a66]">
                              ₦{(s.expected_cash || 0).toLocaleString()}
                            </td>
                            <td className="px-5 py-3.5 text-right font-mono font-medium text-[#0b2520]">
                              {s.counted_cash !== null && s.counted_cash !== undefined ? `₦${s.counted_cash.toLocaleString()}` : "—"}
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              <StatusBadge
                                variant={s.status === "active" ? "info" : "neutral"}
                                size="sm"
                              >
                                {s.status.toUpperCase()}
                              </StatusBadge>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 8. STAFF DIRECTORY */}
        {/* ========================================================================= */}
        {activeTab === "staff" && <StaffManagementView />}
      </main>

      {/* Operation Modals */}
      <EndShiftModal isOpen={isEndShiftOpen} onClose={() => setIsEndShiftOpen(false)} />
      <TransferModal isOpen={isTransferOpen} onClose={() => setIsTransferOpen(false)} />
      <AdjustModal isOpen={isAdjustOpen} onClose={() => setIsAdjustOpen(false)} />
      <StockInModal isOpen={isStockInOpen} onClose={() => setIsStockInOpen(false)} />
      <ProductModal isOpen={isAddProductOpen} onClose={() => setIsAddProductOpen(false)} />
      <EditProductModal product={editingProduct} isOpen={!!editingProduct} onClose={() => setEditingProduct(null)} />
      <AddBatchModal product={batchingProduct} isOpen={!!batchingProduct} onClose={() => setBatchingProduct(null)} />
    </div>
  );
}
