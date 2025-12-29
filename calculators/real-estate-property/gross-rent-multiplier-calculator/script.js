document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const purchasePriceInput = document.getElementById("purchasePrice");
  const monthlyRentInput = document.getElementById("monthlyRent");
  const vacancyRateInput = document.getElementById("vacancyRate");
  const otherMonthlyIncomeInput = document.getElementById("otherMonthlyIncome");

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

  // Add every input that should live-format with commas
  attachLiveFormatting(purchasePriceInput);
  attachLiveFormatting(monthlyRentInput);
  attachLiveFormatting(otherMonthlyIncomeInput);

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

  // (not used)

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
      const purchasePrice = toNumber(purchasePriceInput ? purchasePriceInput.value : "");
      const monthlyRent = toNumber(monthlyRentInput ? monthlyRentInput.value : "");
      const vacancyRateRaw = toNumber(vacancyRateInput ? vacancyRateInput.value : "");
      const otherMonthlyIncome = toNumber(otherMonthlyIncomeInput ? otherMonthlyIncomeInput.value : "");

      // Basic existence guard
      if (!purchasePriceInput || !monthlyRentInput || !vacancyRateInput || !otherMonthlyIncomeInput) return;

      // Validation (required inputs)
      if (!validatePositive(purchasePrice, "property purchase price")) return;
      if (!validatePositive(monthlyRent, "expected monthly rent")) return;

      // Optional inputs with defaults
      let vacancyRate = Number.isFinite(vacancyRateRaw) ? vacancyRateRaw : 0;
      if (!Number.isFinite(vacancyRate)) vacancyRate = 0;

      if (!validateNonNegative(vacancyRate, "vacancy allowance")) return;
      if (vacancyRate > 50) {
        setResultError("Vacancy allowance looks unusually high. Enter a percentage between 0 and 50.");
        return;
      }

      const otherIncome = Number.isFinite(otherMonthlyIncome) ? otherMonthlyIncome : 0;
      if (!validateNonNegative(otherIncome, "other monthly income")) return;

      // Calculation logic
      const grossAnnualRent = monthlyRent * 12;
      const grossAnnualIncome = (monthlyRent + otherIncome) * 12;

      const grm = purchasePrice / grossAnnualRent;

      const vacancyFactor = 1 - (vacancyRate / 100);
      const effectiveGrossAnnualIncome = grossAnnualIncome * vacancyFactor;

      // Guard against zero effective income (only possible with extreme vacancy settings)
      if (!Number.isFinite(effectiveGrossAnnualIncome) || effectiveGrossAnnualIncome <= 0) {
        setResultError("Effective income must be greater than 0. Reduce vacancy allowance or increase income.");
        return;
      }

      const effectiveGrm = purchasePrice / effectiveGrossAnnualIncome;

      // Simple screening context (non-prescriptive)
      let contextLine = "Lower GRM generally means you are paying less for each unit of rent, but GRM ignores all expenses and financing.";
      if (grm < 8) contextLine = "This GRM is relatively low for many markets. Double-check rent realism and property risks, then validate expenses next.";
      if (grm >= 8 && grm <= 12) contextLine = "This GRM is in a common screening range. Use it to compare similar listings, then validate expenses and loan terms.";
      if (grm > 12) contextLine = "This GRM is relatively high for many markets. It may still be viable, but you usually need strong rent growth, low risk, or unique upside.";

      // Build output HTML
      const resultHtml = `
        <p><strong>Gross Rent Multiplier (GRM):</strong> ${formatNumberTwoDecimals(grm)}</p>
        <p><strong>Gross annual scheduled rent:</strong> ${formatNumberTwoDecimals(grossAnnualRent)}</p>
        <p><strong>Gross annual income (rent + other income):</strong> ${formatNumberTwoDecimals(grossAnnualIncome)}</p>
        <p><strong>Effective gross annual income (after vacancy):</strong> ${formatNumberTwoDecimals(effectiveGrossAnnualIncome)}</p>
        <p><strong>Effective GRM (vacancy-adjusted):</strong> ${formatNumberTwoDecimals(effectiveGrm)}</p>
        <p><strong>How to read this:</strong> ${contextLine}</p>
      `;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Gross Rent Multiplier Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
