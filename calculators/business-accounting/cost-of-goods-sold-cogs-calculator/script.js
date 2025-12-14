document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const beginningInventoryInput = document.getElementById("beginningInventory");
  const purchasesInput = document.getElementById("purchases");
  const freightInInput = document.getElementById("freightIn");
  const purchaseReturnsInput = document.getElementById("purchaseReturns");
  const purchaseDiscountsInput = document.getElementById("purchaseDiscounts");
  const endingInventoryInput = document.getElementById("endingInventory");
  const salesRevenueInput = document.getElementById("salesRevenue");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (not used)
  
  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(beginningInventoryInput);
  attachLiveFormatting(purchasesInput);
  attachLiveFormatting(freightInInput);
  attachLiveFormatting(purchaseReturnsInput);
  attachLiveFormatting(purchaseDiscountsInput);
  attachLiveFormatting(endingInventoryInput);
  attachLiveFormatting(salesRevenueInput);

  // ------------------------------------------------------------
  // 3) RESULT HELPERS (CONSISTENT)
  // ------------------------------------------------------------
  function setResultError(message) {
    if (!resultDiv) return;
    resultDiv.classList.remove("success");
    resultDiv.classList.add("error");
    resultDiv.textContent = message;
  }

  function setResultSuccess(html) {
    if (!resultDiv) return;
    resultDiv.classList.remove("error");
    resultDiv.classList.add("success");
    resultDiv.innerHTML = html;
  }

  function clearResult() {
    if (!resultDiv) return;
    resultDiv.classList.remove("error", "success");
    resultDiv.textContent = "";
  }

  // ------------------------------------------------------------
  // 4) OPTIONAL MODE HANDLING (ONLY IF USED)
  // ------------------------------------------------------------
  function showMode(mode) {
    clearResult();
  }

  // ------------------------------------------------------------
  // 5) VALIDATION HELPERS (OPTIONAL)
  // ------------------------------------------------------------
  function validatePositive(value, fieldLabel) {
    if (!Number.isFinite(value) || value <= 0) {
      setResultError("Enter a valid " + fieldLabel + " greater than 0.");
      return false;
    }
    return true;
  }

  function validateNonNegative(value, fieldLabel) {
    if (!Number.isFinite(value) || value < 0) {
      setResultError("Enter a valid " + fieldLabel + " (0 or higher).");
      return false;
    }
    return true;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // (no modes)
      
      // Parse inputs using toNumber() (from /scripts/main.js)
      const beginningInventory = toNumber(beginningInventoryInput ? beginningInventoryInput.value : "");
      const purchases = toNumber(purchasesInput ? purchasesInput.value : "");
      const freightIn = toNumber(freightInInput ? freightInInput.value : "");
      const purchaseReturns = toNumber(purchaseReturnsInput ? purchaseReturnsInput.value : "");
      const purchaseDiscounts = toNumber(purchaseDiscountsInput ? purchaseDiscountsInput.value : "");
      const endingInventory = toNumber(endingInventoryInput ? endingInventoryInput.value : "");
      const salesRevenue = toNumber(salesRevenueInput ? salesRevenueInput.value : "");

      // Basic existence guard (optional but recommended)
      if (
        !beginningInventoryInput ||
        !purchasesInput ||
        !freightInInput ||
        !purchaseReturnsInput ||
        !purchaseDiscountsInput ||
        !endingInventoryInput ||
        !salesRevenueInput
      ) {
        return;
      }

      // Validation
      if (!validateNonNegative(beginningInventory, "beginning inventory")) return;
      if (!validateNonNegative(purchases, "purchases")) return;
      if (!validateNonNegative(freightIn, "freight-in")) return;
      if (!validateNonNegative(purchaseReturns, "purchase returns/allowances")) return;
      if (!validateNonNegative(purchaseDiscounts, "purchase discounts")) return;
      if (!validateNonNegative(endingInventory, "ending inventory")) return;
      if (Number.isFinite(salesRevenue) && salesRevenue < 0) {
        setResultError("Enter a valid sales revenue (0 or higher).");
        return;
      }

      if (purchaseReturns > purchases) {
        setResultError("Purchase returns/allowances should not be greater than purchases.");
        return;
      }

      // Calculation logic
      const netPurchases = purchases + freightIn - purchaseReturns - purchaseDiscounts;
      if (netPurchases < 0) {
        setResultError("Your adjustments make net purchases negative. Check returns and discounts.");
        return;
      }

      const cogs = beginningInventory + netPurchases - endingInventory;
      if (!Number.isFinite(cogs)) {
        setResultError("Enter valid numbers for all fields.");
        return;
      }

      if (cogs < 0) {
        setResultError("Your inputs produce a negative COGS. Check ending inventory and purchase adjustments.");
        return;
      }

      // Build output HTML
      const cogsFormatted = formatNumberTwoDecimals(cogs);
      const netPurchasesFormatted = formatNumberTwoDecimals(netPurchases);

      let resultHtml = "";
      resultHtml += `<p><strong>Cost of Goods Sold (COGS):</strong> ${cogsFormatted}</p>`;
      resultHtml += `<p><strong>Net purchases used:</strong> ${netPurchasesFormatted}</p>`;

      const hasSales = Number.isFinite(salesRevenue) && salesRevenue > 0;
      if (hasSales) {
        const grossProfit = salesRevenue - cogs;
        const grossMargin = salesRevenue === 0 ? 0 : (grossProfit / salesRevenue) * 100;

        resultHtml += `<p><strong>Gross profit:</strong> ${formatNumberTwoDecimals(grossProfit)}</p>`;
        resultHtml += `<p><strong>Gross margin:</strong> ${formatNumberTwoDecimals(grossMargin)}%</p>`;
      } else if (Number.isFinite(salesRevenue) && salesRevenue === 0) {
        resultHtml += `<p><strong>Gross profit and gross margin:</strong> Sales revenue is 0, so these are not calculated.</p>`;
      } else {
        resultHtml += `<p><strong>Optional:</strong> Enter sales revenue to calculate gross profit and gross margin.</p>`;
      }

      // Output
      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Cost of Goods Sold (COGS) Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
