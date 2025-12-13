document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const monthlyIncome = document.getElementById("monthlyIncome");
  const housing = document.getElementById("housing");
  const utilities = document.getElementById("utilities");
  const transport = document.getElementById("transport");
  const food = document.getElementById("food");
  const debtPayments = document.getElementById("debtPayments");
  const savingsInvesting = document.getElementById("savingsInvesting");
  const insurance = document.getElementById("insurance");
  const other = document.getElementById("other");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (Not used in this calculator)

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(monthlyIncome);
  attachLiveFormatting(housing);
  attachLiveFormatting(utilities);
  attachLiveFormatting(transport);
  attachLiveFormatting(food);
  attachLiveFormatting(debtPayments);
  attachLiveFormatting(savingsInvesting);
  attachLiveFormatting(insurance);
  attachLiveFormatting(other);

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

  function money(value) {
    return "R" + formatNumberTwoDecimals(value);
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const incomeVal = toNumber(monthlyIncome ? monthlyIncome.value : "");
      const housingVal = toNumber(housing ? housing.value : "");
      const utilitiesVal = toNumber(utilities ? utilities.value : "");
      const transportVal = toNumber(transport ? transport.value : "");
      const foodVal = toNumber(food ? food.value : "");
      const debtVal = toNumber(debtPayments ? debtPayments.value : "");
      const savingsVal = toNumber(savingsInvesting ? savingsInvesting.value : "");
      const insuranceVal = toNumber(insurance ? insurance.value : "");
      const otherVal = toNumber(other ? other.value : "");

      // Basic existence guard
      if (
        !monthlyIncome ||
        !housing ||
        !utilities ||
        !transport ||
        !food ||
        !debtPayments ||
        !savingsInvesting ||
        !insurance ||
        !other
      ) {
        return;
      }

      // Validation
      if (!validatePositive(incomeVal, "monthly take-home income")) return;
      if (!validateNonNegative(housingVal, "housing")) return;
      if (!validateNonNegative(utilitiesVal, "utilities")) return;
      if (!validateNonNegative(transportVal, "transport")) return;
      if (!validateNonNegative(foodVal, "food & groceries")) return;
      if (!validateNonNegative(debtVal, "debt repayments")) return;
      if (!validateNonNegative(savingsVal, "savings & investing")) return;
      if (!validateNonNegative(insuranceVal, "insurance")) return;
      if (!validateNonNegative(otherVal, "other")) return;

      // Calculation logic
      const totalAllocated =
        housingVal +
        utilitiesVal +
        transportVal +
        foodVal +
        debtVal +
        savingsVal +
        insuranceVal +
        otherVal;

      const remaining = incomeVal - totalAllocated;

      const absRemaining = Math.abs(remaining);
      const isZeroBased = absRemaining < 0.01;

      let statusLine = "";
      if (isZeroBased) {
        statusLine = "<p><strong>Status:</strong> You are at a zero-based budget (R0 remaining).</p>";
      } else if (remaining > 0) {
        statusLine =
          "<p><strong>Status:</strong> You have money left unassigned. Allocate it to savings, debt, or a buffer until you reach R0 remaining.</p>";
      } else {
        statusLine =
          "<p><strong>Status:</strong> You are over-allocated. Reduce one or more categories until you reach R0 remaining.</p>";
      }

      // Build output HTML
      const resultHtml = `
        <div class="result-grid">
          <div class="result-row">
            <span class="result-label">Monthly income</span>
            <span class="result-value">${money(incomeVal)}</span>
          </div>
          <div class="result-row">
            <span class="result-label">Total allocated</span>
            <span class="result-value">${money(totalAllocated)}</span>
          </div>
          <div class="result-row">
            <span class="result-label">Remaining</span>
            <span class="result-value">${money(remaining)}</span>
          </div>
        </div>
        ${statusLine}
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
      const message = "Zero-Based Budget Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
