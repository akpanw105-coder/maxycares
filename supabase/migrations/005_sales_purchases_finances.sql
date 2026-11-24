-- MaxiCare Pharmacy: 005_sales_purchases_finances.sql
-- Complete Inventory, Sales & Financial Management Upgrade
-- "Record once. Update everything automatically."

-- ============================================================================
-- 1. EXTEND STAFF SHIFTS FOR CASH RECONCILIATION
-- ============================================================================
ALTER TABLE public.staff_shifts
ADD COLUMN IF NOT EXISTS opening_cash NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS expected_cash NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS counted_cash NUMERIC(14, 2),
ADD COLUMN IF NOT EXISTS cash_difference NUMERIC(14, 2),
ADD COLUMN IF NOT EXISTS total_sales_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS cash_sales_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS transfer_sales_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00;

-- ============================================================================
-- 2. SALES & SALE ITEMS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number TEXT UNIQUE NOT NULL,
    shift_id UUID NOT NULL REFERENCES public.staff_shifts(id) ON DELETE RESTRICT,
    staff_id UUID NOT NULL REFERENCES public.staff_profiles(id) ON DELETE RESTRICT,
    staff_name TEXT NOT NULL,
    customer_name TEXT DEFAULT 'Walk-in Customer',
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'bank_transfer')),
    subtotal_amount NUMERIC(14, 2) NOT NULL CHECK (subtotal_amount >= 0),
    discount_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    total_amount NUMERIC(14, 2) NOT NULL CHECK (total_amount >= 0),
    total_cost_of_goods NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (total_cost_of_goods >= 0),
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'reversed')),
    reversal_reason TEXT,
    reversed_at TIMESTAMPTZ,
    reversed_by UUID REFERENCES public.staff_profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_sales_created_at ON public.sales (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_shift_id ON public.sales (shift_id);
CREATE INDEX IF NOT EXISTS idx_sales_staff_id ON public.sales (staff_id);
CREATE INDEX IF NOT EXISTS idx_sales_receipt ON public.sales (receipt_number);
CREATE INDEX IF NOT EXISTS idx_sales_payment_method ON public.sales (payment_method);

CREATE TABLE IF NOT EXISTS public.sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    product_name TEXT NOT NULL,
    batch_id UUID NOT NULL REFERENCES public.stock_batches(id) ON DELETE RESTRICT,
    batch_number TEXT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_cost_price NUMERIC(12, 2) NOT NULL CHECK (unit_cost_price >= 0),
    unit_selling_price NUMERIC(12, 2) NOT NULL CHECK (unit_selling_price >= 0),
    total_price NUMERIC(14, 2) NOT NULL CHECK (total_price >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON public.sale_items (sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON public.sale_items (product_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_batch ON public.sale_items (batch_id);

-- ============================================================================
-- 3. PURCHASES & INCOMING GOODS (STOCK IN)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT UNIQUE NOT NULL,
    supplier TEXT NOT NULL DEFAULT 'Pharmaceutical Distributor',
    stock_location TEXT NOT NULL DEFAULT 'main_store' CHECK (stock_location IN ('main_store', 'pos_terminal')),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'bank_transfer')),
    total_amount NUMERIC(14, 2) NOT NULL CHECK (total_amount >= 0),
    recorded_by TEXT NOT NULL DEFAULT 'Owner',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_purchases_created ON public.purchases (created_at DESC);

CREATE TABLE IF NOT EXISTS public.purchase_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    product_name TEXT NOT NULL,
    batch_id UUID NOT NULL REFERENCES public.stock_batches(id) ON DELETE RESTRICT,
    batch_number TEXT NOT NULL,
    expiry_date DATE NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_purchase_cost NUMERIC(12, 2) NOT NULL CHECK (unit_purchase_cost >= 0),
    total_amount NUMERIC(14, 2) NOT NULL CHECK (total_amount >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase ON public.purchase_items (purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_product ON public.purchase_items (product_id);

-- ============================================================================
-- 4. BUSINESS EXPENSES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_number TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Electricity', 'Transport', 'Rent', 'Staff-related', 'Maintenance', 'Medical Supplies', 'Security', 'Regulatory/Levies', 'Other Operational')),
    description TEXT NOT NULL,
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'bank_transfer')),
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    recorded_by TEXT NOT NULL,
    shift_id UUID REFERENCES public.staff_shifts(id) ON DELETE SET NULL,
    staff_id UUID REFERENCES public.staff_profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses (expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses (category);
CREATE INDEX IF NOT EXISTS idx_expenses_payment ON public.expenses (payment_method);

-- ============================================================================
-- 5. FINANCIAL LEDGER TRANSACTIONS (SOURCE OF TRUTH FOR CASH & BANK)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.financial_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_ref TEXT NOT NULL,
    entry_type TEXT NOT NULL CHECK (entry_type IN ('sale', 'purchase', 'expense', 'sale_reversal', 'opening_balance', 'cash_withdrawal', 'adjustment')),
    channel TEXT NOT NULL CHECK (channel IN ('cash', 'bank_transfer')),
    direction TEXT NOT NULL CHECK (direction IN ('inflow', 'outflow')),
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    description TEXT NOT NULL,
    shift_id UUID REFERENCES public.staff_shifts(id) ON DELETE SET NULL,
    staff_id UUID REFERENCES public.staff_profiles(id) ON DELETE SET NULL,
    recorded_by TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_ledger_channel ON public.financial_ledger (channel);
CREATE INDEX IF NOT EXISTS idx_ledger_created ON public.financial_ledger (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_entry_type ON public.financial_ledger (entry_type);
CREATE INDEX IF NOT EXISTS idx_ledger_shift_id ON public.financial_ledger (shift_id);

-- Trigger to prevent UPDATE or DELETE on financial_ledger (strict append-only)
CREATE OR REPLACE FUNCTION public.prevent_financial_ledger_mutation()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RAISE EXCEPTION 'Financial ledger entries are immutable audit records and cannot be updated or deleted.';
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_ledger_update ON public.financial_ledger;
CREATE TRIGGER trg_prevent_ledger_update
BEFORE UPDATE OR DELETE ON public.financial_ledger
FOR EACH ROW EXECUTE FUNCTION public.prevent_financial_ledger_mutation();

-- ============================================================================
-- 6. OPENING BALANCES & CASH RECONCILIATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.cash_reconciliations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shift_id UUID NOT NULL REFERENCES public.staff_shifts(id) ON DELETE RESTRICT,
    staff_id UUID NOT NULL REFERENCES public.staff_profiles(id) ON DELETE RESTRICT,
    staff_name TEXT NOT NULL,
    opening_cash NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    cash_sales NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    cash_expenses NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    expected_cash NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    counted_cash NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    difference NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Store opening balances in pharmacy_settings if not already present
INSERT INTO public.pharmacy_settings (key, value)
VALUES 
    ('financial_opening_balances', '{"cash_opening": 0.00, "bank_opening": 0.00, "set_at": null, "notes": "Initial setup"}'::JSONB)
ON CONFLICT (key) DO NOTHING;

-- Extend stock_movements CHECK constraint to include 'sale' and 'sale_reversal'
ALTER TABLE public.stock_movements DROP CONSTRAINT IF EXISTS stock_movements_movement_type_check;
ALTER TABLE public.stock_movements ADD CONSTRAINT stock_movements_movement_type_check 
CHECK (movement_type IN ('intake', 'transfer_to_pos', 'transfer_to_main', 'reduction', 'correction', 'sale', 'sale_reversal'));

-- Enable RLS on new tables
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_reconciliations ENABLE ROW LEVEL SECURITY;

-- Permissive public policies for authenticated/anon application operations (matching existing pattern)
CREATE POLICY "Allow all on sales" ON public.sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on sale_items" ON public.sale_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on purchases" ON public.purchases FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on purchase_items" ON public.purchase_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on financial_ledger" ON public.financial_ledger FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on cash_reconciliations" ON public.cash_reconciliations FOR ALL USING (true) WITH CHECK (true);

-- Grant privileges
GRANT ALL ON TABLE public.sales TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.sale_items TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.purchases TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.purchase_items TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.expenses TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.financial_ledger TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.cash_reconciliations TO anon, authenticated, service_role;
