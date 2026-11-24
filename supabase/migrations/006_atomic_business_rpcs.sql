-- MaxiCare Pharmacy: 006_atomic_business_rpcs.sql
-- Atomic RPC functions for:
-- 1. record_stock_intake_purchase (Stock In)
-- 2. record_pos_sale (Multi-item FEFO sale)
-- 3. reverse_sale (Owner authorized reversal)
-- 4. record_business_expense (Expense tracking)
-- 5. end_staff_shift_v2 (With full cash reconciliation)
-- 6. set_financial_opening_balances

-- ============================================================================
-- 1. RECORD STOCK INTAKE & PURCHASE
-- ============================================================================
CREATE OR REPLACE FUNCTION public.record_stock_intake_purchase(
    p_product_id UUID,
    p_quantity INT,
    p_purchase_cost NUMERIC(12, 2),
    p_batch_number TEXT,
    p_expiry_date DATE,
    p_location TEXT, -- 'main_store' or 'pos_terminal'
    p_supplier TEXT,
    p_payment_method TEXT, -- 'cash' or 'bank_transfer'
    p_recorded_by TEXT,
    p_shift_id UUID DEFAULT NULL
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    purchase_id UUID,
    batch_id UUID,
    movement_id UUID,
    ledger_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_product public.products%ROWTYPE;
    v_batch public.stock_batches%ROWTYPE;
    v_purchase_id UUID;
    v_batch_id UUID;
    v_movement_id UUID;
    v_ledger_id UUID;
    v_total_amount NUMERIC(14, 2);
    v_invoice_num TEXT;
    v_prev_main INT := 0;
    v_new_main INT := 0;
    v_prev_pos INT := 0;
    v_new_pos INT := 0;
    v_shift RECORD;
    v_staff_id UUID;
    v_staff_name TEXT;
BEGIN
    IF p_quantity <= 0 THEN
        RETURN QUERY SELECT false, 'Quantity received must be greater than zero.'::TEXT, NULL::UUID, NULL::UUID, NULL::UUID, NULL::UUID;
        RETURN;
    END IF;

    IF p_purchase_cost < 0 THEN
        RETURN QUERY SELECT false, 'Purchase cost per unit cannot be negative.'::TEXT, NULL::UUID, NULL::UUID, NULL::UUID, NULL::UUID;
        RETURN;
    END IF;

    IF p_location NOT IN ('main_store', 'pos_terminal') THEN
        RETURN QUERY SELECT false, 'Invalid storage location. Choose main_store or pos_terminal.'::TEXT, NULL::UUID, NULL::UUID, NULL::UUID, NULL::UUID;
        RETURN;
    END IF;

    IF p_payment_method NOT IN ('cash', 'bank_transfer') THEN
        RETURN QUERY SELECT false, 'Payment method must be cash or bank_transfer.'::TEXT, NULL::UUID, NULL::UUID, NULL::UUID, NULL::UUID;
        RETURN;
    END IF;

    -- Verify Product exists
    SELECT * INTO v_product
    FROM public.products
    WHERE id = p_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Product not found.'::TEXT, NULL::UUID, NULL::UUID, NULL::UUID, NULL::UUID;
        RETURN;
    END IF;

    -- Shift resolution if provided
    IF p_shift_id IS NOT NULL THEN
        SELECT id, staff_id, staff_name INTO v_shift
        FROM public.staff_shifts
        WHERE id = p_shift_id AND status = 'active';

        IF FOUND THEN
            v_staff_id := v_shift.staff_id;
            v_staff_name := v_shift.staff_name;
        END IF;
    END IF;

    -- If no active shift supplied, find system lead staff or default
    IF v_staff_id IS NULL THEN
        SELECT id, full_name INTO v_staff_id, v_staff_name
        FROM public.staff_profiles
        WHERE is_active = true
        ORDER BY created_at ASC
        LIMIT 1;
    END IF;

    -- Generate unique invoice reference
    v_invoice_num := 'PUR-' || to_char(timezone('utc', now()), 'YYYYMMDD-HH24MISS') || '-' || substr(md5(random()::text), 1, 4);
    v_total_amount := p_quantity * p_purchase_cost;

    -- 1. Create or Update Batch
    SELECT * INTO v_batch
    FROM public.stock_batches
    WHERE product_id = p_product_id AND batch_number = trim(p_batch_number)
    FOR UPDATE;

    IF FOUND THEN
        v_batch_id := v_batch.id;
        v_prev_main := v_batch.quantity_main_store;
        v_prev_pos := v_batch.quantity_pos_terminal;

        IF p_location = 'main_store' THEN
            v_new_main := v_prev_main + p_quantity;
            v_new_pos := v_prev_pos;
        ELSE
            v_new_main := v_prev_main;
            v_new_pos := v_prev_pos + p_quantity;
        END IF;

        UPDATE public.stock_batches
        SET quantity_main_store = v_new_main,
            quantity_pos_terminal = v_new_pos,
            purchase_cost = p_purchase_cost,
            expiry_date = COALESCE(p_expiry_date, v_batch.expiry_date),
            updated_at = timezone('utc', now())
        WHERE id = v_batch_id;
    ELSE
        IF p_location = 'main_store' THEN
            v_new_main := p_quantity;
            v_new_pos := 0;
        ELSE
            v_new_main := 0;
            v_new_pos := p_quantity;
        END IF;

        INSERT INTO public.stock_batches (
            product_id, batch_number, expiry_date, purchase_cost,
            quantity_main_store, quantity_pos_terminal
        ) VALUES (
            p_product_id, trim(p_batch_number), COALESCE(p_expiry_date, (CURRENT_DATE + INTERVAL '2 years')::DATE),
            p_purchase_cost, v_new_main, v_new_pos
        ) RETURNING id INTO v_batch_id;
    END IF;

    -- 2. Create Purchase Record
    INSERT INTO public.purchases (
        invoice_number, supplier, stock_location, payment_method,
        total_amount, recorded_by, notes
    ) VALUES (
        v_invoice_num, COALESCE(p_supplier, v_product.supplier), p_location, p_payment_method,
        v_total_amount, p_recorded_by, 'Stock In purchase delivery'
    ) RETURNING id INTO v_purchase_id;

    -- 3. Create Purchase Item
    INSERT INTO public.purchase_items (
        purchase_id, product_id, product_name, batch_id, batch_number,
        expiry_date, quantity, unit_purchase_cost, total_amount
    ) VALUES (
        v_purchase_id, v_product.id, v_product.name, v_batch_id, trim(p_batch_number),
        COALESCE(p_expiry_date, (CURRENT_DATE + INTERVAL '2 years')::DATE), p_quantity, p_purchase_cost, v_total_amount
    );

    -- 4. Record Stock Movement
    -- If no shift was active, create a virtual or find active shift
    IF p_shift_id IS NULL THEN
        SELECT id INTO p_shift_id FROM public.staff_shifts WHERE status = 'active' LIMIT 1;
        IF p_shift_id IS NULL THEN
            -- Find the most recent shift for attribution reference
            SELECT id INTO p_shift_id FROM public.staff_shifts ORDER BY created_at DESC LIMIT 1;
        END IF;
    END IF;

    INSERT INTO public.stock_movements (
        shift_id, staff_id, staff_name, product_id, product_name,
        batch_id, batch_number, movement_type, quantity,
        source_location, destination_location,
        prev_main_store, new_main_store, prev_pos_terminal, new_pos_terminal,
        reason
    ) VALUES (
        p_shift_id, v_staff_id, COALESCE(p_recorded_by, v_staff_name), v_product.id, v_product.name,
        v_batch_id, trim(p_batch_number), 'intake', p_quantity,
        'external', p_location,
        v_prev_main, v_new_main, v_prev_pos, v_new_pos,
        format('Stock In purchase: %s units @ ₦%s from %s', p_quantity, p_purchase_cost, COALESCE(p_supplier, 'Supplier'))
    ) RETURNING id INTO v_movement_id;

    -- 5. Record Financial Ledger Outflow (atomic)
    IF v_total_amount > 0 THEN
        INSERT INTO public.financial_ledger (
            transaction_ref, entry_type, channel, direction, amount,
            description, shift_id, staff_id, recorded_by, metadata
        ) VALUES (
            v_invoice_num, 'purchase', p_payment_method, 'outflow', v_total_amount,
            format('Stock purchase: %s (%s units @ ₦%s)', v_product.name, p_quantity, p_purchase_cost),
            p_shift_id, v_staff_id, p_recorded_by,
            jsonb_build_object('purchase_id', v_purchase_id, 'product_id', v_product.id, 'batch_id', v_batch_id)
        ) RETURNING id INTO v_ledger_id;
    END IF;

    RETURN QUERY SELECT true, 'Stock In recorded successfully. Inventory and financial accounts updated.'::TEXT,
                        v_purchase_id, v_batch_id, v_movement_id, v_ledger_id;
END;
$$;

-- ============================================================================
-- 2. RECORD POS SALE (Multi-item FEFO Sale)
-- Expects items as JSON array: [{"product_id": "...", "quantity": 2}, ...]
-- ============================================================================
CREATE OR REPLACE FUNCTION public.record_pos_sale(
    p_shift_id UUID,
    p_payment_method TEXT, -- 'cash' or 'bank_transfer'
    p_items JSONB,
    p_customer_name TEXT DEFAULT 'Walk-in Customer',
    p_discount NUMERIC(14, 2) DEFAULT 0.00
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    sale_id UUID,
    receipt_number TEXT,
    total_amount NUMERIC(14, 2),
    total_cost NUMERIC(14, 2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_shift public.staff_shifts%ROWTYPE;
    v_sale_id UUID;
    v_receipt_number TEXT;
    v_subtotal NUMERIC(14, 2) := 0.00;
    v_total_cost NUMERIC(14, 2) := 0.00;
    v_item JSONB;
    v_prod_id UUID;
    v_req_qty INT;
    v_product public.products%ROWTYPE;
    v_available_pos INT;
    v_rem_qty INT;
    v_batch RECORD;
    v_deduct_qty INT;
    v_prev_pos INT;
    v_new_pos INT;
    v_line_total NUMERIC(14, 2);
    v_line_cost NUMERIC(14, 2);
    v_now TIMESTAMPTZ := timezone('utc', now());
    v_today DATE := CURRENT_DATE;
BEGIN
    -- 1. Validate Active Shift
    SELECT * INTO v_shift
    FROM public.staff_shifts
    WHERE id = p_shift_id AND status = 'active'
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Cannot record sale: No valid active shift found for this session.'::TEXT, NULL::UUID, NULL::TEXT, 0.00::NUMERIC, 0.00::NUMERIC;
        RETURN;
    END IF;

    IF p_payment_method NOT IN ('cash', 'bank_transfer') THEN
        RETURN QUERY SELECT false, 'Payment method must be cash or bank_transfer.'::TEXT, NULL::UUID, NULL::TEXT, 0.00::NUMERIC, 0.00::NUMERIC;
        RETURN;
    END IF;

    IF jsonb_array_length(p_items) = 0 THEN
        RETURN QUERY SELECT false, 'No items provided for sale.'::TEXT, NULL::UUID, NULL::TEXT, 0.00::NUMERIC, 0.00::NUMERIC;
        RETURN;
    END IF;

    -- 2. Pre-flight Check: Validate Stock Availability for all items at POS Counter
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_prod_id := (v_item->>'product_id')::UUID;
        v_req_qty := (v_item->>'quantity')::INT;

        IF v_req_qty <= 0 THEN
            RETURN QUERY SELECT false, 'Item quantity must be greater than zero.'::TEXT, NULL::UUID, NULL::TEXT, 0.00::NUMERIC, 0.00::NUMERIC;
            RETURN;
        END IF;

        SELECT * INTO v_product FROM public.products WHERE id = v_prod_id AND is_active = true;
        IF NOT FOUND THEN
            RETURN QUERY SELECT false, format('Product ID %s not found or inactive.', v_prod_id)::TEXT, NULL::UUID, NULL::TEXT, 0.00::NUMERIC, 0.00::NUMERIC;
            RETURN;
        END IF;

        -- Check total available non-expired stock in POS Terminal
        SELECT COALESCE(SUM(quantity_pos_terminal), 0) INTO v_available_pos
        FROM public.stock_batches
        WHERE product_id = v_prod_id AND expiry_date >= v_today;

        IF v_available_pos < v_req_qty THEN
            RETURN QUERY SELECT false, 
                format('Insufficient POS Terminal stock for "%s". Requested: %s, Available at POS counter: %s. (Please transfer stock from Main Store first).', v_product.name, v_req_qty, v_available_pos)::TEXT,
                NULL::UUID, NULL::TEXT, 0.00::NUMERIC, 0.00::NUMERIC;
            RETURN;
        END IF;
    END LOOP;

    -- 3. Generate Receipt Number
    v_receipt_number := 'REC-' || to_char(v_now, 'YYYYMMDD-HH24MISS') || '-' || substr(md5(random()::text), 1, 4);

    -- 4. Initial Sale Record
    INSERT INTO public.sales (
        receipt_number, shift_id, staff_id, staff_name, customer_name,
        payment_method, subtotal_amount, discount_amount, total_amount,
        total_cost_of_goods, status
    ) VALUES (
        v_receipt_number, v_shift.id, v_shift.staff_id, v_shift.staff_name, COALESCE(p_customer_name, 'Walk-in Customer'),
        p_payment_method, 0.00, COALESCE(p_discount, 0.00), 0.00,
        0.00, 'completed'
    ) RETURNING id INTO v_sale_id;

    -- 5. Process Each Item Using FEFO (First-Expired, First-Out)
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_prod_id := (v_item->>'product_id')::UUID;
        v_req_qty := (v_item->>'quantity')::INT;

        SELECT * INTO v_product FROM public.products WHERE id = v_prod_id FOR UPDATE;

        v_rem_qty := v_req_qty;

        -- Loop through batches with POS stock ordered by expiry_date ASC (FEFO)
        FOR v_batch IN
            SELECT *
            FROM public.stock_batches
            WHERE product_id = v_prod_id 
              AND quantity_pos_terminal > 0
              AND expiry_date >= v_today
            ORDER BY expiry_date ASC, created_at ASC
            FOR UPDATE
        LOOP
            IF v_rem_qty <= 0 THEN
                EXIT;
            END IF;

            v_deduct_qty := LEAST(v_rem_qty, v_batch.quantity_pos_terminal);
            v_prev_pos := v_batch.quantity_pos_terminal;
            v_new_pos := v_prev_pos - v_deduct_qty;

            -- Update Batch
            UPDATE public.stock_batches
            SET quantity_pos_terminal = v_new_pos,
                updated_at = v_now
            WHERE id = v_batch.id;

            -- Compute amounts for this batch portion
            v_line_total := v_deduct_qty * v_product.selling_price;
            v_line_cost := v_deduct_qty * v_batch.purchase_cost;

            v_subtotal := v_subtotal + v_line_total;
            v_total_cost := v_total_cost + v_line_cost;

            -- Record Sale Item
            INSERT INTO public.sale_items (
                sale_id, product_id, product_name, batch_id, batch_number,
                quantity, unit_cost_price, unit_selling_price, total_price
            ) VALUES (
                v_sale_id, v_product.id, v_product.name, v_batch.id, v_batch.batch_number,
                v_deduct_qty, v_batch.purchase_cost, v_product.selling_price, v_line_total
            );

            -- Record Immutable Stock Movement
            INSERT INTO public.stock_movements (
                shift_id, staff_id, staff_name, product_id, product_name,
                batch_id, batch_number, movement_type, quantity,
                source_location, destination_location,
                prev_main_store, new_main_store, prev_pos_terminal, new_pos_terminal,
                reason
            ) VALUES (
                v_shift.id, v_shift.staff_id, v_shift.staff_name, v_product.id, v_product.name,
                v_batch.id, v_batch.batch_number, 'sale', v_deduct_qty,
                'pos_terminal', 'external',
                v_batch.quantity_main_store, v_batch.quantity_main_store, v_prev_pos, v_new_pos,
                format('POS Sale: %s (Receipt #%s)', v_product.name, v_receipt_number)
            );

            v_rem_qty := v_rem_qty - v_deduct_qty;
        END LOOP;

        IF v_rem_qty > 0 THEN
            RAISE EXCEPTION 'Failed to satisfy required quantity % for product % from available batches', v_req_qty, v_product.name;
        END IF;
    END LOOP;

    -- 6. Update Sale Totals
    UPDATE public.sales
    SET subtotal_amount = v_subtotal,
        total_amount = GREATEST(0.00, v_subtotal - COALESCE(p_discount, 0.00)),
        total_cost_of_goods = v_total_cost,
        updated_at = v_now
    WHERE id = v_sale_id;

    -- 7. Record Inflow in Financial Ledger
    INSERT INTO public.financial_ledger (
        transaction_ref, entry_type, channel, direction, amount,
        description, shift_id, staff_id, recorded_by, metadata
    ) VALUES (
        v_receipt_number, 'sale', p_payment_method, 'inflow',
        GREATEST(0.00, v_subtotal - COALESCE(p_discount, 0.00)),
        format('Sale %s (%s)', v_receipt_number, p_payment_method),
        v_shift.id, v_shift.staff_id, v_shift.staff_name,
        jsonb_build_object('sale_id', v_sale_id, 'customer', p_customer_name)
    );

    -- 8. Update Shift Operational and Financial Totals
    UPDATE public.staff_shifts
    SET operations_count = operations_count + 1,
        total_sales_amount = total_sales_amount + GREATEST(0.00, v_subtotal - COALESCE(p_discount, 0.00)),
        cash_sales_amount = cash_sales_amount + CASE WHEN p_payment_method = 'cash' THEN GREATEST(0.00, v_subtotal - COALESCE(p_discount, 0.00)) ELSE 0.00 END,
        transfer_sales_amount = transfer_sales_amount + CASE WHEN p_payment_method = 'bank_transfer' THEN GREATEST(0.00, v_subtotal - COALESCE(p_discount, 0.00)) ELSE 0.00 END,
        expected_cash = expected_cash + CASE WHEN p_payment_method = 'cash' THEN GREATEST(0.00, v_subtotal - COALESCE(p_discount, 0.00)) ELSE 0.00 END,
        updated_at = v_now
    WHERE id = v_shift.id;

    RETURN QUERY SELECT true, 'Sale recorded successfully. Inventory and financial accounts updated.'::TEXT,
                        v_sale_id, v_receipt_number, GREATEST(0.00, v_subtotal - COALESCE(p_discount, 0.00)), v_total_cost;
END;
$$;

-- ============================================================================
-- 3. REVERSE SALE (Owner Authorized Reversal / Void / Refund)
-- Restores stock to batches and records refund outflow in financial ledger
-- ============================================================================
CREATE OR REPLACE FUNCTION public.reverse_sale(
    p_sale_id UUID,
    p_reversal_reason TEXT,
    p_reversed_by UUID DEFAULT NULL
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_sale public.sales%ROWTYPE;
    v_item RECORD;
    v_batch public.stock_batches%ROWTYPE;
    v_prev_pos INT;
    v_new_pos INT;
    v_active_shift RECORD;
    v_shift_id UUID;
    v_reverser_name TEXT := 'Owner';
    v_now TIMESTAMPTZ := timezone('utc', now());
BEGIN
    SELECT * INTO v_sale
    FROM public.sales
    WHERE id = p_sale_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Sale record not found.'::TEXT;
        RETURN;
    END IF;

    IF v_sale.status = 'reversed' THEN
        RETURN QUERY SELECT false, 'Sale has already been reversed.'::TEXT;
        RETURN;
    END IF;

    IF p_reversal_reason IS NULL OR length(trim(p_reversal_reason)) < 5 THEN
        RETURN QUERY SELECT false, 'A valid explanation is required to reverse a sale.'::TEXT;
        RETURN;
    END IF;

    -- Check staff/reverser
    IF p_reversed_by IS NOT NULL THEN
        SELECT full_name INTO v_reverser_name FROM public.staff_profiles WHERE id = p_reversed_by;
    END IF;

    -- Active shift or sale shift
    SELECT id INTO v_shift_id FROM public.staff_shifts WHERE status = 'active' LIMIT 1;
    IF v_shift_id IS NULL THEN
        v_shift_id := v_sale.shift_id;
    END IF;

    -- 1. Restore Stock for each sale item
    FOR v_item IN
        SELECT * FROM public.sale_items WHERE sale_id = p_sale_id
    LOOP
        SELECT * INTO v_batch FROM public.stock_batches WHERE id = v_item.batch_id FOR UPDATE;

        IF FOUND THEN
            v_prev_pos := v_batch.quantity_pos_terminal;
            v_new_pos := v_prev_pos + v_item.quantity;

            UPDATE public.stock_batches
            SET quantity_pos_terminal = v_new_pos,
                updated_at = v_now
            WHERE id = v_batch.id;

            -- Stock movement reversal audit
            INSERT INTO public.stock_movements (
                shift_id, staff_id, staff_name, product_id, product_name,
                batch_id, batch_number, movement_type, quantity,
                source_location, destination_location,
                prev_main_store, new_main_store, prev_pos_terminal, new_pos_terminal,
                reason
            ) VALUES (
                v_shift_id, v_sale.staff_id, v_reverser_name, v_item.product_id, v_item.product_name,
                v_batch.id, v_batch.batch_number, 'sale_reversal', v_item.quantity,
                'external', 'pos_terminal',
                v_batch.quantity_main_store, v_batch.quantity_main_store, v_prev_pos, v_new_pos,
                format('Sale Reversal: #%s (%s)', v_sale.receipt_number, p_reversal_reason)
            );
        END IF;
    END LOOP;

    -- 2. Mark Sale as Reversed
    UPDATE public.sales
    SET status = 'reversed',
        reversal_reason = p_reversal_reason,
        reversed_at = v_now,
        reversed_by = p_reversed_by,
        updated_at = v_now
    WHERE id = p_sale_id;

    -- 3. Record Outflow Refund in Financial Ledger
    INSERT INTO public.financial_ledger (
        transaction_ref, entry_type, channel, direction, amount,
        description, shift_id, staff_id, recorded_by, metadata
    ) VALUES (
        'REV-' || v_sale.receipt_number, 'sale_reversal', v_sale.payment_method, 'outflow',
        v_sale.total_amount,
        format('Sale Reversal #%s: %s', v_sale.receipt_number, p_reversal_reason),
        v_shift_id, v_sale.staff_id, v_reverser_name,
        jsonb_build_object('original_sale_id', v_sale.id, 'receipt', v_sale.receipt_number)
    );

    RETURN QUERY SELECT true, 'Sale reversed successfully. Stock restored and refund ledger recorded.'::TEXT;
END;
$$;

-- ============================================================================
-- 4. RECORD BUSINESS EXPENSE
-- ============================================================================
CREATE OR REPLACE FUNCTION public.record_business_expense(
    p_category TEXT,
    p_description TEXT,
    p_amount NUMERIC(14, 2),
    p_payment_method TEXT,
    p_recorded_by TEXT,
    p_shift_id UUID DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    expense_id UUID,
    expense_number TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_expense_id UUID;
    v_expense_num TEXT;
    v_staff_id UUID;
    v_shift RECORD;
    v_now TIMESTAMPTZ := timezone('utc', now());
BEGIN
    IF p_amount <= 0 THEN
        RETURN QUERY SELECT false, 'Expense amount must be greater than zero.'::TEXT, NULL::UUID, NULL::TEXT;
        RETURN;
    END IF;

    IF p_payment_method NOT IN ('cash', 'bank_transfer') THEN
        RETURN QUERY SELECT false, 'Payment method must be cash or bank_transfer.'::TEXT, NULL::UUID, NULL::TEXT;
        RETURN;
    END IF;

    -- Active shift if supplied
    IF p_shift_id IS NOT NULL THEN
        SELECT id, staff_id INTO v_shift
        FROM public.staff_shifts
        WHERE id = p_shift_id AND status = 'active';

        IF FOUND THEN
            v_staff_id := v_shift.staff_id;
        END IF;
    END IF;

    v_expense_num := 'EXP-' || to_char(v_now, 'YYYYMMDD-HH24MISS') || '-' || substr(md5(random()::text), 1, 4);

    -- 1. Insert Expense Record
    INSERT INTO public.expenses (
        expense_number, category, description, amount, payment_method,
        expense_date, recorded_by, shift_id, staff_id, notes
    ) VALUES (
        v_expense_num, p_category, p_description, p_amount, p_payment_method,
        CURRENT_DATE, p_recorded_by, p_shift_id, v_staff_id, p_notes
    ) RETURNING id INTO v_expense_id;

    -- 2. Insert Outflow in Financial Ledger
    INSERT INTO public.financial_ledger (
        transaction_ref, entry_type, channel, direction, amount,
        description, shift_id, staff_id, recorded_by, metadata
    ) VALUES (
        v_expense_num, 'expense', p_payment_method, 'outflow', p_amount,
        format('Expense: %s - %s', p_category, p_description),
        p_shift_id, v_staff_id, p_recorded_by,
        jsonb_build_object('expense_id', v_expense_id, 'category', p_category)
    );

    -- 3. If paid with cash during an active shift, deduct from expected cash
    IF p_shift_id IS NOT NULL AND p_payment_method = 'cash' THEN
        UPDATE public.staff_shifts
        SET expected_cash = expected_cash - p_amount,
            updated_at = v_now
        WHERE id = p_shift_id;
    END IF;

    RETURN QUERY SELECT true, 'Business expense recorded successfully.'::TEXT, v_expense_id, v_expense_num;
END;
$$;

-- ============================================================================
-- 5. END STAFF SHIFT (UPGRADED WITH FULL CASH RECONCILIATION)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.end_staff_shift_v2(
    p_shift_id UUID,
    p_counted_cash NUMERIC(14, 2),
    p_handover_notes TEXT
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    shift_id UUID,
    duration_seconds INT,
    operations_count INT,
    expected_cash NUMERIC(14, 2),
    counted_cash NUMERIC(14, 2),
    cash_difference NUMERIC(14, 2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_shift public.staff_shifts%ROWTYPE;
    v_now TIMESTAMPTZ := timezone('utc', now());
    v_duration INT;
    v_op_count INT;
    v_difference NUMERIC(14, 2);
    v_counted NUMERIC(14, 2);
BEGIN
    SELECT * INTO v_shift
    FROM public.staff_shifts
    WHERE id = p_shift_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Shift not found.'::TEXT, NULL::UUID, NULL::INT, NULL::INT, 0.00::NUMERIC, 0.00::NUMERIC, 0.00::NUMERIC;
        RETURN;
    END IF;

    IF v_shift.status != 'active' THEN
        RETURN QUERY SELECT false, 'This shift is already closed or not active.'::TEXT, v_shift.id, v_shift.duration_seconds, v_shift.operations_count, v_shift.expected_cash, v_shift.counted_cash, v_shift.cash_difference;
        RETURN;
    END IF;

    v_duration := EXTRACT(EPOCH FROM (v_now - v_shift.start_time))::INT;
    v_counted := COALESCE(p_counted_cash, 0.00);
    v_difference := v_counted - v_shift.expected_cash;

    -- Count total movements in shift
    SELECT count(*)::INT INTO v_op_count
    FROM public.stock_movements
    WHERE shift_id = p_shift_id;

    -- Mark Shift Completed
    UPDATE public.staff_shifts
    SET end_time = v_now,
        duration_seconds = v_duration,
        status = 'completed',
        handover_notes = COALESCE(p_handover_notes, 'Handover completed without additional notes.'),
        operations_count = v_op_count,
        counted_cash = v_counted,
        cash_difference = v_difference,
        updated_at = v_now
    WHERE id = p_shift_id;

    -- Record Cash Reconciliation Record
    INSERT INTO public.cash_reconciliations (
        shift_id, staff_id, staff_name, opening_cash, cash_sales,
        cash_expenses, expected_cash, counted_cash, difference, notes
    ) VALUES (
        v_shift.id, v_shift.staff_id, v_shift.staff_name, v_shift.opening_cash, v_shift.cash_sales_amount,
        0.00, v_shift.expected_cash, v_counted, v_difference, p_handover_notes
    );

    RETURN QUERY SELECT true, 'Shift ended and handover with cash reconciliation recorded.'::TEXT,
                        v_shift.id, v_duration, v_op_count, v_shift.expected_cash, v_counted, v_difference;
END;
$$;

-- ============================================================================
-- 6. SET OPENING FINANCIAL BALANCES
-- ============================================================================
CREATE OR REPLACE FUNCTION public.set_financial_opening_balances(
    p_cash_opening NUMERIC(14, 2),
    p_bank_opening NUMERIC(14, 2),
    p_recorded_by TEXT,
    p_notes TEXT DEFAULT 'Initial balance setup'
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    INSERT INTO public.pharmacy_settings (key, value, updated_at)
    VALUES (
        'financial_opening_balances',
        jsonb_build_object(
            'cash_opening', p_cash_opening,
            'bank_opening', p_bank_opening,
            'recorded_by', p_recorded_by,
            'notes', p_notes,
            'set_at', timezone('utc', now())
        ),
        timezone('utc', now())
    )
    ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value,
        updated_at = EXCLUDED.updated_at;

    RETURN QUERY SELECT true, 'Financial opening balances configured successfully.'::TEXT;
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.record_stock_intake_purchase TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.record_pos_sale TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reverse_sale TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.record_business_expense TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.end_staff_shift_v2 TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.set_financial_opening_balances TO anon, authenticated, service_role;
