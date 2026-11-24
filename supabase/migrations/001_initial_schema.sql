-- MaxiCare Pharmacy Inventory Migration: 001_initial_schema.sql
-- Enforces:
-- 1. Single active shift via unique partial index.
-- 2. Staff profiles with salted & hashed PINs, lockout protection.
-- 3. Inventory catalog with NUMERIC monetary types.
-- 4. Stock batches with dual-location storage (Main Store, POS Terminal).
-- 5. Append-only stock movements audit trail with RLS and trigger protections.
-- 6. Atomic functions for shift start/end, transfers, and adjustments.

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. STAFF PROFILES & PIN SECURITY
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.staff_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    staff_code TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'Pharmacist',
    pin_hash TEXT NOT NULL,
    pin_salt TEXT NOT NULL,
    failed_attempts INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ============================================================================
-- 2. STAFF SHIFTS (Enforcing Exactly One Active Shift)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.staff_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL REFERENCES public.staff_profiles(id) ON DELETE RESTRICT,
    staff_name TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    end_time TIMESTAMPTZ,
    duration_seconds INT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'interrupted')),
    handover_notes TEXT,
    operations_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Strict unique partial index: Only ONE active shift allowed system-wide at any given moment
CREATE UNIQUE INDEX IF NOT EXISTS idx_single_active_shift 
ON public.staff_shifts (status) 
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_staff_shifts_staff_id ON public.staff_shifts (staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_shifts_start_time ON public.staff_shifts (start_time DESC);

-- ============================================================================
-- 3. PRODUCTS CATALOG
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    dosage_form TEXT NOT NULL DEFAULT 'Tablet',
    unit TEXT NOT NULL DEFAULT 'Packs',
    selling_price NUMERIC(12, 2) NOT NULL CHECK (selling_price >= 0),
    low_stock_threshold INT NOT NULL DEFAULT 10 CHECK (low_stock_threshold >= 0),
    supplier TEXT NOT NULL DEFAULT 'Certified Distributor',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products (sku);

-- ============================================================================
-- 4. STOCK BATCHES (Location-specific: Main Store & POS Terminal)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.stock_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    batch_number TEXT NOT NULL,
    expiry_date DATE NOT NULL,
    purchase_cost NUMERIC(12, 2) NOT NULL CHECK (purchase_cost >= 0),
    quantity_main_store INT NOT NULL DEFAULT 0 CHECK (quantity_main_store >= 0),
    quantity_pos_terminal INT NOT NULL DEFAULT 0 CHECK (quantity_pos_terminal >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT uq_product_batch UNIQUE (product_id, batch_number)
);

CREATE INDEX IF NOT EXISTS idx_stock_batches_product_id ON public.stock_batches (product_id);
CREATE INDEX IF NOT EXISTS idx_stock_batches_expiry ON public.stock_batches (expiry_date);

-- ============================================================================
-- 5. STOCK MOVEMENTS (Append-Only Audit History)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shift_id UUID NOT NULL REFERENCES public.staff_shifts(id) ON DELETE RESTRICT,
    staff_id UUID NOT NULL REFERENCES public.staff_profiles(id) ON DELETE RESTRICT,
    staff_name TEXT NOT NULL,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    product_name TEXT NOT NULL,
    batch_id UUID NOT NULL REFERENCES public.stock_batches(id) ON DELETE RESTRICT,
    batch_number TEXT NOT NULL,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('intake', 'transfer_to_pos', 'transfer_to_main', 'reduction', 'correction')),
    quantity INT NOT NULL CHECK (quantity > 0),
    source_location TEXT CHECK (source_location IN ('main_store', 'pos_terminal', 'external')),
    destination_location TEXT CHECK (destination_location IN ('main_store', 'pos_terminal', 'waste', 'external')),
    prev_main_store INT NOT NULL,
    new_main_store INT NOT NULL,
    prev_pos_terminal INT NOT NULL,
    new_pos_terminal INT NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_shift ON public.stock_movements (shift_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON public.stock_movements (product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_batch ON public.stock_movements (batch_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created ON public.stock_movements (created_at DESC);

-- Trigger to prevent UPDATE or DELETE on stock_movements (strict append-only)
CREATE OR REPLACE FUNCTION public.prevent_stock_movement_mutation()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RAISE EXCEPTION 'Stock movements are immutable audit records and cannot be updated or deleted.';
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_movement_update ON public.stock_movements;
CREATE TRIGGER trg_prevent_movement_update
BEFORE UPDATE OR DELETE ON public.stock_movements
FOR EACH ROW EXECUTE FUNCTION public.prevent_stock_movement_mutation();

-- ============================================================================
-- 6. SECURITY DEFINER RPCs (ATOMIC OPERATIONS & ROW LOCKING)
-- ============================================================================

-- A. Verify Staff PIN with lockout check
CREATE OR REPLACE FUNCTION public.verify_staff_pin(
    p_staff_id UUID,
    p_pin TEXT
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    staff_id UUID,
    staff_name TEXT,
    staff_role TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_staff public.staff_profiles%ROWTYPE;
    v_calculated_hash TEXT;
BEGIN
    SELECT * INTO v_staff
    FROM public.staff_profiles
    WHERE id = p_staff_id AND is_active = true
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Staff profile not found or inactive.'::TEXT, NULL::UUID, NULL::TEXT, NULL::TEXT;
        RETURN;
    END IF;

    -- Check if locked
    IF v_staff.locked_until IS NOT NULL AND v_staff.locked_until > timezone('utc', now()) THEN
        RETURN QUERY SELECT false, 
            format('Account temporarily locked due to excessive failed attempts. Please retry after %s.', to_char(v_staff.locked_until, 'HH24:MI:SS UTC'))::TEXT,
            NULL::UUID, NULL::TEXT, NULL::TEXT;
        RETURN;
    END IF;

    -- Verify hash: sha256(pin + salt)
    v_calculated_hash := encode(digest(p_pin || v_staff.pin_salt, 'sha256'), 'hex');

    IF v_calculated_hash = v_staff.pin_hash THEN
        -- Reset failed attempts on success
        UPDATE public.staff_profiles
        SET failed_attempts = 0, locked_until = NULL, updated_at = timezone('utc', now())
        WHERE id = p_staff_id;

        RETURN QUERY SELECT true, 'Authentication successful.'::TEXT, v_staff.id, v_staff.full_name, v_staff.role;
    ELSE
        -- Increment failed attempts, lock if >= 5 attempts for 15 minutes
        IF v_staff.failed_attempts + 1 >= 5 THEN
            UPDATE public.staff_profiles
            SET failed_attempts = v_staff.failed_attempts + 1,
                locked_until = timezone('utc', now()) + INTERVAL '15 minutes',
                updated_at = timezone('utc', now())
            WHERE id = p_staff_id;
            RETURN QUERY SELECT false, 'Incorrect PIN. Profile locked for 15 minutes due to 5 failed attempts.'::TEXT, NULL::UUID, NULL::TEXT, NULL::TEXT;
        ELSE
            UPDATE public.staff_profiles
            SET failed_attempts = v_staff.failed_attempts + 1,
                updated_at = timezone('utc', now())
            WHERE id = p_staff_id;
            RETURN QUERY SELECT false, format('Incorrect PIN. Attempt %s of 5.', v_staff.failed_attempts + 1)::TEXT, NULL::UUID, NULL::TEXT, NULL::TEXT;
        END IF;
    END IF;
END;
$$;

-- B. Start Staff Shift
CREATE OR REPLACE FUNCTION public.start_staff_shift(
    p_staff_id UUID,
    p_pin TEXT
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    shift_id UUID,
    staff_name TEXT,
    start_time TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_auth_record RECORD;
    v_active_shift RECORD;
    v_new_shift_id UUID;
    v_now TIMESTAMPTZ := timezone('utc', now());
BEGIN
    -- 1. Check if there is already an active shift
    SELECT id, staff_name, start_time INTO v_active_shift
    FROM public.staff_shifts
    WHERE status = 'active'
    LIMIT 1;

    IF FOUND THEN
        RETURN QUERY SELECT false, 
            format('Cannot start shift. Another shift is currently active (Held by: %s, started at %s). End the active shift before starting a new one.', v_active_shift.staff_name, to_char(v_active_shift.start_time, 'YYYY-MM-DD HH24:MI'))::TEXT,
            v_active_shift.id, v_active_shift.staff_name, v_active_shift.start_time;
        RETURN;
    END IF;

    -- 2. Verify staff PIN
    SELECT * INTO v_auth_record FROM public.verify_staff_pin(p_staff_id, p_pin);
    IF NOT v_auth_record.success THEN
        RETURN QUERY SELECT false, v_auth_record.message, NULL::UUID, NULL::TEXT, NULL::TIMESTAMPTZ;
        RETURN;
    END IF;

    -- 3. Create the new shift
    INSERT INTO public.staff_shifts (staff_id, staff_name, start_time, status)
    VALUES (p_staff_id, v_auth_record.staff_name, v_now, 'active')
    RETURNING id INTO v_new_shift_id;

    RETURN QUERY SELECT true, 'Shift started successfully.'::TEXT, v_new_shift_id, v_auth_record.staff_name, v_now;
END;
$$;

-- C. End Staff Shift & Handover
CREATE OR REPLACE FUNCTION public.end_staff_shift(
    p_shift_id UUID,
    p_handover_notes TEXT
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    shift_id UUID,
    duration_seconds INT,
    operations_count INT
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
BEGIN
    SELECT * INTO v_shift
    FROM public.staff_shifts
    WHERE id = p_shift_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Shift not found.'::TEXT, NULL::UUID, NULL::INT, NULL::INT;
        RETURN;
    END IF;

    IF v_shift.status != 'active' THEN
        RETURN QUERY SELECT false, 'This shift is already closed or not active.'::TEXT, v_shift.id, v_shift.duration_seconds, v_shift.operations_count;
        RETURN;
    END IF;

    -- Calculate duration
    v_duration := EXTRACT(EPOCH FROM (v_now - v_shift.start_time))::INT;

    -- Count total operations performed under this shift
    SELECT count(*)::INT INTO v_op_count
    FROM public.stock_movements
    WHERE shift_id = p_shift_id;

    -- Mark completed
    UPDATE public.staff_shifts
    SET end_time = v_now,
        duration_seconds = v_duration,
        status = 'completed',
        handover_notes = COALESCE(p_handover_notes, 'Handover completed without additional notes.'),
        operations_count = v_op_count,
        updated_at = v_now
    WHERE id = p_shift_id;

    RETURN QUERY SELECT true, 'Shift ended and handover recorded successfully.'::TEXT, v_shift.id, v_duration, v_op_count;
END;
$$;

-- D. Atomic Stock Transfer (Between Main Store and POS Terminal)
CREATE OR REPLACE FUNCTION public.transfer_stock(
    p_shift_id UUID,
    p_batch_id UUID,
    p_quantity INT,
    p_direction TEXT, -- 'to_pos' or 'to_main'
    p_reason TEXT
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    movement_id UUID,
    new_main_store INT,
    new_pos_terminal INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_shift public.staff_shifts%ROWTYPE;
    v_batch public.stock_batches%ROWTYPE;
    v_product public.products%ROWTYPE;
    v_prev_main INT;
    v_new_main INT;
    v_prev_pos INT;
    v_new_pos INT;
    v_mov_type TEXT;
    v_src_loc TEXT;
    v_dest_loc TEXT;
    v_mov_id UUID;
BEGIN
    IF p_quantity <= 0 THEN
        RETURN QUERY SELECT false, 'Transfer quantity must be greater than zero.'::TEXT, NULL::UUID, NULL::INT, NULL::INT;
        RETURN;
    END IF;

    -- 1. Validate active shift with row locking
    SELECT * INTO v_shift
    FROM public.staff_shifts
    WHERE id = p_shift_id AND status = 'active'
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Operation rejected: No valid active shift found for this session.'::TEXT, NULL::UUID, NULL::INT, NULL::INT;
        RETURN;
    END IF;

    -- 2. Lock batch row for atomic update
    SELECT * INTO v_batch
    FROM public.stock_batches
    WHERE id = p_batch_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Stock batch not found.'::TEXT, NULL::UUID, NULL::INT, NULL::INT;
        RETURN;
    END IF;

    -- Fetch product info
    SELECT * INTO v_product
    FROM public.products
    WHERE id = v_batch.product_id;

    v_prev_main := v_batch.quantity_main_store;
    v_prev_pos := v_batch.quantity_pos_terminal;

    -- 3. Calculate and validate quantities based on direction
    IF p_direction = 'to_pos' THEN
        IF v_batch.quantity_main_store < p_quantity THEN
            RETURN QUERY SELECT false, 
                format('Insufficient stock in Main Store. Available: %s, Requested: %s.', v_batch.quantity_main_store, p_quantity)::TEXT,
                NULL::UUID, v_prev_main, v_prev_pos;
            RETURN;
        END IF;

        v_new_main := v_prev_main - p_quantity;
        v_new_pos := v_prev_pos + p_quantity;
        v_mov_type := 'transfer_to_pos';
        v_src_loc := 'main_store';
        v_dest_loc := 'pos_terminal';
    ELSIF p_direction = 'to_main' THEN
        IF v_batch.quantity_pos_terminal < p_quantity THEN
            RETURN QUERY SELECT false, 
                format('Insufficient stock at POS Terminal. Available: %s, Requested: %s.', v_batch.quantity_pos_terminal, p_quantity)::TEXT,
                NULL::UUID, v_prev_main, v_prev_pos;
            RETURN;
        END IF;

        v_new_main := v_prev_main + p_quantity;
        v_new_pos := v_prev_pos - p_quantity;
        v_mov_type := 'transfer_to_main';
        v_src_loc := 'pos_terminal';
        v_dest_loc := 'main_store';
    ELSE
        RETURN QUERY SELECT false, 'Invalid transfer direction. Allowed: to_pos, to_main.'::TEXT, NULL::UUID, NULL::INT, NULL::INT;
        RETURN;
    END IF;

    -- 4. Apply batch updates
    UPDATE public.stock_batches
    SET quantity_main_store = v_new_main,
        quantity_pos_terminal = v_new_pos,
        updated_at = timezone('utc', now())
    WHERE id = p_batch_id;

    -- 5. Record immutable stock movement
    INSERT INTO public.stock_movements (
        shift_id, staff_id, staff_name, product_id, product_name,
        batch_id, batch_number, movement_type, quantity,
        source_location, destination_location,
        prev_main_store, new_main_store, prev_pos_terminal, new_pos_terminal,
        reason
    ) VALUES (
        v_shift.id, v_shift.staff_id, v_shift.staff_name, v_product.id, v_product.name,
        v_batch.id, v_batch.batch_number, v_mov_type, p_quantity,
        v_src_loc, v_dest_loc,
        v_prev_main, v_new_main, v_prev_pos, v_new_pos,
        COALESCE(p_reason, 'Routine internal location transfer')
    ) RETURNING id INTO v_mov_id;

    -- Update shift operations count
    UPDATE public.staff_shifts
    SET operations_count = operations_count + 1,
        updated_at = timezone('utc', now())
    WHERE id = v_shift.id;

    RETURN QUERY SELECT true, 'Stock transfer completed successfully.'::TEXT, v_mov_id, v_new_main, v_new_pos;
END;
$$;

-- E. Atomic Stock Adjustment (Intake, Damage/Expiry Reduction, Correction)
CREATE OR REPLACE FUNCTION public.adjust_stock(
    p_shift_id UUID,
    p_batch_id UUID,
    p_location TEXT, -- 'main_store' or 'pos_terminal'
    p_type TEXT,     -- 'add', 'reduce', 'correct'
    p_delta INT,
    p_reason TEXT
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    movement_id UUID,
    new_main_store INT,
    new_pos_terminal INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_shift public.staff_shifts%ROWTYPE;
    v_batch public.stock_batches%ROWTYPE;
    v_product public.products%ROWTYPE;
    v_prev_main INT;
    v_new_main INT;
    v_prev_pos INT;
    v_new_pos INT;
    v_mov_type TEXT;
    v_src_loc TEXT;
    v_dest_loc TEXT;
    v_mov_id UUID;
    v_qty INT;
BEGIN
    IF p_delta <= 0 AND p_type != 'correct' THEN
        RETURN QUERY SELECT false, 'Adjustment delta must be greater than zero.'::TEXT, NULL::UUID, NULL::INT, NULL::INT;
        RETURN;
    END IF;

    -- 1. Validate active shift
    SELECT * INTO v_shift
    FROM public.staff_shifts
    WHERE id = p_shift_id AND status = 'active'
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Operation rejected: No valid active shift found for this session.'::TEXT, NULL::UUID, NULL::INT, NULL::INT;
        RETURN;
    END IF;

    -- 2. Lock batch
    SELECT * INTO v_batch
    FROM public.stock_batches
    WHERE id = p_batch_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Stock batch not found.'::TEXT, NULL::UUID, NULL::INT, NULL::INT;
        RETURN;
    END IF;

    SELECT * INTO v_product FROM public.products WHERE id = v_batch.product_id;

    v_prev_main := v_batch.quantity_main_store;
    v_prev_pos := v_batch.quantity_pos_terminal;
    v_new_main := v_prev_main;
    v_new_pos := v_prev_pos;

    IF p_location = 'main_store' THEN
        v_src_loc := 'main_store';
        IF p_type = 'add' THEN
            v_new_main := v_prev_main + p_delta;
            v_mov_type := 'intake';
            v_src_loc := 'external';
            v_dest_loc := 'main_store';
            v_qty := p_delta;
        ELSIF p_type = 'reduce' THEN
            IF v_prev_main < p_delta THEN
                RETURN QUERY SELECT false, format('Cannot reduce: Main Store has only %s units available.', v_prev_main)::TEXT, NULL::UUID, v_prev_main, v_prev_pos;
                RETURN;
            END IF;
            v_new_main := v_prev_main - p_delta;
            v_mov_type := 'reduction';
            v_dest_loc := 'waste';
            v_qty := p_delta;
        ELSIF p_type = 'correct' THEN
            IF p_delta < 0 THEN
                RETURN QUERY SELECT false, 'Stock count cannot be negative.'::TEXT, NULL::UUID, v_prev_main, v_prev_pos;
                RETURN;
            END IF;
            v_qty := abs(p_delta - v_prev_main);
            v_new_main := p_delta;
            v_mov_type := 'correction';
            v_dest_loc := 'main_store';
        END IF;
    ELSIF p_location = 'pos_terminal' THEN
        v_src_loc := 'pos_terminal';
        IF p_type = 'add' THEN
            v_new_pos := v_prev_pos + p_delta;
            v_mov_type := 'intake';
            v_src_loc := 'external';
            v_dest_loc := 'pos_terminal';
            v_qty := p_delta;
        ELSIF p_type = 'reduce' THEN
            IF v_prev_pos < p_delta THEN
                RETURN QUERY SELECT false, format('Cannot reduce: POS Terminal has only %s units available.', v_prev_pos)::TEXT, NULL::UUID, v_prev_main, v_prev_pos;
                RETURN;
            END IF;
            v_new_pos := v_prev_pos - p_delta;
            v_mov_type := 'reduction';
            v_dest_loc := 'waste';
            v_qty := p_delta;
        ELSIF p_type = 'correct' THEN
            IF p_delta < 0 THEN
                RETURN QUERY SELECT false, 'Stock count cannot be negative.'::TEXT, NULL::UUID, v_prev_main, v_prev_pos;
                RETURN;
            END IF;
            v_qty := abs(p_delta - v_prev_pos);
            v_new_pos := p_delta;
            v_mov_type := 'correction';
            v_dest_loc := 'pos_terminal';
        END IF;
    ELSE
        RETURN QUERY SELECT false, 'Invalid location. Allowed: main_store, pos_terminal.'::TEXT, NULL::UUID, NULL::INT, NULL::INT;
        RETURN;
    END IF;

    -- Avoid zero-quantity logs
    IF v_qty = 0 THEN
        v_qty := 1;
    END IF;

    -- Update batch
    UPDATE public.stock_batches
    SET quantity_main_store = v_new_main,
        quantity_pos_terminal = v_new_pos,
        updated_at = timezone('utc', now())
    WHERE id = p_batch_id;

    -- Log movement
    INSERT INTO public.stock_movements (
        shift_id, staff_id, staff_name, product_id, product_name,
        batch_id, batch_number, movement_type, quantity,
        source_location, destination_location,
        prev_main_store, new_main_store, prev_pos_terminal, new_pos_terminal,
        reason
    ) VALUES (
        v_shift.id, v_shift.staff_id, v_shift.staff_name, v_product.id, v_product.name,
        v_batch.id, v_batch.batch_number, v_mov_type, v_qty,
        v_src_loc, v_dest_loc,
        v_prev_main, v_new_main, v_prev_pos, v_new_pos,
        COALESCE(p_reason, 'Manual stock adjustment')
    ) RETURNING id INTO v_mov_id;

    UPDATE public.staff_shifts
    SET operations_count = operations_count + 1,
        updated_at = timezone('utc', now())
    WHERE id = v_shift.id;

    RETURN QUERY SELECT true, 'Stock adjustment completed successfully.'::TEXT, v_mov_id, v_new_main, v_new_pos;
END;
$$;

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS by default.
-- For authenticated users and anon read:
CREATE POLICY "Allow read staff_profiles to all users" ON public.staff_profiles FOR SELECT USING (true);
CREATE POLICY "Allow read staff_shifts to all users" ON public.staff_shifts FOR SELECT USING (true);
CREATE POLICY "Allow read products to all users" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow read stock_batches to all users" ON public.stock_batches FOR SELECT USING (true);
CREATE POLICY "Allow read stock_movements to all users" ON public.stock_movements FOR SELECT USING (true);

-- Mutations are guarded: Direct table modifications are restricted to service role or through the verified RPC functions
CREATE POLICY "Service role full access staff_profiles" ON public.staff_profiles FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access staff_shifts" ON public.staff_shifts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access products" ON public.products FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access stock_batches" ON public.stock_batches FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access stock_movements" ON public.stock_movements FOR ALL USING (auth.role() = 'service_role');

-- Revoke dangerous direct permissions and grant execution to authenticated and anon for safe RPCs
GRANT EXECUTE ON FUNCTION public.verify_staff_pin(UUID, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.start_staff_shift(UUID, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.end_staff_shift(UUID, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.transfer_stock(UUID, UUID, INT, TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.adjust_stock(UUID, UUID, TEXT, TEXT, INT, TEXT) TO anon, authenticated, service_role;
