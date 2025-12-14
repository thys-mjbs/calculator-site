document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const arBalanceInput = document.getElementById("arBalance");
  const netCreditSalesInput = document.getElementById("netCreditSales");
  const daysInPeriodInput = document.getElementById("daysInPeriod");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (Not used for this calculator)

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Add every input that should live-format with commas
  attachLiveFormatting(arBalanceInput);
  attachLiveFormatting(netCreditSalesInput);
  attachLiveFormatting(daysInPeriodInput);

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
      // Parse inputs using toNumber() (from /scripts/main.js)
      const arBalance = toNumber(arBalanceInput ? arBalanceInput.value : "");
      const netCreditSales = toNumber(netCreditSalesInput ? netCreditSalesInput.value : "");
      const daysInPeriod = toNumber(daysInPeriodInput ? daysInPeriodInput.value : "");

      // Basic existence guard
      if (!arBalanceInput || !netCreditSalesInput || !daysInPeriodInput) return;

      // Validation
      if (!validateNonNegative(arBalance, "accounts receivable balance")) return;
      if (!validatePositive(netCreditSales, "net credit sales")) return;
      if (!validatePositive(daysInPeriod, "number of days in the period")) return;

      // Calculation logic
      const arDays = (arBalance / netCreditSales) * daysInPeriod;

      // Build output HTML
      const arBalanceFmt = formatNumberTwoDecimals(arBalance);
      const netCreditSalesFmt = formatNumberTwoDecimals(netCreditSales);
      const daysFmt = formatNumberTwoDecimals(daysInPeriod);
      const arDaysFmt = formatNumberTwoDecimals(arDays);

      let interpretation = "Lower AR days generally means you collect faster and convert sales into cash sooner.";
      if (arDays > daysInPeriod) {
        interpretation = "This result is higher than the period length, which often indicates inconsistent inputs or very slow collections relative to sales.";
      } else if (arDays > 60) {
        interpretation = "This is a relatively high AR days result. Check invoice timing, disputes, credit control, and concentrated overdue customers.";
      } else if (arDays >= 30) {
        interpretation = "This is a moderate AR days result. Compare it to your payment terms and track it over time for movement.";
      } else if (arDays > 0) {
        interpretation = "This is a relatively low AR days result. You are collecting quickly for the sales volume provided.";
      }

      const resultHtml = `
        <p><strong>Accounts receivable days (DSO):</strong> ${arDaysFmt} days</p>
        <p><strong>Inputs used:</strong></p>
        <ul>
          <li>Accounts receivable balance: ${arBalanceFmt}</li>
          <li>Net credit sales: ${netCreditSalesFmt}</li>
          <li>Days in period: ${daysFmt}</li>
        </ul>
        <p><strong>What it means:</strong> ${interpretation}</p>
      `;

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
      const message = "Accounts Receivable Days Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
