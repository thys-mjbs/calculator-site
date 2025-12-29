document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const monthlyRentInput = document.getElementById("monthlyRent");
  const otherMonthlyIncomeInput = document.getElementById("otherMonthlyIncome");
  const vacancyRateInput = document.getElementById("vacancyRate");

  const propertyTaxAnnualInput = document.getElementById("propertyTaxAnnual");
  const insuranceAnnualInput = document.getElementById("insuranceAnnual");
  const hoaMonthlyInput = document.getElementById("hoaMonthly");
  const utilitiesMonthlyInput = document.getElementById("utilitiesMonthly");
  const otherExpensesMonthlyInput = document.getElementById("otherExpensesMonthly");

  const maintenancePercentInput = document.getElementById("maintenancePercent");
  const managementPercentInput = document.getElementById("managementPercent");
  const mortgagePaymentMonthlyInput = document.getElementById("mortgagePaymentMonthly");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(monthlyRentInput);
  attachLiveFormatting(otherMonthlyIncomeInput);
  attachLiveFormatting(vacancyRateInput);
  attachLiveFormatting(propertyTaxAnnualInput);
  attachLiveFormatting(insuranceAnnualInput);
  attachLiveFormatting(hoaMonthlyInput);
  attachLiveFormatting(utilitiesMonthlyInput);
  attachLiveFormatting(otherExpensesMonthlyInput);
  attachLiveFormatting(maintenancePercentInput);
  attachLiveFormatting(managementPercentInput);
  attachLiveFormatting(mortgagePaymentMonthlyInput);

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

  function validatePercentRange(value, fieldLabel, min, max) {
    if (!Number.isFinite(value) || value < min || value > max) {
      setResultError("Enter a valid " + fieldLabel + " between " + min + " and " + max + ".");
      return false;
    }
    return true;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse required basics
      const monthlyRent = toNumber(monthlyRentInput ? monthlyRentInput.value : "");
      const otherMonthlyIncome = toNumber(otherMonthlyIncomeInput ? otherMonthlyIncomeInput.value : "");
      const vacancyRateRaw = toNumber(vacancyRateInput ? vacancyRateInput.value : "");

      // Parse optional expenses (defaults to 0 if blank)
      const propertyTaxAnnual = toNumber(propertyTaxAnnualInput ? propertyTaxAnnualInput.value : "");
      const insuranceAnnual = toNumber(insuranceAnnualInput ? insuranceAnnualInput.value : "");
      const hoaMonthly = toNumber(hoaMonthlyInput ? hoaMonthlyInput.value : "");
      const utilitiesMonthly = toNumber(utilitiesMonthlyInput ? utilitiesMonthlyInput.value : "");
      const otherExpensesMonthly = toNumber(otherExpensesMonthlyInput ? otherExpensesMonthlyInput.value : "");

      const maintenancePercentRaw = toNumber(maintenancePercentInput ? maintenancePercentInput.value : "");
      const managementPercentRaw = toNumber(managementPercentInput ? managementPercentInput.value : "");
      const mortgagePaymentMonthly = toNumber(mortgagePaymentMonthlyInput ? mortgagePaymentMonthlyInput.value : "");

      // Basic existence guard
      if (!monthlyRentInput || !resultDiv) return;

      // Validation: required
      if (!validatePositive(monthlyRent, "monthly rent")) return;

      // Validation: optional but must be sensible when provided
      if (!validateNonNegative(otherMonthlyIncome, "other monthly income")) return;
      if (!validateNonNegative(propertyTaxAnnual, "annual property tax")) return;
      if (!validateNonNegative(insuranceAnnual, "annual insurance")) return;
      if (!validateNonNegative(hoaMonthly, "monthly HOA / levy")) return;
      if (!validateNonNegative(utilitiesMonthly, "monthly utilities")) return;
      if (!validateNonNegative(otherExpensesMonthly, "other monthly operating expenses")) return;
      if (!validateNonNegative(mortgagePaymentMonthly, "monthly mortgage payment")) return;

      // Vacancy default handling
      let vacancyRate = vacancyRateRaw;
      if (!Number.isFinite(vacancyRate) || vacancyRate === 0) {
        // Allow explicit zero, but treat blank as default.
        // If input is blank, toNumber("") returns 0. We detect blank by raw string.
        const rawStr = vacancyRateInput ? vacancyRateInput.value.trim() : "";
        vacancyRate = rawStr === "" ? 5 : 0;
      }
      if (!validatePercentRange(vacancyRate, "vacancy rate %", 0, 50)) return;

      // Maintenance and management defaults handling
      let maintenancePercent = maintenancePercentRaw;
      if (!Number.isFinite(maintenancePercent) || maintenancePercent === 0) {
        const rawStr = maintenancePercentInput ? maintenancePercentInput.value.trim() : "";
        maintenancePercent = rawStr === "" ? 8 : 0;
      }
      if (!validatePercentRange(maintenancePercent, "maintenance reserve %", 0, 30)) return;

      let managementPercent = managementPercentRaw;
      if (!Number.isFinite(managementPercent) || managementPercent === 0) {
        const rawStr = managementPercentInput ? managementPercentInput.value.trim() : "";
        managementPercent = rawStr === "" ? 0 : 0;
      }
      if (!validatePercentRange(managementPercent, "management fee %", 0, 20)) return;

      // Calculation
      const grossScheduledMonthly = monthlyRent + otherMonthlyIncome;
      const grossScheduledAnnual = grossScheduledMonthly * 12;

      const collectedAnnual = grossScheduledAnnual * (1 - vacancyRate / 100);

      const fixedAnnualExpenses =
        (Number.isFinite(propertyTaxAnnual) ? propertyTaxAnnual : 0) +
        (Number.isFinite(insuranceAnnual) ? insuranceAnnual : 0) +
        (Number.isFinite(hoaMonthly) ? hoaMonthly : 0) * 12 +
        (Number.isFinite(utilitiesMonthly) ? utilitiesMonthly : 0) * 12 +
        (Number.isFinite(otherExpensesMonthly) ? otherExpensesMonthly : 0) * 12;

      const maintenanceReserveAnnual = collectedAnnual * (maintenancePercent / 100);
      const managementFeeAnnual = collectedAnnual * (managementPercent / 100);

      const operatingExpensesAnnual = fixedAnnualExpenses + maintenanceReserveAnnual + managementFeeAnnual;

      const noiAnnual = collectedAnnual - operatingExpensesAnnual;

      const debtServiceAnnual = (Number.isFinite(mortgagePaymentMonthly) ? mortgagePaymentMonthly : 0) * 12;

      const cashFlowAnnual = noiAnnual - debtServiceAnnual;
      const cashFlowMonthly = cashFlowAnnual / 12;

      const profitMargin = collectedAnnual > 0 ? (cashFlowAnnual / collectedAnnual) * 100 : 0;

      // Break-even occupancy (needed to cover operating + debt)
      const requiredAnnualToBreakEven = operatingExpensesAnnual + debtServiceAnnual;
      const breakEvenOccupancy =
        grossScheduledAnnual > 0 ? (requiredAnnualToBreakEven / grossScheduledAnnual) * 100 : 0;

      // Clamp to a readable range (still show >100% when impossible)
      const breakEvenOccupancyDisplay =
        breakEvenOccupancy < 0 ? 0 : breakEvenOccupancy;

      // Outputs
      const vacancyAssumptionNote =
        (vacancyRateInput && vacancyRateInput.value.trim() === "")
          ? "Vacancy assumed at 5% because you left it blank."
          : "Vacancy applied at " + vacancyRate + "%.";

      const maintenanceAssumptionNote =
        (maintenancePercentInput && maintenancePercentInput.value.trim() === "")
          ? "Maintenance reserve assumed at 8% of collected rent because you left it blank."
          : "Maintenance reserve applied at " + maintenancePercent + "% of collected rent.";

      const managementAssumptionNote =
        (managementPercentInput && managementPercentInput.value.trim() === "")
          ? "Management fee assumed at 0% because you left it blank."
          : "Management fee applied at " + managementPercent + "% of collected rent.";

      const resultHtml = `
        <p><strong>Estimated annual profit (cash flow):</strong> ${formatNumberTwoDecimals(cashFlowAnnual)}</p>
        <p><strong>Estimated monthly cash flow:</strong> ${formatNumberTwoDecimals(cashFlowMonthly)}</p>
        <p><strong>Net Operating Income (NOI, annual):</strong> ${formatNumberTwoDecimals(noiAnnual)}</p>
        <hr>
        <p><strong>Collected income (annual, after vacancy):</strong> ${formatNumberTwoDecimals(collectedAnnual)}</p>
        <p><strong>Operating expenses (annual):</strong> ${formatNumberTwoDecimals(operatingExpensesAnnual)}</p>
        <p><strong>Mortgage payments (annual):</strong> ${formatNumberTwoDecimals(debtServiceAnnual)}</p>
        <hr>
        <p><strong>Profit margin (cash flow ÷ collected income):</strong> ${formatNumberTwoDecimals(profitMargin)}%</p>
        <p><strong>Break-even occupancy needed:</strong> ${formatNumberTwoDecimals(breakEvenOccupancyDisplay)}%</p>
        <p style="margin-top:10px;"><strong>Assumptions used:</strong><br>
          ${vacancyAssumptionNote}<br>
          ${maintenanceAssumptionNote}<br>
          ${managementAssumptionNote}
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
      const message = "Landlord Profitability Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
