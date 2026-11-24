-- MaxiCare Pharmacy Seed Data: Initial Demonstration Records
-- ALL RECORDS IN THIS FILE ARE EXPLICIT DEMONSTRATION / DEVELOPMENT RECORDS.
-- They do NOT represent real live pharmacy inventory or confidential staff credentials.
-- When launching in production, run '004_purge_demo_data.sql' to clear demonstration records.

INSERT INTO public.staff_profiles (id, full_name, staff_code, role, is_demo, pin_salt, pin_hash)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'Dr. Adebayo Adeleke (DEMO)', 'STF-001', 'Lead Pharmacist', true, 'bcrypt_auto_salted', extensions.crypt('12345678', extensions.gen_salt('bf', 12))),
    ('22222222-2222-2222-2222-222222222222', 'Pharm. Chioma Okonkwo (DEMO)', 'STF-002', 'Dispensing Specialist', true, 'bcrypt_auto_salted', extensions.crypt('56781234', extensions.gen_salt('bf', 12))),
    ('33333333-3333-3333-3333-333333333333', 'Pharm. Ibrahim Musa (DEMO)', 'STF-003', 'Inventory Officer', true, 'bcrypt_auto_salted', extensions.crypt('90123456', extensions.gen_salt('bf', 12)))
ON CONFLICT (staff_code) DO NOTHING;

-- Demonstration Products Catalog
INSERT INTO public.products (id, sku, name, category, dosage_form, unit, selling_price, low_stock_threshold, supplier, is_demo)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'MXC-AMX-500', 'Amoxicillin 500mg Capsules (DEMO)', 'Antibiotics & Prescriptions', 'Capsule', 'Blister Packs (10s)', 1800.00, 15, 'Emzor Pharmaceuticals Nig Ltd', true),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'MXC-PCM-500', 'Paracetamol 500mg Extra Relief (DEMO)', 'Over-the-Counter', 'Tablet', 'Packs (20s)', 750.00, 25, 'Fidson Healthcare Plc', true),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'MXC-ALM-480', 'Artemether/Lumefantrine (Coartem) 80/480mg (DEMO)', 'Antibiotics & Prescriptions', 'Tablet', 'Boxes (6 tablets)', 3800.00, 12, 'Novartis / Swipha Nigeria', true),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'MXC-VTC-1000', 'Vitamin C 1000mg + Zinc Effervescent (DEMO)', 'Health & Wellness', 'Effervescent Tablet', 'Tubes (20s)', 3200.00, 10, 'Bayer Healthcare Nigeria', true),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'MXC-OMP-020', 'Omeprazole 20mg Delayed-Release (DEMO)', 'Antibiotics & Prescriptions', 'Capsule', 'Bottles (30s)', 2500.00, 10, 'Chi Pharmaceuticals Ltd', true),
    ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'MXC-MVT-100', 'Multivitamin Syrup for Children 100ml (DEMO)', 'Health & Wellness', 'Syrup', 'Bottles (100ml)', 1750.00, 10, 'Dana Pharmaceuticals Ltd', true),
    ('99999999-9999-9999-9999-999999999999', 'MXC-ANT-500', 'Antiseptic Disinfectant Liquid 500ml (DEMO)', 'Personal Care', 'Liquid', 'Bottles (500ml)', 2100.00, 8, 'Reckitt Benckiser Nigeria', true)
ON CONFLICT (sku) DO NOTHING;

-- Demonstration Stock Batches (split between Main Store and POS Terminal)
INSERT INTO public.stock_batches (id, product_id, batch_number, expiry_date, purchase_cost, quantity_main_store, quantity_pos_terminal)
VALUES
    ('a1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'BT-AMX-2025A', '2027-08-15', 1200.00, 30, 12),
    ('b1111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'BT-PCM-2025B', '2028-02-10', 450.00, 80, 40),
    ('c1111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'BT-ALM-2025C', '2027-05-30', 2800.00, 4, 2),
    ('d1111111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'BT-VTC-2025D', '2027-11-20', 2200.00, 20, 14),
    ('e1111111-1111-1111-1111-111111111111', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'BT-OMP-2025E', '2027-04-18', 1600.00, 0, 0),
    ('f1111111-1111-1111-1111-111111111111', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'BT-MVT-2025F', '2027-02-01', 1100.00, 5, 3),
    ('91111111-1111-1111-1111-111111111111', '99999999-9999-9999-9999-999999999999', 'BT-ANT-2025G', '2029-01-01', 1400.00, 20, 8)
ON CONFLICT (product_id, batch_number) DO NOTHING;
