-- MaxiCare Pharmacy Migration: 003_upgrade_pin_hashing_bcrypt.sql
-- 1. Upgrades staff PIN hashing from fast SHA-256 to slow, adaptive bcrypt (work factor 12) via pgcrypto.
-- 2. Enforces minimum 8-digit PIN requirement on staff PIN registration and verification.
-- 3. Marks legacy demo records explicitly as demonstration records (is_demo flag) so they are never confused with real staff.
-- 4. Migrates demonstration staff PINs to bcrypt-hashed 8-digit PINs.
-- 5. Hardens verify_staff_pin against fast-hash attacks, refusing any non-bcrypt hash or PIN < 8 digits.

-- Add flag to distinguish demonstration seed data from actual verified business staff
ALTER TABLE public.staff_profiles 
ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;

-- A. Modernized Staff PIN Verification Function (Strictly bcrypt, >=8 digits, 5-attempt lockout, fixed search path)
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
BEGIN
    -- 1. Validate PIN complexity: Minimum 8 characters/digits
    IF p_pin IS NULL OR length(p_pin) < 8 THEN
        RETURN QUERY SELECT false, 'Invalid PIN format: Staff PIN must be at least 8 digits.'::TEXT, NULL::UUID, NULL::TEXT, NULL::TEXT;
        RETURN;
    END IF;

    -- 2. Retrieve and row-lock staff profile
    SELECT * INTO v_staff
    FROM public.staff_profiles
    WHERE id = p_staff_id AND is_active = true
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Staff profile not found or inactive.'::TEXT, NULL::UUID, NULL::TEXT, NULL::TEXT;
        RETURN;
    END IF;

    -- 3. Check lockout status
    IF v_staff.locked_until IS NOT NULL AND v_staff.locked_until > timezone('utc', now()) THEN
        RETURN QUERY SELECT false, 
            format('Account temporarily locked due to excessive failed attempts. Please retry after %s.', to_char(v_staff.locked_until, 'HH24:MI:SS UTC'))::TEXT,
            NULL::UUID, NULL::TEXT, NULL::TEXT;
        RETURN;
    END IF;

    -- 4. Reject obsolete fast-hash (non-bcrypt) records
    IF v_staff.pin_hash NOT LIKE '$2%' THEN
        RETURN QUERY SELECT false, 'Security Error: Legacy insecure PIN format detected. Please request a PIN reset from the pharmacy owner.'::TEXT, NULL::UUID, NULL::TEXT, NULL::TEXT;
        RETURN;
    END IF;

    -- 5. Slow-hash verification using bcrypt crypt(p_pin, stored_hash)
    IF extensions.crypt(p_pin, v_staff.pin_hash) = v_staff.pin_hash THEN
        -- Reset failed counter and clear lockout upon successful authentication
        UPDATE public.staff_profiles
        SET failed_attempts = 0, locked_until = NULL, updated_at = timezone('utc', now())
        WHERE id = p_staff_id;

        RETURN QUERY SELECT true, 'Authentication successful.'::TEXT, v_staff.id, v_staff.full_name, v_staff.role;
    ELSE
        -- Failed attempt increment and 15-minute lockout enforcement after 5 attempts
        IF v_staff.failed_attempts + 1 >= 5 THEN
            UPDATE public.staff_profiles
            SET failed_attempts = v_staff.failed_attempts + 1,
                locked_until = timezone('utc', now()) + INTERVAL '15 minutes',
                updated_at = timezone('utc', now())
            WHERE id = p_staff_id;
            RETURN QUERY SELECT false, 'Incorrect PIN. Profile locked for 15 minutes due to 5 consecutive failed attempts.'::TEXT, NULL::UUID, NULL::TEXT, NULL::TEXT;
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

-- B. Safe Registration / Reset Procedure for Staff PINs (bcrypt work factor 12)
CREATE OR REPLACE FUNCTION public.set_staff_pin(
    p_staff_id UUID,
    p_new_pin TEXT
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
BEGIN
    IF p_new_pin IS NULL OR length(p_new_pin) < 8 THEN
        RETURN QUERY SELECT false, 'PIN must be at least 8 digits/characters long.'::TEXT;
        RETURN;
    END IF;

    UPDATE public.staff_profiles
    SET pin_hash = extensions.crypt(p_new_pin, extensions.gen_salt('bf', 12)),
        pin_salt = 'bcrypt_auto_salted',
        failed_attempts = 0,
        locked_until = NULL,
        updated_at = timezone('utc', now())
    WHERE id = p_staff_id;

    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Staff profile not found.'::TEXT;
        RETURN;
    END IF;

    RETURN QUERY SELECT true, 'Staff PIN updated successfully with bcrypt encryption.'::TEXT;
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.verify_staff_pin(UUID, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.set_staff_pin(UUID, TEXT) TO anon, authenticated, service_role;

-- Migrate pre-seeded demo staff profiles:
-- Update with 8-digit demo PINs using bcrypt (work factor 12)
-- Demo Staff 1: PIN 12345678
-- Demo Staff 2: PIN 56781234
-- Demo Staff 3: PIN 90123456
UPDATE public.staff_profiles
SET is_demo = true,
    pin_salt = 'bcrypt_auto_salted',
    pin_hash = extensions.crypt('12345678', extensions.gen_salt('bf', 12)),
    failed_attempts = 0,
    locked_until = NULL,
    updated_at = timezone('utc', now())
WHERE staff_code = 'STF-001';

UPDATE public.staff_profiles
SET is_demo = true,
    pin_salt = 'bcrypt_auto_salted',
    pin_hash = extensions.crypt('56781234', extensions.gen_salt('bf', 12)),
    failed_attempts = 0,
    locked_until = NULL,
    updated_at = timezone('utc', now())
WHERE staff_code = 'STF-002';

UPDATE public.staff_profiles
SET is_demo = true,
    pin_salt = 'bcrypt_auto_salted',
    pin_hash = extensions.crypt('90123456', extensions.gen_salt('bf', 12)),
    failed_attempts = 0,
    locked_until = NULL,
    updated_at = timezone('utc', now())
WHERE staff_code = 'STF-003';

-- Tag pre-seeded products as demo products
UPDATE public.products SET is_demo = true;
