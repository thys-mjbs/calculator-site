document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const monthlyPriceInput = document.getElementById("monthlyPrice");
  const annualPriceInput = document.getElementById("annualPrice");
  const monthsPlannedInput = document.getElementById("monthsPlanned");
  const taxPercentInput = document.getElementById("taxPercent");

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
  attachLiveFormatting(monthlyPriceInput);
  attachLiveFormatting(annualPriceInput);
  attachLiveFormatting(monthsPlannedInput);
  attachLiveFormatting(taxPercentInput);

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

  function toWholeMonths(value) {
    if (!Number.isFinite(value)) return NaN;
    return Math.floor(value);
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      // Parse inputs using toNumber() (from /scripts/main.js)
      const monthlyPrice = toNumber(monthlyPriceInput ? monthlyPriceInput.value : "");
      const annualPriceRaw = toNumber(annualPriceInput ? annualPriceInput.value : "");
      const monthsPlannedRaw = toNumber(monthsPlannedInput ? monthsPlannedInput.value : "");
      const taxPercentRaw = toNumber(taxPercentInput ? taxPercentInput.value : "");

      // Basic existence guard
      if (!monthlyPriceInput) return;

      // Validation
      if (!validatePositive(monthlyPrice, "monthly price")) return;

      const hasAnnual = Number.isFinite(annualPriceRaw) && annualPriceRaw > 0;
      if (annualPriceInput && annualPriceInput.value.trim() !== "" && !hasAnnual) {
        setResultError("If you enter an annual price, it must be greater than 0.");
        return;
      }

      let monthsPlanned = 12;
      if (monthsPlannedInput && monthsPlannedInput.value.trim() !== "") {
        monthsPlanned = toWholeMonths(monthsPlannedRaw);
        if (!Number.isFinite(monthsPlanned) || monthsPlanned <= 0) {
          setResultError("Enter a valid number of months greater than 0.");
          return;
        }
        if (monthsPlanned > 240) {
          setResultError("Enter a realistic number of months (240 or less).");
          return;
        }
      }

      let taxPercent = 0;
      if (taxPercentInput && taxPercentInput.value.trim() !== "") {
        taxPercent = taxPercentRaw;
        if (!validateNonNegative(taxPercent, "tax/VAT percent")) return;
        if (taxPercent > 100) {
          setResultError("Enter a tax/VAT percent between 0 and 100.");
          return;
        }
      }

      // Calculation logic
      const taxMultiplier = 1 + taxPercent / 100;

      const monthlyChargeWithTax = monthlyPrice * taxMultiplier;
      const monthlyTotal = monthlyChargeWithTax * monthsPlanned;

      let annualTotal = null;
      let annualChargeWithTax = null;
      let annualRenewals = null;

      if (hasAnnual) {
        annualChargeWithTax = annualPriceRaw * taxMultiplier;
        annualRenewals = Math.ceil(monthsPlanned / 12);
        annualTotal = annualChargeWithTax * annualRenewals;
      }

      // Supporting figures
      const monthlyPerDay = monthlyChargeWithTax / (365 / 12);

      let effectiveMonthlyAnnual = null;
      if (hasAnnual) effectiveMonthlyAnnual = (annualChargeWithTax / 12);

      let breakEvenMonths = null;
      if (hasAnnual) breakEvenMonths = annualPriceRaw / monthlyPrice;

      let savings = null;
      if (hasAnnual) savings = monthlyTotal - annualTotal;

      // Build output HTML
      let resultHtml = "";

      resultHtml += `<p><strong>Monthly plan (total for ${monthsPlanned} month${monthsPlanned === 1 ? "" : "s"}):</strong> ${formatNumberTwoDecimals(monthlyTotal)}</p>`;
      resultHtml += `<p><strong>Monthly plan per month (with tax):</strong> ${formatNumberTwoDecimals(monthlyChargeWithTax)} <span style="color:#555">(about ${formatNumberTwoDecimals(monthlyPerDay)} per day)</span></p>`;

      if (!hasAnnual) {
        const yearlyFromMonthly = monthlyChargeWithTax * 12;
        resultHtml += `<p><strong>Estimated 12-month cost on monthly billing:</strong> ${formatNumberTwoDecimals(yearlyFromMonthly)}</p>`;
        resultHtml += `<p style="color:#555">Add an annual price to compare savings, effective monthly price, and break-even months.</p>`;
        setResultSuccess(resultHtml);
        return;
      }

      resultHtml += `<hr>`;
      resultHtml += `<p><strong>Annual plan (total for ${monthsPlanned} month${monthsPlanned === 1 ? "" : "s"}):</strong> ${formatNumberTwoDecimals(annualTotal)}</p>`;
      resultHtml += `<p><strong>Annual renewals counted:</strong> ${annualRenewals} payment${annualRenewals === 1 ? "" : "s"} (each covers 12 months)</p>`;
      resultHtml += `<p><strong>Annual plan effective monthly (with tax):</strong> ${formatNumberTwoDecimals(effectiveMonthlyAnnual)}</p>`;

      const savingsLabel = savings >= 0 ? "You save with annual billing" : "Annual billing costs more";
      resultHtml += `<p><strong>${savingsLabel}:</strong> ${formatNumberTwoDecimals(Math.abs(savings))}</p>`;

      resultHtml += `<p><strong>Break-even point:</strong> ${formatNumberTwoDecimals(breakEvenMonths)} months</p>`;

      if (monthsPlanned < 12) {
        resultHtml += `<p style="color:#555"><strong>Note:</strong> You set fewer than 12 months. Annual billing is still treated as an upfront 12-month payment, which is why it can look worse for short usage periods.</p>`;
      }

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Subscription Cost Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
