document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const propertyValueInput = document.getElementById("propertyValue");
  const monthlyRentInput = document.getElementById("monthlyRent");
  const annualExpensesInput = document.getElementById("annualExpenses");
  const vacancyRateInput = document.getElementById("vacancyRate");
  const managementFeeRateInput = document.getElementById("managementFeeRate");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(propertyValueInput);
  attachLiveFormatting(monthlyRentInput);
  attachLiveFormatting(annualExpensesInput);
  attachLiveFormatting(vacancyRateInput);
  attachLiveFormatting(managementFeeRateInput);

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

  function validatePercent(value, fieldLabel) {
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      setResultError("Enter a valid " + fieldLabel + " between 0 and 100.");
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
      const propertyValue = toNumber(propertyValueInput ? propertyValueInput.value : "");
      const monthlyRent = toNumber(monthlyRentInput ? monthlyRentInput.value : "");

      const annualExpensesRaw = toNumber(annualExpensesInput ? annualExpensesInput.value : "");
      const vacancyRateRaw = toNumber(vacancyRateInput ? vacancyRateInput.value : "");
      const managementFeeRateRaw = toNumber(managementFeeRateInput ? managementFeeRateInput.value : "");

      // Guard
      if (!propertyValueInput || !monthlyRentInput) return;

      // Required validation
      if (!validatePositive(propertyValue, "property value or purchase price")) return;
      if (!validatePositive(monthlyRent, "monthly rent")) return;

      // Optional inputs with sensible defaults
      const annualExpenses = Number.isFinite(annualExpensesRaw) && annualExpensesRaw >= 0 ? annualExpensesRaw : 0;
      const vacancyRate = Number.isFinite(vacancyRateRaw) ? vacancyRateRaw : 5;
      const managementFeeRate = Number.isFinite(managementFeeRateRaw) ? managementFeeRateRaw : 0;

      if (!validateNonNegative(annualExpenses, "annual operating expenses")) return;
      if (!validatePercent(vacancyRate, "vacancy allowance (%)")) return;
      if (!validatePercent(managementFeeRate, "management / letting fee (%)")) return;

      // Calculation logic
      const annualRent = monthlyRent * 12;
      const effectiveAnnualRent = annualRent * (1 - vacancyRate / 100);
      const managementFee = effectiveAnnualRent * (managementFeeRate / 100);
      const netOperatingIncome = effectiveAnnualRent - managementFee - annualExpenses;

      const grossYield = (annualRent / propertyValue) * 100;
      const netYield = (netOperatingIncome / propertyValue) * 100;

      const monthlyNet = netOperatingIncome / 12;

      // Result HTML
      const grossYieldText = Number.isFinite(grossYield) ? formatNumberTwoDecimals(grossYield) : "0.00";
      const netYieldText = Number.isFinite(netYield) ? formatNumberTwoDecimals(netYield) : "0.00";

      const annualRentText = formatNumberTwoDecimals(annualRent);
      const effectiveAnnualRentText = formatNumberTwoDecimals(effectiveAnnualRent);
      const managementFeeText = formatNumberTwoDecimals(managementFee);
      const annualExpensesText = formatNumberTwoDecimals(annualExpenses);
      const noiText = formatNumberTwoDecimals(netOperatingIncome);
      const monthlyNetText = formatNumberTwoDecimals(monthlyNet);

      const netNote =
        netOperatingIncome < 0
          ? `<p><strong>Note:</strong> Your estimated net operating income is negative. This usually means expenses, vacancy, or fees outweigh rent at the current assumptions.</p>`
          : "";

      const resultHtml = `
        <p><strong>Gross rental yield:</strong> ${grossYieldText}%</p>
        <p><strong>Net rental yield:</strong> ${netYieldText}%</p>
        <hr>
        <p><strong>Annual rent (gross):</strong> ${annualRentText}</p>
        <p><strong>Effective annual rent (after vacancy):</strong> ${effectiveAnnualRentText}</p>
        <p><strong>Management / letting fees:</strong> ${managementFeeText}</p>
        <p><strong>Annual operating expenses:</strong> ${annualExpensesText}</p>
        <p><strong>Net operating income (NOI):</strong> ${noiText}</p>
        <p><strong>Estimated monthly net (before mortgage and tax):</strong> ${monthlyNetText}</p>
        ${netNote}
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
      const message = "Rental Yield Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
