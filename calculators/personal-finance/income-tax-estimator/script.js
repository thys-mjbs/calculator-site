document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const grossIncomeInput = document.getElementById("grossIncome");
  const taxRateInput = document.getElementById("taxRate");
  const deductionsInput = document.getElementById("deductions");
  const creditsInput = document.getElementById("credits");
  const payPeriodsInput = document.getElementById("payPeriods");

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
  attachLiveFormatting(grossIncomeInput);
  attachLiveFormatting(taxRateInput);
  attachLiveFormatting(deductionsInput);
  attachLiveFormatting(creditsInput);
  attachLiveFormatting(payPeriodsInput);

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

  function validateRatePercent(value, fieldLabel) {
    if (!Number.isFinite(value) || value < 0 || value > 60) {
      setResultError("Enter a valid " + fieldLabel + " between 0 and 60.");
      return false;
    }
    return true;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      // Parse inputs using toNumber() (from /scripts/main.js)
      const grossIncome = toNumber(grossIncomeInput ? grossIncomeInput.value : "");
      const taxRatePct = toNumber(taxRateInput ? taxRateInput.value : "");
      const deductions = toNumber(deductionsInput ? deductionsInput.value : "");
      const credits = toNumber(creditsInput ? creditsInput.value : "");
      const payPeriodsRaw = payPeriodsInput ? payPeriodsInput.value : "";
      const payPeriods = payPeriodsRaw.trim() === "" ? 12 : toNumber(payPeriodsRaw);

      // Basic existence guard
      if (!grossIncomeInput || !taxRateInput || !deductionsInput || !creditsInput || !payPeriodsInput) return;

      // Validation
      if (!validatePositive(grossIncome, "gross annual income")) return;
      if (!validateRatePercent(taxRatePct, "estimated effective tax rate (%)")) return;
      if (!validateNonNegative(deductions, "annual deductions")) return;
      if (!validateNonNegative(credits, "annual tax credits")) return;
      if (!validatePositive(payPeriods, "pay periods per year")) return;

      // Calculation logic
      const taxableIncome = Math.max(0, grossIncome - deductions);
      const taxBeforeCredits = taxableIncome * (taxRatePct / 100);
      const taxAfterCredits = Math.max(0, taxBeforeCredits - credits);
      const netIncome = grossIncome - taxAfterCredits;

      const effectiveRateOnGross = (taxAfterCredits / grossIncome) * 100;

      const grossPerPeriod = grossIncome / payPeriods;
      const taxPerPeriod = taxAfterCredits / payPeriods;
      const netPerPeriod = netIncome / payPeriods;

      // Build output HTML
      const resultHtml = `
        <p><strong>Estimated annual tax:</strong> ${formatNumberTwoDecimals(taxAfterCredits)}</p>
        <p><strong>Estimated annual net income (take-home):</strong> ${formatNumberTwoDecimals(netIncome)}</p>
        <p><strong>Effective tax rate on gross:</strong> ${formatNumberTwoDecimals(effectiveRateOnGross)}%</p>
        <hr>
        <p><strong>Taxable income (after deductions):</strong> ${formatNumberTwoDecimals(taxableIncome)}</p>
        <p><strong>Tax before credits:</strong> ${formatNumberTwoDecimals(taxBeforeCredits)}</p>
        <p><strong>Credits applied:</strong> ${formatNumberTwoDecimals(Math.min(credits, taxBeforeCredits))}</p>
        <hr>
        <p><strong>Per pay period (based on ${formatNumberTwoDecimals(payPeriods)} periods/year):</strong></p>
        <p>Gross per period: ${formatNumberTwoDecimals(grossPerPeriod)}</p>
        <p>Tax per period: ${formatNumberTwoDecimals(taxPerPeriod)}</p>
        <p>Net per period: ${formatNumberTwoDecimals(netPerPeriod)}</p>
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
      const message = "Income Tax Estimator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
