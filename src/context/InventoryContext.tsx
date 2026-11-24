"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  supabase,
  StaffProfile,
  StaffShift,
  ProductItem,
  StockBatchItem,
  StockMovementItem,
  SaleRecord,
  SaleItem,
  PurchaseRecord,
  ExpenseRecord,
  FinancialLedgerEntry,
  CashReconciliationRecord,
  FinancialOpeningBalances
} from "@/lib/supabaseClient";

interface SaleInputItem {
  product_id: string;
  quantity: number;
}

interface InventoryContextType {
  // Session & Authentication
  isOwnerAuthenticated: boolean;
  ownerEmail: string;
  loginAsOwner: (email: string) => void;
  logoutOwner: () => void;

  // Active Staff & Shift
  activeStaff: StaffProfile | null;
  activeShift: StaffShift | null;
  shiftDurationFormatted: string;
  isStartingShift: boolean;
  startStaffShift: (staffId: string, pin: string) => Promise<{ success: boolean; message: string }>;
  endStaffShift: (countedCash: number, notes: string) => Promise<{ success: boolean; message: string }>;
  clearStaffSession: () => void;

  // Real Database Records
  staffProfiles: StaffProfile[];
  products: ProductItem[];
  batches: StockBatchItem[];
  shifts: StaffShift[];
  movements: StockMovementItem[];
  sales: SaleRecord[];
  purchases: PurchaseRecord[];
  expenses: ExpenseRecord[];
  ledgerEntries: FinancialLedgerEntry[];
  cashReconciliations: CashReconciliationRecord[];
  openingBalances: FinancialOpeningBalances;
  isLoading: boolean;
  refreshData: () => Promise<void>;

  // Core Operations
  // 1. Record Sale (Staff & Owner)
  recordSale: (
    items: SaleInputItem[],
    paymentMethod: "cash" | "bank_transfer",
    customerName?: string,
    discount?: number
  ) => Promise<{ success: boolean; message: string; receiptNumber?: string }>;

  // 2. Reverse / Refund Sale (Owner Authorized)
  reverseSale: (
    saleId: string,
    reason: string
  ) => Promise<{ success: boolean; message: string }>;

  // 3. Stock In / Purchase (Owner)
  recordStockIntake: (
    productId: string,
    quantity: number,
    purchaseCost: number,
    batchNumber: string,
    expiryDate: string,
    location: "main_store" | "pos_terminal",
    supplier: string,
    paymentMethod: "cash" | "bank_transfer"
  ) => Promise<{ success: boolean; message: string }>;

  // 4. Record Expense (Owner & Permitted Staff)
  recordExpense: (
    category: "Electricity" | "Transport" | "Rent" | "Staff-related" | "Maintenance" | "Medical Supplies" | "Security" | "Regulatory/Levies" | "Other Operational",
    description: string,
    amount: number,
    paymentMethod: "cash" | "bank_transfer",
    notes?: string
  ) => Promise<{ success: boolean; message: string }>;

  // 5. Financial Opening Balances
  updateOpeningBalances: (
    cashOpening: number,
    bankOpening: number,
    notes?: string
  ) => Promise<{ success: boolean; message: string }>;

  // 6. Inventory Movements
  transferStock: (
    batchId: string,
    quantity: number,
    direction: "to_pos" | "to_main",
    reason: string
  ) => Promise<{ success: boolean; message: string }>;
  
  adjustStock: (
    batchId: string,
    location: "main_store" | "pos_terminal",
    type: "add" | "reduce" | "correct",
    delta: number,
    reason: string
  ) => Promise<{ success: boolean; message: string }>;

  // 7. Product & Batch Catalog Management
  addProduct: (productData: Partial<ProductItem>, initialBatch?: Partial<StockBatchItem>) => Promise<{ success: boolean; message: string }>;
  updateProduct: (id: string, updates: Partial<ProductItem>) => Promise<{ success: boolean; message: string }>;
  deleteProduct: (id: string) => Promise<{ success: boolean; message: string }>;
  addBatch: (productId: string, batchData: Partial<StockBatchItem>) => Promise<{ success: boolean; message: string }>;

