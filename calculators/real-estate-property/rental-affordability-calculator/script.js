document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const monthlyIncomeInput = document.getElementById("monthlyIncome");
  const rentRatioInput = document.getElementById("rentRatio");
  const monthlyDebtsInput = document.getElementById("monthlyDebts");
  const monthlyEssentialsInput = document.getElementById("monthlyEssentials");
  const monthlyUtilitiesInput = document.getElementById("monthlyUtilities");
  const savingsBufferPercentInput = document.getElementById("savingsBufferPercent");

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
  attachLiveFormatting(monthlyIncomeInput);
  attachLiveFormatting(rentRatioInput);
  attachLiveFormatting(monthlyDebtsInput);
  attachLiveFormatting(monthlyEssentialsInput);
  attachLiveFormatting(monthlyUtilitiesInput);
  attachLiveFormatting(savingsBufferPercentInput);

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

  function validatePercentRange(value, fieldLabel, min, max) {
    if (!Number.isFinite(value) || value < min || value > max) {
      setResultError("Enter a valid " + fieldLabel + " between " + min + "% and " + max + "%.");
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
      const income = toNumber(monthlyIncomeInput ? monthlyIncomeInput.value : "");
      const rentRatioPctRaw = toNumber(rentRatioInput ? rentRatioInput.value : "");
      const debts = toNumber(monthlyDebtsInput ? monthlyDebtsInput.value : "");
      const essentials = toNumber(monthlyEssentialsInput ? monthlyEssentialsInput.value : "");
      const utilities = toNumber(monthlyUtilitiesInput ? monthlyUtilitiesInput.value : "");
      const bufferPctRaw = toNumber(savingsBufferPercentInput ? savingsBufferPercentInput.value : "");

      // Basic existence guard
      if (!monthlyIncomeInput || !rentRatioInput) return;

      // Defaults for optional fields
      const rentRatioPct = Number.isFinite(rentRatioPctRaw) && rentRatioPctRaw > 0 ? rentRatioPctRaw : 30;
      const safeDebts = Number.isFinite(debts) && debts >= 0 ? debts : 0;
      const safeEssentials = Number.isFinite(essentials) && essentials >= 0 ? essentials : 0;
      const safeUtilities = Number.isFinite(utilities) && utilities >= 0 ? utilities : 0;
      const bufferPct = Number.isFinite(bufferPctRaw) && bufferPctRaw >= 0 ? bufferPctRaw : 0;

      // Validation
      if (!validatePositive(income, "monthly income")) return;
      if (!validatePercentRange(rentRatioPct, "rent-to-income ratio", 5, 60)) return;
      if (!validateNonNegative(safeDebts, "monthly debt payments")) return;
      if (!validateNonNegative(safeEssentials, "other monthly essentials")) return;
      if (!validateNonNegative(safeUtilities, "estimated utilities")) return;
      if (!validatePercentRange(bufferPct, "savings buffer", 0, 50)) return;

      const bufferAmount = income * (bufferPct / 100);

      // Ratio-based cap (rent-only), with utilities treated as separate cost
      const ratioHousingBudget = income * (rentRatioPct / 100);
      const maxRentByRatio = Math.max(0, ratioHousingBudget - safeUtilities);

      // Cashflow-based cap (rent-only)
      const cashflowAvailableForRent = income - safeDebts - safeEssentials - safeUtilities - bufferAmount;
      const maxRentByCashflow = Math.max(0, cashflowAvailableForRent);

      // Recommended cap is the tighter constraint
      const recommendedMaxRent = Math.min(maxRentByRatio, maxRentByCashflow);

      // Secondary insights: guideline range (25% to 35%) and quick status text
      const lowPct = 25;
      const highPct = 35;
      const rangeLow = Math.max(0, income * (lowPct / 100) - safeUtilities);
      const rangeHigh = Math.max(0, income * (highPct / 100) - safeUtilities);

      let limitingFactor = "The rent-to-income guideline is the limiting constraint.";
      if (maxRentByCashflow < maxRentByRatio) limitingFactor = "Your monthly bills and buffer are the limiting constraint.";

      const remainingAfterRecommended = Math.max(
        0,
        income - safeDebts - safeEssentials - safeUtilities - bufferAmount - recommendedMaxRent
      );

      const ratioAtRecommended = income > 0 ? (recommendedMaxRent + safeUtilities) / income : 0;
      const ratioAtRecommendedPct = ratioAtRecommended * 100;

      // Result HTML
      const resultHtml = `
        <p><strong>Recommended maximum rent (per month):</strong> ${formatNumberTwoDecimals(recommendedMaxRent)}</p>
        <p><strong>Rent-to-income ratio used:</strong> ${formatNumberTwoDecimals(rentRatioPct)}%</p>
        <p><strong>Rent guideline range (25% to 35%):</strong> ${formatNumberTwoDecimals(rangeLow)} to ${formatNumberTwoDecimals(rangeHigh)}</p>
        <hr>
        <p><strong>Cap by ratio guideline (rent-only):</strong> ${formatNumberTwoDecimals(maxRentByRatio)}</p>
        <p><strong>Cap by cashflow (rent-only):</strong> ${formatNumberTwoDecimals(maxRentByCashflow)}</p>
        <p><strong>Utilities included:</strong> ${formatNumberTwoDecimals(safeUtilities)}</p>
        <p><strong>Savings buffer included:</strong> ${formatNumberTwoDecimals(bufferAmount)} (${formatNumberTwoDecimals(bufferPct)}%)</p>
        <hr>
        <p><strong>Remaining after recommended rent:</strong> ${formatNumberTwoDecimals(remainingAfterRecommended)}</p>
        <p><strong>Housing share at recommended (rent + utilities):</strong> ${formatNumberTwoDecimals(ratioAtRecommendedPct)}%</p>
        <p>${limitingFactor}</p>
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
      const message = "Rental Affordability Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
