"use client";

import React, { useState, useMemo } from "react";
import { useInventory } from "@/context/InventoryContext";
import { ProductItem } from "@/lib/supabaseClient";
import { TableEmptyState, StatusBadge } from "./UIComponents";
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  AlertCircle,
  Package,
  Receipt,
  CheckCircle2,
  Store,
  CreditCard,
  Banknote,
  Percent,
  X
} from "lucide-react";

interface RecordSaleViewProps {
  onSaleComplete?: () => void;
}

interface CartItem {
  product: ProductItem;
  quantity: number;
}

export function RecordSaleView({ onSaleComplete }: RecordSaleViewProps) {
  const { products, activeShift, recordSale } = useInventory();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "bank_transfer">("cash");
  const [customerName, setCustomerName] = useState("Walk-in Customer");
  const [discount, setDiscount] = useState<number>(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [lastReceipt, setLastReceipt] = useState<{ receipt: string; total: number } | null>(null);

  // Active products with catalog details
  const posAvailableProducts = useMemo(() => {
    return products.filter((p) => p.is_active);
  }, [products]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    posAvailableProducts.forEach((p) => p.category && set.add(p.category));
    return ["All", ...Array.from(set)];
  }, [posAvailableProducts]);

  // Filtered search list
  const filteredProducts = useMemo(() => {
    let result = posAvailableProducts;
    if (selectedCategory !== "All") {
      result = result.filter((p) => p.category === selectedCategory);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.sku.toLowerCase().includes(term) ||
          p.category.toLowerCase().includes(term)
      );
    }
    return result;
  }, [posAvailableProducts, selectedCategory, searchTerm]);

  // Cart operations
  const addToCart = (product: ProductItem) => {
    setErrorMsg("");
    setLastReceipt(null);
    const existingIndex = cart.findIndex((item) => item.product.id === product.id);
    const availablePos = product.total_pos_terminal || 0;

    if (availablePos <= 0) {
      setErrorMsg(`Cannot dispense "${product.name}": 0 units at POS Counter. Transfer stock from Main Store first.`);
      return;
    }

    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].quantity;
      if (currentQty + 1 > availablePos) {
        setErrorMsg(`Cannot exceed available POS counter stock (${availablePos} units).`);
        return;
      }
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setErrorMsg("");
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            const availablePos = item.product.total_pos_terminal || 0;
            if (newQty > availablePos) {
              setErrorMsg(`Cannot exceed available POS stock of ${availablePos} units.`);
              return item;
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setErrorMsg("");
  };

  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity * item.product.selling_price, 0);
  }, [cart]);

  const totalAmount = Math.max(0, subtotal - (discount || 0));

  const handleConfirmSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      setErrorMsg("Please select at least one medicine to record a sale.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    const salePayload = cart.map((item) => ({
      product_id: item.product.id,
      quantity: item.quantity,
    }));

    const res = await recordSale(salePayload, paymentMethod, customerName.trim() || "Walk-in Customer", discount);

    if (!res.success) {
      setErrorMsg(res.message);
      setIsSubmitting(false);
    } else {
      setLastReceipt({
        receipt: res.receiptNumber || "REC-COMPLETED",
        total: totalAmount,
      });
      setCart([]);
      setDiscount(0);
      setIsSubmitting(false);
      if (onSaleComplete) onSaleComplete();
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-2xl border border-[#dce8e5] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-[#0b2520]">Point of Sale &amp; Dispensing</h2>
          <p className="text-xs text-[#526a66]">
            Select medicines to dispense &middot; Real-time FIFO batch depletion &middot; Reconciled payments
          </p>
        </div>

        {activeShift && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-teal-50/60 border border-teal-200/60 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[#526a66]">Active Duty Officer:</span>
            <span className="font-semibold text-[#0b2520]">{activeShift.staff_name}</span>
          </div>
        )}
      </div>

      {/* Success Notification */}
      {lastReceipt && (
        <div className="p-4 rounded-2xl bg-teal-50/90 border border-teal-200 text-teal-950 flex items-center justify-between text-xs shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-teal-700 shrink-0" />
            <div>
              <span className="font-semibold block">Sale completed and recorded to ledger!</span>
              <span className="text-teal-800 text-[11px]">
                Receipt: <strong className="font-mono">{lastReceipt.receipt}</strong> &middot; Batch stock deducted automatically
              </span>
            </div>
          </div>
          <span className="font-mono text-sm font-bold text-teal-900">
            ₦{lastReceipt.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 2-Column Split: Catalog Table vs Dispensing Slip */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left 7 Cols: Medicine Catalog Table */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#dce8e5] shadow-xs flex flex-col overflow-hidden">
          {/* Search & Category Filter */}
          <div className="p-4 border-b border-[#e5eeec] flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search medicines by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-[#dce8e5] text-xs bg-[#f8fafa] text-[#0b2520] focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
              />
              <Search className="w-3.5 h-3.5 text-[#526a66] absolute left-2.5 top-2.5" />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[#dce8e5] text-xs bg-[#f8fafa] text-[#0b2520] focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Clean Inventory Table */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8fafa] border-b border-[#e5eeec] text-[#526a66] font-medium text-[11px]">
                <tr>
                  <th className="px-5 py-3">Medicine</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3 text-right">Price</th>
                  <th className="px-5 py-3 text-center">POS Stock</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5eeec]">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <TableEmptyState
                        icon={Package}
                        title="No matching medicines found"
                        description="Try searching with a different name or category."
                      />
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const posQty = p.total_pos_terminal || 0;
                    const inCart = cart.find((item) => item.product.id === p.id);
                    const isOutOfStock = posQty <= 0;

                    return (
                      <tr
                        key={p.id}
                        className={`hover:bg-[#f8fafa]/80 transition-colors ${
                          inCart ? "bg-teal-50/30" : ""
                        }`}
                      >
                        <td className="px-5 py-3.5">
                          <div className="font-medium text-[#0b2520]">{p.name}</div>
                          <div className="text-[11px] text-[#526a66] font-mono">{p.sku}</div>
                        </td>
                        <td className="px-5 py-3.5 text-[#526a66]">{p.category}</td>
                        <td className="px-5 py-3.5 text-right font-mono font-medium text-[#0b2520]">
                          ₦{p.selling_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <StatusBadge
                            variant={isOutOfStock ? "danger" : posQty <= p.low_stock_threshold ? "warning" : "success"}
                            size="sm"
                          >
                            {posQty} units
                          </StatusBadge>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            type="button"
                            disabled={isOutOfStock}
                            onClick={() => addToCart(p)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                              inCart
                                ? "bg-[#0b2520] text-white hover:bg-[#0f766e]"
                                : isOutOfStock
                                ? "bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed"
                                : "border border-[#dce8e5] text-[#0b2520] hover:border-[#0f766e] hover:bg-teal-50/50"
                            }`}
                          >
                            {inCart ? `+ Add (${inCart.quantity})` : "+ Dispense"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 5 Cols: Dispensing Checkout Slip */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#dce8e5] shadow-xs p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e5eeec]">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-teal-800" />
                <h3 className="text-sm font-semibold text-[#0b2520]">Dispensing Slip</h3>
              </div>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-[11px] font-medium text-rose-600 hover:text-rose-800 transition-colors cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Cart Items */}
            {cart.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#526a66] space-y-2">
                <div className="w-10 h-10 rounded-xl bg-[#f8fafa] border border-[#dce8e5] flex items-center justify-center mx-auto text-stone-400">
                  <Package className="w-5 h-5" />
                </div>
                <p className="font-medium text-[#0b2520]">No medicines selected</p>
                <p className="text-[11px] text-[#526a66] max-w-xs mx-auto">
                  Click &ldquo;+ Dispense&rdquo; on any available medicine in the catalog to add it to this prescription slip.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-3 rounded-xl border border-[#e5eeec] bg-[#f8fafa] flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="font-medium text-[#0b2520] truncate">{item.product.name}</div>
                      <div className="text-[11px] text-[#526a66] font-mono mt-0.5">
                        ₦{item.product.selling_price.toLocaleString()} &times; {item.quantity}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center border border-[#dce8e5] rounded-lg bg-white overflow-hidden shadow-xs">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="px-2 py-1 text-stone-500 hover:text-[#0b2520] hover:bg-stone-50 transition-colors cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center font-mono font-medium text-xs text-[#0b2520]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="px-2 py-1 text-stone-500 hover:text-[#0b2520] hover:bg-stone-50 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="w-18 text-right font-mono font-semibold text-[#0b2520]">
                        ₦{(item.quantity * item.product.selling_price).toLocaleString()}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-stone-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Inputs: Customer & Payment Method */}
            <div className="space-y-3 pt-3 border-t border-[#e5eeec] text-xs">
              <div>
                <label className="block text-[#0b2520] font-medium mb-1.5">
                  Customer / Patient Reference
                </label>
                <input
                  type="text"
                  placeholder="Walk-in Customer"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#dce8e5] bg-[#f8fafa] text-[#0b2520] text-xs focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                />
              </div>

              <div>
                <label className="block text-[#0b2520] font-medium mb-1.5">
                  Payment Method *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cash")}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      paymentMethod === "cash"
                        ? "bg-[#0b2520] text-white border-[#0b2520] shadow-xs"
                        : "bg-[#f8fafa] text-[#526a66] border-[#dce8e5] hover:bg-stone-50"
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    <span>Physical Cash</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("bank_transfer")}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      paymentMethod === "bank_transfer"
                        ? "bg-[#0b2520] text-white border-[#0b2520] shadow-xs"
                        : "bg-[#f8fafa] text-[#526a66] border-[#dce8e5] hover:bg-stone-50"
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Bank Transfer</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Subtotal & Final Action */}
          <div className="pt-3 border-t border-[#e5eeec] space-y-3 text-xs">
            <div className="space-y-2 text-[#526a66]">
              <div className="flex justify-between">
                <span>Subtotal ({cart.reduce((a, b) => a + b.quantity, 0)} items)</span>
                <span className="font-mono text-[#0b2520] font-medium">
                  ₦{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1">
                  <Percent className="w-3 h-3 text-stone-400" />
                  <span>Discount (₦)</span>
                </span>
                <input
                  type="number"
                  min="0"
                  value={discount || ""}
                  onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-24 text-right px-2.5 py-1 rounded-lg border border-[#dce8e5] font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                />
              </div>
              <div className="pt-2.5 border-t border-[#e5eeec] flex justify-between items-baseline">
                <span className="font-semibold text-sm text-[#0b2520]">Total Due</span>
                <span className="text-xl font-bold font-mono text-teal-900">
                  ₦{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={isSubmitting || cart.length === 0}
              onClick={handleConfirmSale}
              className="w-full py-2.5 rounded-xl bg-[#0b2520] hover:bg-[#0f766e] text-white font-medium text-xs transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? "Dispensing & Recording..." : `Confirm & Dispense (₦${totalAmount.toLocaleString()})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
