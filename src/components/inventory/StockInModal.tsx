"use client";

import React, { useState } from "react";
import { useInventory } from "@/context/InventoryContext";
import { PackagePlus, X, AlertCircle, Building, Warehouse, Store, CreditCard, Banknote } from "lucide-react";

interface StockInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StockInModal({ isOpen, onClose }: StockInModalProps) {
  const { products, recordStockIntake, addProduct } = useInventory();

  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [selectedProductId, setSelectedProductId] = useState<string>("");

  // New product fields
  const [newSku, setNewSku] = useState("");
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("Antibiotics & Prescriptions");
  const [newDosage, setNewDosage] = useState("Tablet");
  const [newUnit, setNewUnit] = useState("Packs (10s)");
  const [newSellingPrice, setNewSellingPrice] = useState<number>(1500);

  // Common Stock In Fields
  const [quantity, setQuantity] = useState<number>(50);
  const [purchaseCost, setPurchaseCost] = useState<number>(1000);
  const [batchNumber, setBatchNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("2028-12-31");
  const [location, setLocation] = useState<"main_store" | "pos_terminal">("main_store");
  const [supplier, setSupplier] = useState("Emzor Pharmaceuticals Nig Ltd");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "bank_transfer">("bank_transfer");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!batchNumber.trim()) {
      setErrorMsg("Batch lot number is required.");
      return;
    }

    if (quantity <= 0) {
      setErrorMsg("Quantity received must be greater than zero.");
      return;
    }

    setIsSubmitting(true);

