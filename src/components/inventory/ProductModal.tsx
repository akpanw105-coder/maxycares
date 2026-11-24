"use client";

import React, { useState } from "react";
import { useInventory } from "@/context/InventoryContext";
import { Plus, X, AlertCircle, Package } from "lucide-react";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  "Antibiotics & Prescriptions",
  "Over-the-Counter",
  "Health & Wellness",
  "Medical Devices & Assistance",
  "Personal Care",
  "Maternal & Child Health",
];

export function ProductModal({ isOpen, onClose }: ProductModalProps) {
  const { addProduct } = useInventory();

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: CATEGORIES[0],
    dosage_form: "Tablet",
    unit: "Packs (10s)",
    selling_price: 1500,
    low_stock_threshold: 10,
    supplier: "Certified Pharmaceutical Distributor",
    batch_number: "BT-2026-01",
    expiry_date: "2028-12-31",
    purchase_cost: 950,
    quantity_main_store: 20,
    quantity_pos_terminal: 5,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!formData.name.trim()) {
      setErrorMsg("Medicine name is required.");
      return;
    }

    setIsSubmitting(true);
    const res = await addProduct(
      {
        name: formData.name.trim(),
        sku: formData.sku.trim() || `MXC-${Date.now().toString().slice(-6)}`,
        category: formData.category,
        dosage_form: formData.dosage_form,
        unit: formData.unit,
        selling_price: Number(formData.selling_price),
        low_stock_threshold: Number(formData.low_stock_threshold),
        supplier: formData.supplier,
      },
      {
        batch_number: formData.batch_number.trim(),
        expiry_date: formData.expiry_date,
        purchase_cost: Number(formData.purchase_cost),
        quantity_main_store: Number(formData.quantity_main_store),
        quantity_pos_terminal: Number(formData.quantity_pos_terminal),
      }
    );

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
      <div className="bg-white rounded-3xl max-w-xl w-full border border-[#dce8e5] shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-[#e5eeec] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center border border-teal-100/60">
              <Package className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#0b2520]">Register New Medicine</h2>
              <p className="text-xs text-[#526a66]">Add pharmaceutical details and optional initial lot to catalog</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-[#0b2520] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-3">
            <div className="font-semibold text-xs text-[#0b2520]">Core Medicine Information</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#0b2520] font-medium mb-1">Medicine Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paracetamol 500mg"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#dce8e5] bg-[#f8fafa] text-[#0b2520] focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                />
              </div>

              <div>
                <label className="block text-[#0b2520] font-medium mb-1">SKU / Barcode Code</label>
                <input
                  type="text"
                  placeholder="Auto-generated if empty"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#dce8e5] bg-[#f8fafa] font-mono text-[#0b2520] focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[#0b2520] font-medium mb-1">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-2.5 py-2 rounded-xl border border-[#dce8e5] bg-[#f8fafa] text-[#0b2520] focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#0b2520] font-medium mb-1">Dosage Form</label>
                <input
                  type="text"
                  value={formData.dosage_form}
                  onChange={(e) => setFormData({ ...formData, dosage_form: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#dce8e5] bg-[#f8fafa] text-[#0b2520] focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                />
              </div>

              <div>
                <label className="block text-[#0b2520] font-medium mb-1">Dispensing Unit</label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#dce8e5] bg-[#f8fafa] text-[#0b2520] focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#0b2520] font-medium mb-1">Selling Price (₦) *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.selling_price}
                  onChange={(e) => setFormData({ ...formData, selling_price: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-[#dce8e5] bg-[#f8fafa] font-mono text-[#0b2520] focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                />
              </div>

              <div>
                <label className="block text-[#0b2520] font-medium mb-1">Low-Stock Alert Threshold *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.low_stock_threshold}
                  onChange={(e) => setFormData({ ...formData, low_stock_threshold: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-[#dce8e5] bg-[#f8fafa] font-mono text-[#0b2520] focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                />
              </div>
            </div>
          </div>

          {/* Initial Lot (Optional) */}
          <div className="pt-3 border-t border-[#e5eeec] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-[#0b2520]">Initial Batch Lot (Optional)</span>
              <span className="text-[10px] text-[#526a66]">Leave 0 if entering inventory later</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[#0b2520] font-medium mb-1">Batch Number</label>
                <input
                  type="text"
                  value={formData.batch_number}
                  onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-[#dce8e5] bg-[#f8fafa] font-mono text-[#0b2520]"
                />
              </div>

              <div>
                <label className="block text-[#0b2520] font-medium mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-[#dce8e5] bg-[#f8fafa] text-[#0b2520]"
                />
              </div>

              <div>
                <label className="block text-[#0b2520] font-medium mb-1">Cost Price (₦)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.purchase_cost}
                  onChange={(e) => setFormData({ ...formData, purchase_cost: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-lg border border-[#dce8e5] bg-[#f8fafa] font-mono text-[#0b2520]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#0b2520] font-medium mb-1">Main Store Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={formData.quantity_main_store}
                  onChange={(e) => setFormData({ ...formData, quantity_main_store: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-lg border border-[#dce8e5] bg-[#f8fafa] font-mono text-[#0b2520]"
                />
              </div>

              <div>
                <label className="block text-[#0b2520] font-medium mb-1">POS Counter Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={formData.quantity_pos_terminal}
                  onChange={(e) => setFormData({ ...formData, quantity_pos_terminal: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-lg border border-[#dce8e5] bg-[#f8fafa] font-mono text-[#0b2520]"
                />
              </div>
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
              {isSubmitting ? "Registering..." : "Register Medicine"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
