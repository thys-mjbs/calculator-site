document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const grossMonthlyIncomeInput = document.getElementById("grossMonthlyIncome");
  const monthlyDebtPaymentsInput = document.getElementById("monthlyDebtPayments");
  const monthlyHousingPaymentInput = document.getElementById("monthlyHousingPayment");
  const monthlyHoaDuesInput = document.getElementById("monthlyHoaDues");
  const targetFrontEndInput = document.getElementById("targetFrontEnd");
  const targetBackEndInput = document.getElementById("targetBackEnd");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (not used for this calculator)

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
  attachLiveFormatting(grossMonthlyIncomeInput);
  attachLiveFormatting(monthlyDebtPaymentsInput);
  attachLiveFormatting(monthlyHousingPaymentInput);
  attachLiveFormatting(monthlyHoaDuesInput);
  attachLiveFormatting(targetFrontEndInput);
  attachLiveFormatting(targetBackEndInput);

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

  function clampPercent(value, fallback) {
    if (!Number.isFinite(value) || value <= 0) return fallback;
    if (value > 100) return 100;
    return value;
  }

  function pct(n) {
    return formatNumberTwoDecimals(n) + "%";
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const grossMonthlyIncome = toNumber(grossMonthlyIncomeInput ? grossMonthlyIncomeInput.value : "");
      const monthlyDebtPayments = toNumber(monthlyDebtPaymentsInput ? monthlyDebtPaymentsInput.value : "");
      const monthlyHousingPayment = toNumber(monthlyHousingPaymentInput ? monthlyHousingPaymentInput.value : "");
      const monthlyHoaDues = toNumber(monthlyHoaDuesInput ? monthlyHoaDuesInput.value : "");
      const targetFrontEndRaw = toNumber(targetFrontEndInput ? targetFrontEndInput.value : "");
      const targetBackEndRaw = toNumber(targetBackEndInput ? targetBackEndInput.value : "");

      // Basic existence guard
      if (!grossMonthlyIncomeInput || !monthlyDebtPaymentsInput) return;

      // Validation
      if (!validatePositive(grossMonthlyIncome, "gross monthly income")) return;
      if (!validateNonNegative(monthlyDebtPayments, "monthly debt payments")) return;
      if (!validateNonNegative(monthlyHousingPayment, "estimated monthly housing payment")) return;
      if (!validateNonNegative(monthlyHoaDues, "HOA or condo dues")) return;

      const targetFrontEnd = clampPercent(targetFrontEndRaw, 28);
      const targetBackEnd = clampPercent(targetBackEndRaw, 36);

      // Calculation logic
      const housingTotal = monthlyHousingPayment + monthlyHoaDues;
      const frontEndDti = housingTotal > 0 ? (housingTotal / grossMonthlyIncome) * 100 : 0;
      const backEndDti = ((housingTotal + monthlyDebtPayments) / grossMonthlyIncome) * 100;

      // Targets: maximum housing payment based on target DTIs
      const maxHousingByFrontEnd = (targetFrontEnd / 100) * grossMonthlyIncome;
      const maxHousingByBackEnd = (targetBackEnd / 100) * grossMonthlyIncome - monthlyDebtPayments;

      const maxHousingByBackEndClamped = Math.max(0, maxHousingByBackEnd);
      const recommendedMaxHousing = Math.min(maxHousingByFrontEnd, maxHousingByBackEndClamped);

      // Secondary insight: headroom or overage vs target back-end
      const targetBackEndAmount = (targetBackEnd / 100) * grossMonthlyIncome;
      const currentBackEndAmount = housingTotal + monthlyDebtPayments;
      const backEndHeadroom = targetBackEndAmount - currentBackEndAmount;

      let statusLine = "";
      if (backEndDti <= targetBackEnd && (housingTotal === 0 || frontEndDti <= targetFrontEnd)) {
        statusLine = "Your DTIs are within the targets you set.";
      } else {
        statusLine = "Your DTIs exceed at least one of the targets you set.";
      }

      const housingIncludedText = housingTotal > 0 ? "Yes" : "No (targets only)";

      const htmlRows = `
        <div class="result-grid">
          <div class="result-row">
            <span class="label">Front-end DTI (housing only)</span>
            <span class="value">${housingTotal > 0 ? pct(frontEndDti) : "Not provided"}</span>
          </div>

          <div class="result-row">
            <span class="label">Back-end DTI (housing + debts)</span>
            <span class="value">${pct(backEndDti)}</span>
          </div>

          <div class="result-row">
            <span class="label">Housing estimate included</span>
            <span class="value">${housingIncludedText}</span>
          </div>

          <div class="result-row">
            <span class="label">Target front-end DTI</span>
            <span class="value">${pct(targetFrontEnd)}</span>
          </div>

          <div class="result-row">
            <span class="label">Target back-end DTI</span>
            <span class="value">${pct(targetBackEnd)}</span>
          </div>

          <div class="result-row">
            <span class="label">Max housing payment by front-end target</span>
            <span class="value">${formatNumberTwoDecimals(maxHousingByFrontEnd)}</span>
          </div>

          <div class="result-row">
            <span class="label">Max housing payment by back-end target</span>
            <span class="value">${formatNumberTwoDecimals(maxHousingByBackEndClamped)}</span>
          </div>

          <div class="result-row">
            <span class="label">Recommended max housing payment</span>
            <span class="value">${formatNumberTwoDecimals(recommendedMaxHousing)}</span>
          </div>
        </div>
        <p class="result-note"><strong>${statusLine}</strong></p>
        <p class="small-muted">
          Back-end headroom vs target: ${formatNumberTwoDecimals(backEndHeadroom)} (positive means room left under your back-end target).
          Outputs are monthly amounts and percentages based on gross monthly income.
        </p>
      `;

      const resultHtml = htmlRows;
      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Debt-to-Income (DTI) for Home Buying - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
