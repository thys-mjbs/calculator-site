// script.js
document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const grossRentMonthlyInput = document.getElementById("grossRentMonthly");
  const otherIncomeMonthlyInput = document.getElementById("otherIncomeMonthly");
  const vacancyRateInput = document.getElementById("vacancyRate");
  const totalOpExMonthlyInput = document.getElementById("totalOpExMonthly");

  // Advanced expense inputs (optional)
  const propertyTaxesAnnualInput = document.getElementById("propertyTaxesAnnual");
  const insuranceAnnualInput = document.getElementById("insuranceAnnual");
  const hoaMonthlyInput = document.getElementById("hoaMonthly");
  const utilitiesMonthlyInput = document.getElementById("utilitiesMonthly");
  const otherOpExMonthlyInput = document.getElementById("otherOpExMonthly");
  const managementPctInput = document.getElementById("managementPct");
  const repairsReservePctInput = document.getElementById("repairsReservePct");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Currency / amount fields: format with commas
  attachLiveFormatting(grossRentMonthlyInput);
  attachLiveFormatting(otherIncomeMonthlyInput);
  attachLiveFormatting(totalOpExMonthlyInput);

  attachLiveFormatting(propertyTaxesAnnualInput);
  attachLiveFormatting(insuranceAnnualInput);
  attachLiveFormatting(hoaMonthlyInput);
  attachLiveFormatting(utilitiesMonthlyInput);
  attachLiveFormatting(otherOpExMonthlyInput);

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
      const grossRentMonthly = toNumber(grossRentMonthlyInput ? grossRentMonthlyInput.value : "");
      const otherIncomeMonthly = toNumber(otherIncomeMonthlyInput ? otherIncomeMonthlyInput.value : "");
      const vacancyRate = toNumber(vacancyRateInput ? vacancyRateInput.value : "");
      const totalOpExMonthly = toNumber(totalOpExMonthlyInput ? totalOpExMonthlyInput.value : "");

      const propertyTaxesAnnual = toNumber(propertyTaxesAnnualInput ? propertyTaxesAnnualInput.value : "");
      const insuranceAnnual = toNumber(insuranceAnnualInput ? insuranceAnnualInput.value : "");
      const hoaMonthly = toNumber(hoaMonthlyInput ? hoaMonthlyInput.value : "");
      const utilitiesMonthly = toNumber(utilitiesMonthlyInput ? utilitiesMonthlyInput.value : "");
      const otherOpExMonthly = toNumber(otherOpExMonthlyInput ? otherOpExMonthlyInput.value : "");
      const managementPct = toNumber(managementPctInput ? managementPctInput.value : "");
      const repairsReservePct = toNumber(repairsReservePctInput ? repairsReservePctInput.value : "");

      // Existence guard
      if (!grossRentMonthlyInput || !vacancyRateInput) return;

      // Validation (required)
      if (!validatePositive(grossRentMonthly, "gross rent (monthly)")) return;
      if (!validateNonNegative(otherIncomeMonthly, "other income (monthly)")) return;

      const vacancyPct = Number.isFinite(vacancyRate) ? vacancyRate : 5;
      if (!validatePercent(vacancyPct, "vacancy allowance (%)")) return;

      // Determine if user is using Advanced expense items (any entry triggers override)
      const hasAdvanced =
        (Number.isFinite(propertyTaxesAnnual) && propertyTaxesAnnual > 0) ||
        (Number.isFinite(insuranceAnnual) && insuranceAnnual > 0) ||
        (Number.isFinite(hoaMonthly) && hoaMonthly > 0) ||
        (Number.isFinite(utilitiesMonthly) && utilitiesMonthly > 0) ||
        (Number.isFinite(otherOpExMonthly) && otherOpExMonthly > 0) ||
        (Number.isFinite(managementPct) && managementPct > 0) ||
        (Number.isFinite(repairsReservePct) && repairsReservePct > 0);

      // If not using advanced items, total operating expenses monthly is required
      if (!hasAdvanced) {
        if (!Number.isFinite(totalOpExMonthly) || totalOpExMonthly < 0) {
          setResultError("Enter your total operating expenses (monthly), or use the Advanced section to build expenses from items.");
          return;
        }
      } else {
        // Validate advanced inputs (non-negative)
        if (!validateNonNegative(propertyTaxesAnnual, "property taxes / rates (annual)")) return;
        if (!validateNonNegative(insuranceAnnual, "insurance (annual)")) return;
        if (!validateNonNegative(hoaMonthly, "HOA / body corporate (monthly)")) return;
        if (!validateNonNegative(utilitiesMonthly, "utilities (monthly)")) return;
        if (!validateNonNegative(otherOpExMonthly, "other operating expenses (monthly)")) return;

        if (!validatePercent(managementPct, "management fee (%)")) return;
        if (!validatePercent(repairsReservePct, "repairs reserve (%)")) return;
      }

      // Core calculations
      const grossMonthlyIncome = grossRentMonthly + otherIncomeMonthly;
      const grossAnnualIncome = grossMonthlyIncome * 12;

      const vacancyLossAnnual = grossAnnualIncome * (vacancyPct / 100);
      const effectiveGrossIncomeAnnual = grossAnnualIncome - vacancyLossAnnual;

      // Operating expenses
      let operatingExpensesAnnual = 0;
      let managementAnnual = 0;
      let repairsReserveAnnual = 0;
      let fixedAnnual = 0;

      if (!hasAdvanced) {
        operatingExpensesAnnual = totalOpExMonthly * 12;
        fixedAnnual = operatingExpensesAnnual;
      } else {
        fixedAnnual =
          (propertyTaxesAnnual || 0) +
          (insuranceAnnual || 0) +
          ((hoaMonthly || 0) + (utilitiesMonthly || 0) + (otherOpExMonthly || 0)) * 12;

        managementAnnual = effectiveGrossIncomeAnnual * ((managementPct || 0) / 100);
        repairsReserveAnnual = effectiveGrossIncomeAnnual * ((repairsReservePct || 0) / 100);

        operatingExpensesAnnual = fixedAnnual + managementAnnual + repairsReserveAnnual;
      }

      const noiAnnual = effectiveGrossIncomeAnnual - operatingExpensesAnnual;
      const noiMonthly = noiAnnual / 12;

      const noiMarginPct = effectiveGrossIncomeAnnual > 0
        ? (noiAnnual / effectiveGrossIncomeAnnual) * 100
        : 0;

      const resultHtml = `
        <p><strong>NOI (annual):</strong> ${formatNumberTwoDecimals(noiAnnual)}</p>
        <p><strong>NOI (monthly):</strong> ${formatNumberTwoDecimals(noiMonthly)}</p>
        <hr>
        <p><strong>Gross scheduled income (annual):</strong> ${formatNumberTwoDecimals(grossAnnualIncome)}</p>
        <p><strong>Vacancy loss (annual):</strong> ${formatNumberTwoDecimals(vacancyLossAnnual)} (${formatNumberTwoDecimals(vacancyPct)}%)</p>
        <p><strong>Effective gross income (annual):</strong> ${formatNumberTwoDecimals(effectiveGrossIncomeAnnual)}</p>
        <p><strong>Operating expenses (annual):</strong> ${formatNumberTwoDecimals(operatingExpensesAnnual)}</p>
        ${hasAdvanced ? `
          <p class="result-sub"><strong>Expense build (advanced):</strong></p>
          <ul>
            <li>Fixed expenses (annual): ${formatNumberTwoDecimals(fixedAnnual)}</li>
            <li>Management (annual): ${formatNumberTwoDecimals(managementAnnual)}</li>
            <li>Repairs reserve (annual): ${formatNumberTwoDecimals(repairsReserveAnnual)}</li>
          </ul>
        ` : ""}
        <p><strong>NOI margin:</strong> ${formatNumberTwoDecimals(noiMarginPct)}%</p>
        <p class="result-note">NOI excludes mortgage payments and income taxes.</p>
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
      const message = "Net Operating Income (NOI) Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
