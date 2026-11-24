-- MaxiCare Pharmacy Utility: 004_purge_demo_data.sql
-- Run this script when transitioning from development/demonstration mode to production.
-- Safely purges only records marked with is_demo = true and associated demo batches/shifts.

-- 1. Remove demo stock movements
DELETE FROM public.stock_movements 
WHERE product_id IN (SELECT id FROM public.products WHERE is_demo = true)
   OR staff_id IN (SELECT id FROM public.staff_profiles WHERE is_demo = true);

-- 2. Remove demo stock batches
DELETE FROM public.stock_batches 
WHERE product_id IN (SELECT id FROM public.products WHERE is_demo = true);

-- 3. Remove demo shifts
DELETE FROM public.staff_shifts 
WHERE staff_id IN (SELECT id FROM public.staff_profiles WHERE is_demo = true);

-- 4. Remove demo products and staff
DELETE FROM public.products WHERE is_demo = true;
DELETE FROM public.staff_profiles WHERE is_demo = true;
