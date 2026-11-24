"use client";

import React, { useState, useEffect } from "react";
import { useInventory } from "@/context/InventoryContext";
import { ProductItem } from "@/lib/supabaseClient";
import { Edit2, X, AlertCircle } from "lucide-react";

interface EditProductModalProps {
  product: ProductItem | null;
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

export function EditProductModal({ product, isOpen, onClose }: EditProductModalProps) {
  const { updateProduct } = useInventory();

  const [name, setName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [dosageForm, setDosageForm] = useState("Tablet");
  const [unit, setUnit] = useState("Packs (10s)");
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(10);
  const [supplier, setSupplier] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (product) {
      setName(product.name);
      setCategory(product.category);
      setDosageForm(product.dosage_form);
      setUnit(product.unit);
      setSellingPrice(Number(product.selling_price));
      setLowStockThreshold(Number(product.low_stock_threshold));
      setSupplier(product.supplier || "");
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsSubmitting(true);

    const res = await updateProduct(product.id, {
      name: name.trim(),
      category,
      dosage_form: dosageForm.trim(),
      unit: unit.trim(),
      selling_price: Number(sellingPrice),
      low_stock_threshold: Number(lowStockThreshold),
      supplier: supplier.trim(),
    });

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
              <Edit2 className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#0b2520]">Edit Medicine Details</h2>
              <p className="text-xs text-[#526a66] font-mono">{product.sku}</p>
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

          <div>
            <label className="block text-[#0b2520] font-medium mb-1.5">Medicine Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#dce8e5] bg-[#f8fafa] text-[#0b2520] focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[#0b2520] font-medium mb-1.5">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
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
              <label className="block text-[#0b2520] font-medium mb-1.5">Dosage Form</label>
              <input
                type="text"
                value={dosageForm}
                onChange={(e) => setDosageForm(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#dce8e5] bg-[#f8fafa] text-[#0b2520] focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
              />
            </div>

            <div>
              <label className="block text-[#0b2520] font-medium mb-1.5">Unit</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#dce8e5] bg-[#f8fafa] text-[#0b2520] focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#0b2520] font-medium mb-1.5">Selling Price (₦) *</label>
              <input
                type="number"
                min="0"
                required
                value={sellingPrice}
                onChange={(e) => setSellingPrice(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-[#dce8e5] bg-[#f8fafa] font-mono text-[#0b2520] focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
              />
            </div>

            <div>
              <label className="block text-[#0b2520] font-medium mb-1.5">Low-Stock Alert Level *</label>
              <input
                type="number"
                min="1"
                required
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-[#dce8e5] bg-[#f8fafa] font-mono text-[#0b2520] focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#0b2520] font-medium mb-1.5">Pharmaceutical Supplier</label>
            <input
              type="text"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
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
              {isSubmitting ? "Updating..." : "Save Medicine Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
