import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://rfnskvrmhcjygonqpjvu.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmbnNrdnJtaGNqeWdvbnFwanZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU0NjE4OTQsImV4cCI6MjExMTAzNzg5NH0.15emA94drI2Rh5ErRQQIeMZoXyiN2380qUM4W41g3_M";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface StaffProfile {
  id: string;
  full_name: string;
  staff_code: string;
  role: string;
  failed_attempts: number;
  locked_until: string | null;
  is_active: boolean;
  is_demo: boolean;
  created_at: string;
}

export interface StaffShift {
  id: string;
  staff_id: string;
  staff_name: string;
  start_time: string;
  end_time: string | null;
  duration_seconds: number | null;
  status: "active" | "completed" | "interrupted";
  handover_notes: string | null;
  operations_count: number;
  opening_cash: number;
  expected_cash: number;
  counted_cash: number | null;
  cash_difference: number | null;
  total_sales_amount: number;
  cash_sales_amount: number;
  transfer_sales_amount: number;
  created_at: string;
}

export interface ProductItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  dosage_form: string;
  unit: string;
  selling_price: number;
  low_stock_threshold: number;
  supplier: string;
  is_active: boolean;
  is_demo: boolean;
  created_at: string;
  batches?: StockBatchItem[];
  total_main_store?: number;
  total_pos_terminal?: number;
  total_quantity?: number;
}

export interface StockBatchItem {
  id: string;
  product_id: string;
  batch_number: string;
  expiry_date: string;
  purchase_cost: number;
  quantity_main_store: number;
  quantity_pos_terminal: number;
  created_at: string;
}

export interface StockMovementItem {
  id: string;
  shift_id: string;
  staff_id: string;
  staff_name: string;
  product_id: string;
  product_name: string;
  batch_id: string;
  batch_number: string;
  movement_type: "intake" | "transfer_to_pos" | "transfer_to_main" | "reduction" | "correction" | "sale" | "sale_reversal";
  quantity: number;
  source_location: string | null;
  destination_location: string | null;
  prev_main_store: number;
  new_main_store: number;
  prev_pos_terminal: number;
  new_pos_terminal: number;
  reason: string;
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  batch_id: string;
  batch_number: string;
  quantity: number;
  unit_cost_price: number;
  unit_selling_price: number;
  total_price: number;
  created_at: string;
}

export interface SaleRecord {
  id: string;
  receipt_number: string;
  shift_id: string;
  staff_id: string;
  staff_name: string;
  customer_name: string;
  payment_method: "cash" | "bank_transfer";
  subtotal_amount: number;
  discount_amount: number;
  total_amount: number;
  total_cost_of_goods: number;
  status: "completed" | "reversed";
  reversal_reason: string | null;
  reversed_at: string | null;
  reversed_by: string | null;
  created_at: string;
  items?: SaleItem[];
}

export interface PurchaseItem {
  id: string;
  purchase_id: string;
  product_id: string;
  product_name: string;
  batch_id: string;
  batch_number: string;
  expiry_date: string;
  quantity: number;
  unit_purchase_cost: number;
  total_amount: number;
  created_at: string;
}

export interface PurchaseRecord {
  id: string;
  invoice_number: string;
  supplier: string;
  stock_location: "main_store" | "pos_terminal";
  payment_method: "cash" | "bank_transfer";
  total_amount: number;
  recorded_by: string;
  notes: string | null;
  created_at: string;
  items?: PurchaseItem[];
}

export interface ExpenseRecord {
  id: string;
  expense_number: string;
  category: "Electricity" | "Transport" | "Rent" | "Staff-related" | "Maintenance" | "Medical Supplies" | "Security" | "Regulatory/Levies" | "Other Operational";
  description: string;
  amount: number;
  payment_method: "cash" | "bank_transfer";
  expense_date: string;
  recorded_by: string;
  shift_id: string | null;
  staff_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface FinancialLedgerEntry {
  id: string;
  transaction_ref: string;
  entry_type: "sale" | "purchase" | "expense" | "sale_reversal" | "opening_balance" | "cash_withdrawal" | "adjustment";
  channel: "cash" | "bank_transfer";
  direction: "inflow" | "outflow";
  amount: number;
  description: string;
  shift_id: string | null;
  staff_id: string | null;
  recorded_by: string;
  metadata?: any;
  created_at: string;
}

export interface CashReconciliationRecord {
  id: string;
  shift_id: string;
  staff_id: string;
  staff_name: string;
  opening_cash: number;
  cash_sales: number;
  cash_expenses: number;
  expected_cash: number;
  counted_cash: number;
  difference: number;
  notes: string | null;
  created_at: string;
}

export interface FinancialOpeningBalances {
  cash_opening: number;
  bank_opening: number;
  recorded_by?: string;
  notes?: string;
  set_at?: string;
}
