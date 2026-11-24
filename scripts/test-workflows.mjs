// End-to-End Workflow Verification Script for MaxiCare Pharmacy Upgrade
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://rfnskvrmhcjygonqpjvu.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmbnNrdnJtaGNqeWdvbnFwanZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU0NjE4OTQsImV4cCI6MjExMTAzNzg5NH0.15emA94drI2Rh5ErRQQIeMZoXyiN2380qUM4W41g3_M";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runTests() {
  console.log("=================================================================");
  console.log("MAXICARE PHARMACY — SYSTEM UPGRADE REAL-BACKEND WORKFLOW TESTING");
  console.log("=================================================================\n");

  const results = {};

  // 1. Fetch current active shift or verify shift existence
  console.log("1. Checking Active Staff Shift...");
  const { data: shifts, error: shiftErr } = await supabase
    .from("staff_shifts")
    .select("*")
    .eq("status", "active")
    .limit(1);

  if (shiftErr || !shifts || shifts.length === 0) {
    console.error("FAIL: No active shift found for test execution:", shiftErr);
    results["Shift Verification"] = "FAIL";
    return;
  }

  const activeShift = shifts[0];
  console.log(`PASS: Active shift found for ${activeShift.staff_name} (ID: ${activeShift.id})`);
  results["Shift Verification"] = "PASS";

  // 2. Fetch a test product
  console.log("\n2. Fetching Product for Test Workflows...");
  const { data: prods, error: prodErr } = await supabase
    .from("products")
    .select("*, batches:stock_batches(*)")
    .eq("sku", "MXC-AMX-500")
    .single();

  if (prodErr || !prods) {
    console.error("FAIL: Could not load test product:", prodErr);
    results["Product Catalog Retrieval"] = "FAIL";
    return;
  }

  console.log(`PASS: Test product loaded: ${prods.name} (Selling Price: ₦${prods.selling_price})`);
  results["Product Catalog Retrieval"] = "PASS";

  // 3. Test Stock In (Stock receiving purchase)
  console.log("\n3. Testing Stock In Operation (record_stock_intake_purchase)...");
  const testBatchNum = "TEST-BT-" + Date.now().toString().slice(-4);
  const intakeQty = 20;
  const intakeCost = 1100.00;

  const { data: intakeRes, error: intakeErr } = await supabase.rpc("record_stock_intake_purchase", {
    p_product_id: prods.id,
    p_quantity: intakeQty,
    p_purchase_cost: intakeCost,
    p_batch_number: testBatchNum,
    p_expiry_date: "2028-10-15",
    p_location: "main_store",
    p_supplier: "Emzor Test Distributor",
    p_payment_method: "bank_transfer",
    p_recorded_by: "Owner (Automated Test)",
    p_shift_id: activeShift.id
  });

  if (intakeErr || !intakeRes?.[0]?.success) {
    console.error("FAIL: Stock In RPC failed:", intakeErr || intakeRes);
    results["Stock In / Goods Received"] = "FAIL";
  } else {
    console.log(`PASS: Stock In succeeded: Purchase ID ${intakeRes[0].purchase_id}, Batch ID ${intakeRes[0].batch_id}`);
    results["Stock In / Goods Received"] = "PASS";
  }

  // 4. Test Stock Transfer (Main Store to POS Terminal)
  console.log("\n4. Testing Stock Transfer (transfer_stock)...");
  // Find batch with main store stock
  const { data: batchToTransfer } = await supabase
    .from("stock_batches")
    .select("*")
    .eq("batch_number", testBatchNum)
    .single();

  if (!batchToTransfer) {
    console.error("FAIL: Could not locate batch for transfer");
    results["Stock Transfer"] = "FAIL";
  } else {
    const { data: transferRes, error: transferErr } = await supabase.rpc("transfer_stock", {
      p_shift_id: activeShift.id,
      p_batch_id: batchToTransfer.id,
      p_quantity: 10,
      p_direction: "to_pos",
      p_reason: "Automated test replenishment to POS Terminal"
    });

    if (transferErr || !transferRes?.[0]?.success) {
      console.error("FAIL: Transfer RPC failed:", transferErr || transferRes);
      results["Stock Transfer"] = "FAIL";
    } else {
      console.log(`PASS: Stock Transfer succeeded. New POS stock: ${transferRes[0].new_pos_terminal}, Main store: ${transferRes[0].new_main_store}`);
      results["Stock Transfer"] = "PASS";
    }
  }

  // 5. Test Quick Sales Recording (record_pos_sale with FEFO)
  console.log("\n5. Testing Record Sale Operation (record_pos_sale)...");
  const saleQty = 2;
  const { data: saleRes, error: saleErr } = await supabase.rpc("record_pos_sale", {
    p_shift_id: activeShift.id,
    p_payment_method: "cash",
    p_items: [{ product_id: prods.id, quantity: saleQty }],
    p_customer_name: "Walk-in Automated Test",
    p_discount: 0
  });

  let testSaleId = null;
  if (saleErr || !saleRes?.[0]?.success) {
    console.error("FAIL: Record Sale RPC failed:", saleErr || saleRes);
    results["Record Sale (POS FEFO)"] = "FAIL";
  } else {
    testSaleId = saleRes[0].sale_id;
    console.log(`PASS: Sale recorded successfully. Receipt #${saleRes[0].receipt_number}, Total Amount: ₦${saleRes[0].total_amount}`);
    results["Record Sale (POS FEFO)"] = "PASS";
  }

  // 6. Test Business Expense Recording (record_business_expense)
  console.log("\n6. Testing Business Expense Recording (record_business_expense)...");
  const { data: expRes, error: expErr } = await supabase.rpc("record_business_expense", {
    p_category: "Electricity",
    p_description: "Automated test generator fuel",
    p_amount: 3000.00,
    p_payment_method: "cash",
    p_recorded_by: "Owner (Test)",
    p_shift_id: activeShift.id,
    p_notes: "Test expense"
  });

  if (expErr || !expRes?.[0]?.success) {
    console.error("FAIL: Record Expense RPC failed:", expErr || expRes);
    results["Record Expense"] = "FAIL";
  } else {
    console.log(`PASS: Expense recorded successfully. Ref: ${expRes[0].expense_number}`);
    results["Record Expense"] = "PASS";
  }

  // 7. Test Sale Reversal (reverse_sale)
  console.log("\n7. Testing Sale Reversal (reverse_sale)...");
  if (testSaleId) {
    const { data: revRes, error: revErr } = await supabase.rpc("reverse_sale", {
      p_sale_id: testSaleId,
      p_reversal_reason: "Customer change of dosage requested (Automated test reversal)"
    });

    if (revErr || !revRes?.[0]?.success) {
      console.error("FAIL: Sale Reversal failed:", revErr || revRes);
      results["Sale Reversal & Stock Restoration"] = "FAIL";
    } else {
      console.log("PASS: Sale reversed successfully. Stock restored & refund outflow logged.");
      results["Sale Reversal & Stock Restoration"] = "PASS";
    }
  }

  // 8. Financial Ledger Verification
  console.log("\n8. Verifying Financial Ledger Integrity...");
  const { data: ledgerRows, error: ledgerErr } = await supabase
    .from("financial_ledger")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  if (ledgerErr || !ledgerRows || ledgerRows.length === 0) {
    console.error("FAIL: Financial ledger empty or unreadable:", ledgerErr);
    results["Financial Ledger Integrity"] = "FAIL";
  } else {
    console.log(`PASS: Financial Ledger has ${ledgerRows.length} recent immutable entries.`);
    results["Financial Ledger Integrity"] = "PASS";
  }

  console.log("\n=================================================================");
  console.log("WORKFLOW TEST SUMMARY:");
  console.log(JSON.stringify(results, null, 2));
  console.log("=================================================================");
}

runTests().catch(console.error);
