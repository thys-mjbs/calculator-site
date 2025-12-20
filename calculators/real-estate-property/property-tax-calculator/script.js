/* script.js */
document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const assessedValueInput = document.getElementById("assessedValue");
  const taxRatePercentInput = document.getElementById("taxRatePercent");
  const millRateInput = document.getElementById("millRate");
  const exemptionAmountInput = document.getElementById("exemptionAmount");
  const specialAssessmentsInput = document.getElementById("specialAssessments");
  const monthsOwnedInput = document.getElementById("monthsOwned");

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
  attachLiveFormatting(assessedValueInput);
  attachLiveFormatting(exemptionAmountInput);
  attachLiveFormatting(specialAssessmentsInput);

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

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const assessedValue = toNumber(assessedValueInput ? assessedValueInput.value : "");
      const taxRatePercent = toNumber(taxRatePercentInput ? taxRatePercentInput.value : "");
      const millRate = toNumber(millRateInput ? millRateInput.value : "");
      const exemptionAmount = toNumber(exemptionAmountInput ? exemptionAmountInput.value : "");
      const specialAssessments = toNumber(specialAssessmentsInput ? specialAssessmentsInput.value : "");
      const monthsOwnedRaw = toNumber(monthsOwnedInput ? monthsOwnedInput.value : "");

      // Basic existence guard
      if (
        !assessedValueInput ||
        !taxRatePercentInput ||
        !millRateInput ||
        !exemptionAmountInput ||
        !specialAssessmentsInput ||
        !monthsOwnedInput
      ) {
        return;
      }

      // Validation
      if (!validatePositive(assessedValue, "assessed property value")) return;

      const hasPercent = Number.isFinite(taxRatePercent) && taxRatePercent > 0;
      const hasMill = Number.isFinite(millRate) && millRate > 0;

      if (!hasPercent && !hasMill) {
        setResultError("Enter a valid property tax rate (%) or a valid mill rate (per $1,000).");
        return;
      }

      if (!validateNonNegative(exemptionAmount, "exemptions")) return;
      if (!validateNonNegative(specialAssessments, "annual special assessments")) return;

      let monthsOwned = 12;
      if (Number.isFinite(monthsOwnedRaw) && monthsOwnedRaw > 0) {
        monthsOwned = Math.round(monthsOwnedRaw);
      }
      if (monthsOwned < 1 || monthsOwned > 12) {
        setResultError("Enter months owned as a whole number from 1 to 12.");
        return;
      }

      if (exemptionAmount > assessedValue) {
        setResultError("Exemptions cannot exceed the assessed property value.");
        return;
      }

      // Determine effective rate
      // If both provided, percent wins.
      let effectiveRatePercent = hasPercent ? taxRatePercent : (millRate / 10);

      if (!Number.isFinite(effectiveRatePercent) || effectiveRatePercent <= 0) {
        setResultError("Enter a valid tax rate or mill rate greater than 0.");
        return;
      }

      // Calculation logic
      const taxableValue = Math.max(0, assessedValue - exemptionAmount);
      const baseAnnualTax = taxableValue * (effectiveRatePercent / 100);
      const annualTotal = baseAnnualTax + specialAssessments;

      const monthlyEstimate = annualTotal / 12;
      const proratedTotal = annualTotal * (monthsOwned / 12);
      const proratedMonthly = monthsOwned > 0 ? (proratedTotal / monthsOwned) : monthlyEstimate;

      // Build output HTML
      const assessedFmt = formatNumberTwoDecimals(assessedValue);
      const exemptionFmt = formatNumberTwoDecimals(exemptionAmount);
      const taxableFmt = formatNumberTwoDecimals(taxableValue);

      const baseAnnualFmt = formatNumberTwoDecimals(baseAnnualTax);
      const assessmentsFmt = formatNumberTwoDecimals(specialAssessments);
      const annualTotalFmt = formatNumberTwoDecimals(annualTotal);

      const monthlyFmt = formatNumberTwoDecimals(monthlyEstimate);
      const proratedTotalFmt = formatNumberTwoDecimals(proratedTotal);
      const proratedMonthlyFmt = formatNumberTwoDecimals(proratedMonthly);

      const rateDisplay = (Math.round(effectiveRatePercent * 1000) / 1000).toString() + "%";

      const resultHtml =
        `<p><strong>Estimated annual property tax:</strong> ${annualTotalFmt}</p>` +
        `<p><strong>Estimated monthly cost (annual average):</strong> ${monthlyFmt}</p>` +
        `<hr>` +
        `<p><strong>Taxable value:</strong> ${taxableFmt}</p>` +
        `<p><strong>Effective rate used:</strong> ${rateDisplay}</p>` +
        `<p><strong>Breakdown:</strong> Base tax ${baseAnnualFmt} + Assessments ${assessmentsFmt}</p>` +
        `<hr>` +
        `<p><strong>Prorated total for ${monthsOwned} month(s):</strong> ${proratedTotalFmt}</p>` +
        `<p><strong>Prorated monthly average during ownership:</strong> ${proratedMonthlyFmt}</p>` +
        `<p><em>Inputs:</em> Assessed ${assessedFmt}, Exemptions ${exemptionFmt}.</p>`;

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
      const message = "Property Tax Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