    try {
      let targetProductId = selectedProductId;

      if (mode === "new") {
        if (!newName.trim()) {
          setErrorMsg("Medicine name is required.");
          setIsSubmitting(false);
          return;
        }

        const addRes = await addProduct({
          sku: newSku.trim() || `MXC-${Date.now().toString().slice(-6)}`,
          name: newName.trim(),
          category: newCategory,
          dosage_form: newDosage,
          unit: newUnit,
          selling_price: Number(newSellingPrice),
          supplier: supplier,
        });

        if (!addRes.success) {
          setErrorMsg(addRes.message);
          setIsSubmitting(false);
          return;
        }

        targetProductId = products.find((p) => p.name.toLowerCase() === newName.trim().toLowerCase())?.id || "";
      }

      if (!targetProductId && products.length > 0 && mode === "existing") {
        targetProductId = selectedProductId || products[0].id;
      }

      const intakeRes = await recordStockIntake(
        targetProductId,
        Number(quantity),
        Number(purchaseCost),
        batchNumber.trim(),
        expiryDate,
        location,
        supplier,
        paymentMethod
      );

      if (!intakeRes.success) {
        setErrorMsg(intakeRes.message);
        setIsSubmitting(false);
      } else {
        setIsSubmitting(false);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to record stock intake.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#071916]/70 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-[#dce8e5] shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-[#e5eeec] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center border border-teal-100/60">
              <PackagePlus className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#0b2520]">Receive Inbound Stock</h2>
              <p className="text-xs text-[#526a66]">Log supplier deliveries, purchase costs, and batch lot numbers</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Mode Switch: Existing Medicine vs Register Brand New */}
          <div className="flex rounded-xl bg-[#f8fafa] p-1 border border-[#dce8e5] text-xs font-medium">
            <button
              type="button"
              onClick={() => setMode("existing")}
              className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                mode === "existing"
                  ? "bg-white text-[#0b2520] shadow-xs font-semibold"
                  : "text-[#526a66] hover:text-[#0b2520]"
              }`}
            >
              Add Stock to Existing Medicine
            </button>
            <button
              type="button"
              onClick={() => setMode("new")}
              className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                mode === "new"
                  ? "bg-white text-[#0b2520] shadow-xs font-semibold"
                  : "text-[#526a66] hover:text-[#0b2520]"
              }`}
            >
              New Medicine Delivery
            </button>
          </div>

          {mode === "existing" ? (
            <div>
              <label className="block text-[#0b2520] font-medium mb-1.5">Select Medicine *</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#dce8e5] bg-[#f8fafa] text-[#0b2520] focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
              >
                {products
                  .filter((p) => p.is_active)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku} &middot; Current stock: {p.total_quantity || 0})
                    </option>
                  ))}
              </select>
            </div>
          ) : (
            <div className="space-y-3 p-4 rounded-2xl bg-[#f8fafa] border border-[#dce8e5]">
              <div className="font-semibold text-[#0b2520] text-xs">New Medicine Specification</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#0b2520] font-medium mb-1">Medicine Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amoxicillin 500mg"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-[#dce8e5] bg-white text-[#0b2520] focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                  />
                </div>
                <div>
                  <label className="block text-[#0b2520] font-medium mb-1">SKU / Code</label>
                  <input
                    type="text"
                    placeholder="Auto-generated if empty"
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-[#dce8e5] bg-white font-mono text-[#0b2520] focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#0b2520] font-medium mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-[#dce8e5] bg-white text-[#0b2520] focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                  >
                    <option value="Antibiotics & Prescriptions">Antibiotics &amp; Prescriptions</option>
                    <option value="Over-the-Counter">Over-the-Counter</option>
                    <option value="Health & Wellness">Health &amp; Wellness</option>
                    <option value="Medical Devices & Assistance">Medical Devices</option>
                    <option value="Personal Care">Personal Care</option>
                    <option value="Maternal & Child Health">Maternal &amp; Child Health</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#0b2520] font-medium mb-1">Dosage Form</label>
                  <input
                    type="text"
                    value={newDosage}
                    onChange={(e) => setNewDosage(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-[#dce8e5] bg-white text-[#0b2520] focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                  />
                </div>
                <div>
                  <label className="block text-[#0b2520] font-medium mb-1">Unit Selling Price (₦)</label>
                  <input
                    type="number"
                    min="0"
                    value={newSellingPrice}
                    onChange={(e) => setNewSellingPrice(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-[#dce8e5] bg-white font-mono text-[#0b2520] focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Batch, Expiry, Cost */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#0b2520] font-medium mb-1.5">Batch / Lot Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. EMZ-2026-X8"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#dce8e5] bg-[#f8fafa] font-mono text-[#0b2520] focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
              />
            </div>

            <div>
              <label className="block text-[#0b2520] font-medium mb-1.5">Expiry Date (FEFO) *</label>
              <input
                type="date"
                required
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#dce8e5] bg-[#f8fafa] text-[#0b2520] focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#0b2520] font-medium mb-1.5">Quantity Received *</label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-[#dce8e5] bg-[#f8fafa] font-mono text-[#0b2520] focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
              />
            </div>

            <div>
              <label className="block text-[#0b2520] font-medium mb-1.5">Unit Purchase Cost (₦) *</label>
              <input
                type="number"
                min="0"
                required
                value={purchaseCost}
                onChange={(e) => setPurchaseCost(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-[#dce8e5] bg-[#f8fafa] font-mono text-[#0b2520] focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#0b2520] font-medium mb-1.5">Store Destination *</label>
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
              <label className="block text-[#0b2520] font-medium mb-1.5">Payment Method *</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("bank_transfer")}
                  className={`py-2 px-2.5 rounded-xl border text-[11px] font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                    paymentMethod === "bank_transfer"
                      ? "bg-[#0b2520] text-white border-[#0b2520] shadow-xs"
                      : "bg-[#f8fafa] text-[#526a66] border-[#dce8e5] hover:bg-stone-50"
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Bank Outflow</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cash")}
                  className={`py-2 px-2.5 rounded-xl border text-[11px] font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                    paymentMethod === "cash"
                      ? "bg-[#0b2520] text-white border-[#0b2520] shadow-xs"
                      : "bg-[#f8fafa] text-[#526a66] border-[#dce8e5] hover:bg-stone-50"
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5" />
                  <span>Cash Outflow</span>
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[#0b2520] font-medium mb-1.5">Supplier / Pharmaceutical Wholesaler *</label>
            <input
              type="text"
              required
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#dce8e5] bg-[#f8fafa] text-[#0b2520] focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-teal-50/60 border border-teal-100 flex items-center justify-between text-xs">
            <span className="text-[#0b2520] font-medium">Total Purchase Invoice Value</span>
            <span className="font-mono text-sm font-bold text-teal-900">
              ₦{(quantity * purchaseCost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
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
              {isSubmitting ? "Receiving Stock..." : "Confirm & Receive Stock"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