  // 8. Staff Management
  registerStaffProfile: (fullName: string, staffCode: string, role: string, pin: string) => Promise<{ success: boolean; message: string }>;
  updateStaffProfile: (id: string, updates: Partial<StaffProfile>) => Promise<{ success: boolean; message: string }>;
  resetStaffPin: (id: string, newPin: string) => Promise<{ success: boolean; message: string }>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const OWNER_STORAGE_KEY = "maxicare_owner_session_v3";
const ACTIVE_STAFF_STORAGE_KEY = "maxicare_active_staff_v3";
const ACTIVE_SHIFT_STORAGE_KEY = "maxicare_active_shift_v3";

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [isOwnerAuthenticated, setIsOwnerAuthenticated] = useState<boolean>(false);
  const [ownerEmail, setOwnerEmail] = useState<string>("");
  const [activeStaff, setActiveStaff] = useState<StaffProfile | null>(null);
  const [activeShift, setActiveShift] = useState<StaffShift | null>(null);
  const [shiftDurationFormatted, setShiftDurationFormatted] = useState<string>("00:00:00");
  const [isStartingShift, setIsStartingShift] = useState<boolean>(false);

  // Live Database Collections
  const [staffProfiles, setStaffProfiles] = useState<StaffProfile[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [batches, setBatches] = useState<StockBatchItem[]>([]);
  const [shifts, setShifts] = useState<StaffShift[]>([]);
  const [movements, setMovements] = useState<StockMovementItem[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<FinancialLedgerEntry[]>([]);
  const [cashReconciliations, setCashReconciliations] = useState<CashReconciliationRecord[]>([]);
  const [openingBalances, setOpeningBalances] = useState<FinancialOpeningBalances>({ cash_opening: 0, bank_opening: 0 });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load all live records from Supabase
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Staff Profiles
      const { data: staffData } = await supabase
        .from("staff_profiles")
        .select("id, full_name, staff_code, role, failed_attempts, locked_until, is_active, is_demo, created_at")
        .order("created_at", { ascending: true });
      if (staffData) setStaffProfiles(staffData as StaffProfile[]);

      // 2. Products & Batches
      const [prodRes, batchRes] = await Promise.all([
        supabase.from("products").select("*").order("name", { ascending: true }),
        supabase.from("stock_batches").select("*").order("expiry_date", { ascending: true })
      ]);

      if (batchRes.data) setBatches(batchRes.data as StockBatchItem[]);

      if (prodRes.data && batchRes.data) {
        const batchList = batchRes.data as StockBatchItem[];
        const enriched = (prodRes.data as ProductItem[]).map((p) => {
          const itemBatches = batchList.filter((b) => b.product_id === p.id);
          const totalMain = itemBatches.reduce((acc, b) => acc + (b.quantity_main_store || 0), 0);
          const totalPos = itemBatches.reduce((acc, b) => acc + (b.quantity_pos_terminal || 0), 0);
          return {
            ...p,
            batches: itemBatches,
            total_main_store: totalMain,
            total_pos_terminal: totalPos,
            total_quantity: totalMain + totalPos,
          };
        });
        setProducts(enriched);
      }

      // 3. Shifts
      const { data: shiftData } = await supabase
        .from("staff_shifts")
        .select("*")
        .order("start_time", { ascending: false });

      if (shiftData) {
        const shiftList = shiftData as StaffShift[];
        setShifts(shiftList);

        const liveActive = shiftList.find((s) => s.status === "active");
        if (liveActive) {
          setActiveShift(liveActive);
          sessionStorage.setItem(ACTIVE_SHIFT_STORAGE_KEY, JSON.stringify(liveActive));
          if (staffData) {
            const matched = (staffData as StaffProfile[]).find((st) => st.id === liveActive.staff_id);
            if (matched) {
              setActiveStaff(matched);
              sessionStorage.setItem(ACTIVE_STAFF_STORAGE_KEY, JSON.stringify(matched));
            }
          }
        } else {
          setActiveShift(null);
          sessionStorage.removeItem(ACTIVE_SHIFT_STORAGE_KEY);
        }
      }

      // 4. Stock Movements (last 300)
      const { data: movData } = await supabase
        .from("stock_movements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300);
      if (movData) setMovements(movData as StockMovementItem[]);

      // 5. Sales with items
      const { data: salesData } = await supabase
        .from("sales")
        .select("*, items:sale_items(*)")
        .order("created_at", { ascending: false })
        .limit(300);
      if (salesData) setSales(salesData as SaleRecord[]);

      // 6. Purchases with items
      const { data: purchaseData } = await supabase
        .from("purchases")
        .select("*, items:purchase_items(*)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (purchaseData) setPurchases(purchaseData as PurchaseRecord[]);

      // 7. Expenses
      const { data: expenseData } = await supabase
        .from("expenses")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (expenseData) setExpenses(expenseData as ExpenseRecord[]);

      // 8. Financial Ledger Entries
      const { data: ledgerData } = await supabase
        .from("financial_ledger")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (ledgerData) setLedgerEntries(ledgerData as FinancialLedgerEntry[]);

      // 9. Cash Reconciliations
      const { data: recData } = await supabase
        .from("cash_reconciliations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (recData) setCashReconciliations(recData as CashReconciliationRecord[]);

      // 10. Pharmacy Settings (Opening Balances)
      const { data: settingsData } = await supabase
        .from("pharmacy_settings")
        .select("*")
        .eq("key", "financial_opening_balances")
        .maybeSingle();
      if (settingsData && settingsData.value) {
        setOpeningBalances(settingsData.value as FinancialOpeningBalances);
      }

    } catch (err) {
      console.error("Error refreshing MaxiCare database records:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Hydrate browser sessions
  useEffect(() => {
    try {
      const savedOwner = sessionStorage.getItem(OWNER_STORAGE_KEY);
      if (savedOwner) {
        const parsed = JSON.parse(savedOwner);
        if (parsed.authenticated) {
          setIsOwnerAuthenticated(true);
          setOwnerEmail(parsed.email || "test@gmail.com");
        }
      }

      const savedStaff = sessionStorage.getItem(ACTIVE_STAFF_STORAGE_KEY);
      if (savedStaff) setActiveStaff(JSON.parse(savedStaff));

      const savedShift = sessionStorage.getItem(ACTIVE_SHIFT_STORAGE_KEY);
      if (savedShift) setActiveShift(JSON.parse(savedShift));
    } catch (e) {
      console.warn("Could not read session storage", e);
    }

    refreshData();
  }, [refreshData]);

  // Live Duration Counter for Active Shift
  useEffect(() => {
    if (!activeShift || activeShift.status !== "active") {
      setShiftDurationFormatted("00:00:00");
      return;
    }

    const interval = setInterval(() => {
      const start = new Date(activeShift.start_time).getTime();
      const now = new Date().getTime();
      const diffSeconds = Math.max(0, Math.floor((now - start) / 1000));

      const hrs = String(Math.floor(diffSeconds / 3600)).padStart(2, "0");
      const mins = String(Math.floor((diffSeconds % 3600) / 60)).padStart(2, "0");
      const secs = String(diffSeconds % 60).padStart(2, "0");
      setShiftDurationFormatted(`${hrs}:${mins}:${secs}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeShift]);

  // Authentication Handlers
  const loginAsOwner = (email: string) => {
    setIsOwnerAuthenticated(true);
    setOwnerEmail(email);
    sessionStorage.setItem(
      OWNER_STORAGE_KEY,
      JSON.stringify({ authenticated: true, email, timestamp: new Date().toISOString() })
    );
  };

  const logoutOwner = () => {
    setIsOwnerAuthenticated(false);
    setOwnerEmail("");
    setActiveStaff(null);
    setActiveShift(null);
    sessionStorage.removeItem(OWNER_STORAGE_KEY);
    sessionStorage.removeItem(ACTIVE_STAFF_STORAGE_KEY);
    sessionStorage.removeItem(ACTIVE_SHIFT_STORAGE_KEY);
  };

  const clearStaffSession = () => {
    setActiveStaff(null);
    setActiveShift(null);
    sessionStorage.removeItem(ACTIVE_STAFF_STORAGE_KEY);
    sessionStorage.removeItem(ACTIVE_SHIFT_STORAGE_KEY);
  };

  // Staff Shift Actions
  const startStaffShift = async (staffId: string, pin: string): Promise<{ success: boolean; message: string }> => {
    setIsStartingShift(true);
    try {
      const { data, error } = await supabase.rpc("start_staff_shift", {
        p_staff_id: staffId,
        p_pin: pin,
      });

      if (error) return { success: false, message: error.message };
      const res = data?.[0];
      if (!res?.success) return { success: false, message: res?.message || "Failed to start shift." };

      const staffMember = staffProfiles.find((s) => s.id === staffId);
      if (staffMember) {
        setActiveStaff(staffMember);
        sessionStorage.setItem(ACTIVE_STAFF_STORAGE_KEY, JSON.stringify(staffMember));
      }

      const newShift: StaffShift = {
        id: res.shift_id,
        staff_id: staffId,
        staff_name: res.staff_name,
        start_time: res.start_time,
        end_time: null,
        duration_seconds: null,
        status: "active",
        handover_notes: null,
        operations_count: 0,
        opening_cash: 0,
        expected_cash: 0,
        counted_cash: null,
        cash_difference: null,
        total_sales_amount: 0,
        cash_sales_amount: 0,
        transfer_sales_amount: 0,
        created_at: res.start_time,
      };

      setActiveShift(newShift);
      sessionStorage.setItem(ACTIVE_SHIFT_STORAGE_KEY, JSON.stringify(newShift));
      await refreshData();
      return { success: true, message: res.message };
    } catch (err: unknown) {
      return { success: false, message: err instanceof Error ? err.message : "Error starting shift." };
    } finally {
      setIsStartingShift(false);
    }
  };

  const endStaffShift = async (countedCash: number, notes: string): Promise<{ success: boolean; message: string }> => {
    if (!activeShift) {
      return { success: false, message: "No active shift found to complete." };
    }

    try {
      const { data, error } = await supabase.rpc("end_staff_shift_v2", {
        p_shift_id: activeShift.id,
        p_counted_cash: countedCash,
        p_handover_notes: notes || "Shift handover completed.",
      });

      if (error) return { success: false, message: error.message };
      const res = data?.[0];
      if (!res?.success) return { success: false, message: res?.message || "Failed to end shift." };

      setActiveStaff(null);
      setActiveShift(null);
      sessionStorage.removeItem(ACTIVE_STAFF_STORAGE_KEY);
      sessionStorage.removeItem(ACTIVE_SHIFT_STORAGE_KEY);
      await refreshData();
      return { success: true, message: res.message };
    } catch (err: unknown) {
      return { success: false, message: err instanceof Error ? err.message : "Error closing shift." };
    }
  };

  // 1. RECORD SALE (ATOMIC FEFO)
  const recordSale = async (
    items: SaleInputItem[],
    paymentMethod: "cash" | "bank_transfer",
    customerName: string = "Walk-in Customer",
    discount: number = 0
  ): Promise<{ success: boolean; message: string; receiptNumber?: string }> => {
    if (!activeShift) {
      return { success: false, message: "An active staff shift is required to record a sale." };
    }

    if (!items || items.length === 0) {
      return { success: false, message: "Please select at least one medicine to record a sale." };
    }

    try {
      const { data, error } = await supabase.rpc("record_pos_sale", {
        p_shift_id: activeShift.id,
        p_payment_method: paymentMethod,
        p_items: items,
        p_customer_name: customerName,
        p_discount: discount,
      });

      if (error) return { success: false, message: error.message };
      const res = data?.[0];
      if (!res?.success) return { success: false, message: res?.message || "Failed to record sale." };

      await refreshData();
      return { success: true, message: res.message, receiptNumber: res.receipt_number };
    } catch (err: unknown) {
      return { success: false, message: err instanceof Error ? err.message : "Error recording sale." };
    }
  };

  // 2. REVERSE / REFUND SALE (ATOMIC STOCK RESTORATION & LEDGER OUTFLOW)
  const reverseSale = async (
    saleId: string,
    reason: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const { data, error } = await supabase.rpc("reverse_sale", {
        p_sale_id: saleId,
        p_reversal_reason: reason,
        p_reversed_by: activeStaff?.id || null,
      });

      if (error) return { success: false, message: error.message };
      const res = data?.[0];
      if (!res?.success) return { success: false, message: res?.message || "Failed to reverse sale." };

      await refreshData();
      return { success: true, message: res.message };
    } catch (err: unknown) {
      return { success: false, message: err instanceof Error ? err.message : "Error reversing sale." };
    }
  };

  // 3. STOCK IN / PURCHASE
  const recordStockIntake = async (
    productId: string,
    quantity: number,
    purchaseCost: number,
    batchNumber: string,
    expiryDate: string,
    location: "main_store" | "pos_terminal",
    supplier: string,
    paymentMethod: "cash" | "bank_transfer"
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const { data, error } = await supabase.rpc("record_stock_intake_purchase", {
        p_product_id: productId,
        p_quantity: quantity,
        p_purchase_cost: purchaseCost,
        p_batch_number: batchNumber,
        p_expiry_date: expiryDate,
        p_location: location,
        p_supplier: supplier,
        p_payment_method: paymentMethod,
        p_recorded_by: ownerEmail || activeStaff?.full_name || "Owner",
        p_shift_id: activeShift?.id || null,
      });

      if (error) return { success: false, message: error.message };
      const res = data?.[0];
      if (!res?.success) return { success: false, message: res?.message || "Stock receiving failed." };

      await refreshData();
      return { success: true, message: res.message };
    } catch (err: unknown) {
      return { success: false, message: err instanceof Error ? err.message : "Error during stock intake." };
    }
  };

  // 4. RECORD EXPENSE
  const recordExpense = async (
    category: "Electricity" | "Transport" | "Rent" | "Staff-related" | "Maintenance" | "Medical Supplies" | "Security" | "Regulatory/Levies" | "Other Operational",
    description: string,
    amount: number,
    paymentMethod: "cash" | "bank_transfer",
    notes?: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const { data, error } = await supabase.rpc("record_business_expense", {
        p_category: category,
        p_description: description,
        p_amount: amount,
        p_payment_method: paymentMethod,
        p_recorded_by: ownerEmail || activeStaff?.full_name || "Owner",
        p_shift_id: activeShift?.id || null,
        p_notes: notes || null,
      });

      if (error) return { success: false, message: error.message };
      const res = data?.[0];
      if (!res?.success) return { success: false, message: res?.message || "Failed to record expense." };

      await refreshData();
      return { success: true, message: res.message };
    } catch (err: unknown) {
      return { success: false, message: err instanceof Error ? err.message : "Error recording expense." };
    }
  };

  // 5. UPDATE OPENING BALANCES
  const updateOpeningBalances = async (
    cashOpening: number,
    bankOpening: number,
    notes: string = "Initial balance configuration"
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const { data, error } = await supabase.rpc("set_financial_opening_balances", {
        p_cash_opening: cashOpening,
        p_bank_opening: bankOpening,
        p_recorded_by: ownerEmail || "Owner",
        p_notes: notes,
      });

      if (error) return { success: false, message: error.message };
      const res = data?.[0];
      if (!res?.success) return { success: false, message: res?.message || "Failed to set opening balances." };

      await refreshData();
      return { success: true, message: res.message };
    } catch (err: unknown) {
      return { success: false, message: err instanceof Error ? err.message : "Error setting balances." };
    }
  };

  // 6. STOCK MOVEMENTS (Transfers & Adjustments)
  const transferStock = async (
    batchId: string,
    quantity: number,
    direction: "to_pos" | "to_main",
    reason: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!activeShift) {
      return { success: false, message: "An active staff shift is required to perform stock transfers." };
    }

    try {
      const { data, error } = await supabase.rpc("transfer_stock", {
        p_shift_id: activeShift.id,
        p_batch_id: batchId,
        p_quantity: quantity,
        p_direction: direction,
        p_reason: reason || "Routine location transfer",
      });

      if (error) return { success: false, message: error.message };
      const res = data?.[0];
      if (!res?.success) return { success: false, message: res?.message || "Transfer failed." };

      await refreshData();
      return { success: true, message: res.message };
    } catch (err: unknown) {
      return { success: false, message: err instanceof Error ? err.message : "Transfer error." };
    }
  };

  const adjustStock = async (
    batchId: string,
    location: "main_store" | "pos_terminal",
    type: "add" | "reduce" | "correct",
    delta: number,
    reason: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!activeShift) {
      return { success: false, message: "An active staff shift is required to perform stock adjustments." };
    }

    try {
      const { data, error } = await supabase.rpc("adjust_stock", {
        p_shift_id: activeShift.id,
        p_batch_id: batchId,
        p_location: location,
        p_type: type,
        p_delta: delta,
        p_reason: reason || "Stock adjustment",
      });

      if (error) return { success: false, message: error.message };
      const res = data?.[0];
      if (!res?.success) return { success: false, message: res?.message || "Adjustment failed." };

      await refreshData();
      return { success: true, message: res.message };
    } catch (err: unknown) {
      return { success: false, message: err instanceof Error ? err.message : "Adjustment error." };
    }
  };

  // 7. PRODUCT & BATCH MANAGEMENT
  const addProduct = async (
    productData: Partial<ProductItem>,
    initialBatch?: Partial<StockBatchItem>
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const { data: newProd, error: prodErr } = await supabase
        .from("products")
        .insert({
          sku: productData.sku || `MXC-${Date.now().toString().slice(-6)}`,
          name: productData.name,
          category: productData.category || "General Health",
          dosage_form: productData.dosage_form || "Tablet",
          unit: productData.unit || "Packs",
          selling_price: productData.selling_price || 0,
          low_stock_threshold: productData.low_stock_threshold || 10,
          supplier: productData.supplier || "Certified Pharmaceutical Partner",
          is_active: true,
          is_demo: false,
        })
        .select()
        .single();

      if (prodErr || !newProd) {
        return { success: false, message: prodErr?.message || "Failed to create product." };
      }

      if (initialBatch && initialBatch.batch_number) {
        await supabase.from("stock_batches").insert({
          product_id: newProd.id,
          batch_number: initialBatch.batch_number,
          expiry_date: initialBatch.expiry_date || "2028-12-31",
          purchase_cost: initialBatch.purchase_cost || 0,
          quantity_main_store: initialBatch.quantity_main_store || 0,
          quantity_pos_terminal: initialBatch.quantity_pos_terminal || 0,
        });
      }

      await refreshData();
      return { success: true, message: "Medicine registered successfully." };
    } catch (e: unknown) {
      return { success: false, message: e instanceof Error ? e.message : "Error creating product." };
    }
  };

  const updateProduct = async (id: string, updates: Partial<ProductItem>): Promise<{ success: boolean; message: string }> => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) return { success: false, message: error.message };
      await refreshData();
      return { success: true, message: "Product updated successfully." };
    } catch (e: unknown) {
      return { success: false, message: e instanceof Error ? e.message : "Update failed." };
    }
  };

  const deleteProduct = async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) return { success: false, message: error.message };
      await refreshData();
      return { success: true, message: "Product deactivated safely from active catalog." };
    } catch (e: unknown) {
      return { success: false, message: e instanceof Error ? e.message : "Deactivation failed." };
    }
  };

  const addBatch = async (productId: string, batchData: Partial<StockBatchItem>): Promise<{ success: boolean; message: string }> => {
    try {
      const { error } = await supabase.from("stock_batches").insert({
        product_id: productId,
        batch_number: batchData.batch_number,
        expiry_date: batchData.expiry_date,
        purchase_cost: batchData.purchase_cost || 0,
        quantity_main_store: batchData.quantity_main_store || 0,
        quantity_pos_terminal: batchData.quantity_pos_terminal || 0,
      });

      if (error) return { success: false, message: error.message };
      await refreshData();
      return { success: true, message: "Batch added successfully." };
    } catch (e: unknown) {
      return { success: false, message: e instanceof Error ? e.message : "Failed to add batch." };
    }
  };

  // 8. STAFF MANAGEMENT
  const registerStaffProfile = async (
    fullName: string,
    staffCode: string,
    role: string,
    pin: string
  ): Promise<{ success: boolean; message: string }> => {
    if (pin.length !== 6 && pin.length < 8) {
      return { success: false, message: "Staff PIN must be 6 digits (demo) or at least 8 digits." };
    }

    try {
      const { data: newProfile, error: insertErr } = await supabase
        .from("staff_profiles")
        .insert({
          full_name: fullName,
          staff_code: staffCode,
          role: role || "Pharmacist",
          pin_salt: "bcrypt_auto_salted",
          pin_hash: "placeholder",
          is_active: true,
          is_demo: false,
        })
        .select()
        .single();

      if (insertErr || !newProfile) {
        return { success: false, message: insertErr?.message || "Failed to register staff profile." };
      }

      const { data: pinRes, error: pinErr } = await supabase.rpc("set_staff_pin", {
        p_staff_id: newProfile.id,
        p_new_pin: pin,
      });

      if (pinErr || !pinRes?.[0]?.success) {
        return { success: false, message: pinErr?.message || "Failed to set PIN." };
      }

      await refreshData();
      return { success: true, message: "Staff member registered with secure bcrypt PIN." };
    } catch (e: unknown) {
      return { success: false, message: e instanceof Error ? e.message : "Staff registration error." };
    }
  };

  const updateStaffProfile = async (id: string, updates: Partial<StaffProfile>): Promise<{ success: boolean; message: string }> => {
    try {
      const { error } = await supabase
        .from("staff_profiles")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) return { success: false, message: error.message };
      await refreshData();
      return { success: true, message: "Staff profile updated." };
    } catch (e: unknown) {
      return { success: false, message: e instanceof Error ? e.message : "Update failed." };
    }
  };

  const resetStaffPin = async (id: string, newPin: string): Promise<{ success: boolean; message: string }> => {
    if (newPin.length !== 6 && newPin.length < 8) {
      return { success: false, message: "New PIN must be 6 digits (demo) or at least 8 digits." };
    }

    try {
      const { data, error } = await supabase.rpc("set_staff_pin", {
        p_staff_id: id,
        p_new_pin: newPin,
      });

      if (error) return { success: false, message: error.message };
      const res = data?.[0];
      if (!res?.success) return { success: false, message: res?.message || "PIN reset failed." };

      await refreshData();
      return { success: true, message: res.message };
    } catch (e: unknown) {
      return { success: false, message: e instanceof Error ? e.message : "PIN reset error." };
    }
  };

  return (
    <InventoryContext.Provider
      value={{
        isOwnerAuthenticated,
        ownerEmail,
        loginAsOwner,
        logoutOwner,
        activeStaff,
        activeShift,
        shiftDurationFormatted,
        isStartingShift,
        startStaffShift,
        endStaffShift,
        clearStaffSession,
        staffProfiles,
        products,
        batches,
        shifts,
        movements,
        sales,
        purchases,
        expenses,
        ledgerEntries,
        cashReconciliations,
        openingBalances,
        isLoading,
        refreshData,
        recordSale,
        reverseSale,
        recordStockIntake,
        recordExpense,
        updateOpeningBalances,
        transferStock,
        adjustStock,
        addProduct,
        updateProduct,
        deleteProduct,
        addBatch,
        registerStaffProfile,
        updateStaffProfile,
        resetStaffPin,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error("useInventory must be used within an InventoryProvider");
  }
  return context;
}
