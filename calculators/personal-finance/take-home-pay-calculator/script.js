document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const grossPayInput = document.getElementById("grossPay");
  const payFrequencySelect = document.getElementById("payFrequency");
  const taxRateInput = document.getElementById("taxRate");
  const retirementRateInput = document.getElementById("retirementRate");
  const otherDeductionsInput = document.getElementById("otherDeductions");

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
  attachLiveFormatting(grossPayInput);
  attachLiveFormatting(otherDeductionsInput);

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

  function validatePercent(value, fieldLabel, maxAllowed) {
    if (!Number.isFinite(value) || value < 0 || value > maxAllowed) {
      setResultError("Enter a valid " + fieldLabel + " between 0 and " + maxAllowed + ".");
      return false;
    }
    return true;
  }

  function getPeriodsPerYear(freq) {
    if (freq === "weekly") return 52;
    if (freq === "biweekly") return 26;
    if (freq === "monthly") return 12;
    return 1; // annual
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const grossPay = toNumber(grossPayInput ? grossPayInput.value : "");
      const taxRatePct = toNumber(taxRateInput ? taxRateInput.value : "");
      const retirementRatePct = toNumber(retirementRateInput ? retirementRateInput.value : "");
      const otherDeductions = toNumber(otherDeductionsInput ? otherDeductionsInput.value : "");

      // Basic existence guard
      if (!grossPayInput || !taxRateInput || !payFrequencySelect) return;

      // Validation
      if (!validatePositive(grossPay, "gross pay")) return;

      // Tax rate is required for a meaningful take-home estimate
      if (!Number.isFinite(taxRatePct)) {
        setResultError("Enter an estimated tax rate (for example, 20).");
        return;
      }
      if (!validatePercent(taxRatePct, "tax rate (%)", 60)) return;

      // Optional fields: blank should behave like 0
      const retirementPctSafe = Number.isFinite(retirementRatePct) ? retirementRatePct : 0;
      const otherDedSafe = Number.isFinite(otherDeductions) ? otherDeductions : 0;

      if (!validatePercent(retirementPctSafe, "retirement contribution (%)", 50)) return;
      if (!validateNonNegative(otherDedSafe, "other deductions")) return;

      const freq = payFrequencySelect ? payFrequencySelect.value : "monthly";
      const periodsPerYear = getPeriodsPerYear(freq);

      // Calculation logic (per period first)
      const retirementAmount = grossPay * (retirementPctSafe / 100);
      const taxablePay = Math.max(0, grossPay - retirementAmount);
      const taxAmount = taxablePay * (taxRatePct / 100);
      const netPay = grossPay - retirementAmount - taxAmount - otherDedSafe;

      if (!Number.isFinite(netPay)) {
        setResultError("Something went wrong with the calculation. Check your inputs and try again.");
        return;
      }

      // Annualize + derive common equivalents
      const annualGross = grossPay * periodsPerYear;
      const annualRetirement = retirementAmount * periodsPerYear;
      const annualTax = taxAmount * periodsPerYear;
      const annualOtherDed = otherDedSafe * periodsPerYear;
      const annualNet = netPay * periodsPerYear;

      const monthlyNet = annualNet / 12;
      const weeklyNet = annualNet / 52;

      const totalDeductions = retirementAmount + taxAmount + otherDedSafe;
      const netPct = grossPay > 0 ? (netPay / grossPay) * 100 : 0;
      const effectiveTaxPctOfGross = grossPay > 0 ? (taxAmount / grossPay) * 100 : 0;

      // Build output HTML
      const grossFmt = formatNumberTwoDecimals(grossPay);
      const retirementFmt = formatNumberTwoDecimals(retirementAmount);
      const taxFmt = formatNumberTwoDecimals(taxAmount);
      const otherFmt = formatNumberTwoDecimals(otherDedSafe);
      const netFmt = formatNumberTwoDecimals(netPay);

      const annualNetFmt = formatNumberTwoDecimals(annualNet);
      const monthlyNetFmt = formatNumberTwoDecimals(monthlyNet);
      const weeklyNetFmt = formatNumberTwoDecimals(weeklyNet);

      const deductionsFmt = formatNumberTwoDecimals(totalDeductions);
      const netPctFmt = formatNumberTwoDecimals(netPct);
      const effTaxFmt = formatNumberTwoDecimals(effectiveTaxPctOfGross);

      const freqLabel =
        freq === "weekly" ? "per week" :
        freq === "biweekly" ? "per 2 weeks" :
        freq === "monthly" ? "per month" :
        "per year";

      const resultHtml = `
        <p><strong>Estimated take-home pay (${freqLabel}):</strong> ${netFmt}</p>

        <p><strong>Quick equivalents:</strong><br>
          Annual: ${annualNetFmt}<br>
          Monthly: ${monthlyNetFmt}<br>
          Weekly: ${weeklyNetFmt}
        </p>

        <p><strong>Breakdown (${freqLabel}):</strong><br>
          Gross pay: ${grossFmt}<br>
          Retirement (pre-tax): ${retirementFmt}<br>
          Tax: ${taxFmt}<br>
          Other deductions: ${otherFmt}<br>
          Total deductions: ${deductionsFmt}
        </p>

        <p><strong>Useful checks:</strong><br>
          Net as % of gross: ${netPctFmt}%<br>
          Tax as % of gross: ${effTaxFmt}%
        </p>
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
      const message = "Take-Home Pay Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
