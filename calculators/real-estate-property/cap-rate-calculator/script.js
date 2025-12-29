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
  const baseMonthlyExpensesInput = document.getElementById("baseMonthlyExpenses");
  const vacancyRateInput = document.getElementById("vacancyRate");

  const otherMonthlyIncomeInput = document.getElementById("otherMonthlyIncome");
  const propertyTaxesAnnualInput = document.getElementById("propertyTaxesAnnual");
  const insuranceAnnualInput = document.getElementById("insuranceAnnual");
  const hoaMonthlyInput = document.getElementById("hoaMonthly");
  const utilitiesMonthlyInput = document.getElementById("utilitiesMonthly");
  const managementRateInput = document.getElementById("managementRate");
  const maintenanceReserveRateInput = document.getElementById("maintenanceReserveRate");
  const targetCapRateInput = document.getElementById("targetCapRate");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(purchasePriceInput);
  attachLiveFormatting(monthlyRentInput);
  attachLiveFormatting(baseMonthlyExpensesInput);
  attachLiveFormatting(vacancyRateInput);

  attachLiveFormatting(otherMonthlyIncomeInput);
  attachLiveFormatting(propertyTaxesAnnualInput);
  attachLiveFormatting(insuranceAnnualInput);
  attachLiveFormatting(hoaMonthlyInput);
  attachLiveFormatting(utilitiesMonthlyInput);
  attachLiveFormatting(managementRateInput);
  attachLiveFormatting(maintenanceReserveRateInput);
  attachLiveFormatting(targetCapRateInput);

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
  // 4) OPTIONAL MODE HANDLING (NOT USED)
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
      clearResult();

      // Input existence guard
      if (!purchasePriceInput || !monthlyRentInput || !baseMonthlyExpensesInput || !vacancyRateInput) {
        return;
      }

      // Parse required inputs
      const purchasePrice = toNumber(purchasePriceInput.value);
      const monthlyRent = toNumber(monthlyRentInput.value);
      const baseMonthlyExpenses = toNumber(baseMonthlyExpensesInput.value);

      // Vacancy default if blank
      const vacancyRaw = vacancyRateInput.value;
      const vacancyRate = vacancyRaw && vacancyRaw.trim() !== "" ? toNumber(vacancyRaw) : 5;

      // Validate required
      if (!validatePositive(purchasePrice, "purchase price")) return;
      if (!validatePositive(monthlyRent, "monthly rent")) return;
      if (!validateNonNegative(baseMonthlyExpenses, "monthly operating expenses")) return;
      if (!validatePercentRange(vacancyRate, "vacancy rate", 0, 50)) return;

      // Parse optional inputs with defaults
      const otherMonthlyIncome = otherMonthlyIncomeInput ? toNumber(otherMonthlyIncomeInput.value) : 0;
      const propertyTaxesAnnual = propertyTaxesAnnualInput ? toNumber(propertyTaxesAnnualInput.value) : 0;
      const insuranceAnnual = insuranceAnnualInput ? toNumber(insuranceAnnualInput.value) : 0;
      const hoaMonthly = hoaMonthlyInput ? toNumber(hoaMonthlyInput.value) : 0;
      const utilitiesMonthly = utilitiesMonthlyInput ? toNumber(utilitiesMonthlyInput.value) : 0;

      const managementRateRaw = managementRateInput ? managementRateInput.value : "";
      const managementRate = managementRateRaw && managementRateRaw.trim() !== "" ? toNumber(managementRateRaw) : 0;

      const maintenanceReserveRateRaw = maintenanceReserveRateInput ? maintenanceReserveRateInput.value : "";
      const maintenanceReserveRate =
        maintenanceReserveRateRaw && maintenanceReserveRateRaw.trim() !== "" ? toNumber(maintenanceReserveRateRaw) : 0;

      const targetCapRateRaw = targetCapRateInput ? targetCapRateInput.value : "";
      const targetCapRate =
        targetCapRateRaw && targetCapRateRaw.trim() !== "" ? toNumber(targetCapRateRaw) : 7;

      // Validate optional inputs (only if present and parsed)
      if (!validateNonNegative(otherMonthlyIncome, "other monthly income")) return;
      if (!validateNonNegative(propertyTaxesAnnual, "annual property taxes")) return;
      if (!validateNonNegative(insuranceAnnual, "annual insurance")) return;
      if (!validateNonNegative(hoaMonthly, "monthly HOA/body corporate")) return;
      if (!validateNonNegative(utilitiesMonthly, "monthly utilities")) return;
      if (!validatePercentRange(managementRate, "management fee", 0, 25)) return;
      if (!validatePercentRange(maintenanceReserveRate, "maintenance reserve", 0, 25)) return;
      if (!validatePercentRange(targetCapRate, "target cap rate", 1, 25)) return;

      // Core calculation
      const annualGrossRent = monthlyRent * 12;
      const annualVacancyLoss = annualGrossRent * (vacancyRate / 100);
      const annualCollectedRent = Math.max(0, annualGrossRent - annualVacancyLoss);

      const annualOtherIncome = otherMonthlyIncome * 12;
      const annualEffectiveIncome = annualCollectedRent + annualOtherIncome;

      const annualBaseExpenses = baseMonthlyExpenses * 12;
      const annualHoa = hoaMonthly * 12;
      const annualUtilities = utilitiesMonthly * 12;

      const annualManagementFee = annualCollectedRent * (managementRate / 100);
      const annualMaintenanceReserve = annualGrossRent * (maintenanceReserveRate / 100);

      const annualOperatingExpenses =
        annualBaseExpenses +
        propertyTaxesAnnual +
        insuranceAnnual +
        annualHoa +
        annualUtilities +
        annualManagementFee +
        annualMaintenanceReserve;

      const noiAnnual = annualEffectiveIncome - annualOperatingExpenses;
      const noiMonthly = noiAnnual / 12;

      const capRate = (noiAnnual / purchasePrice) * 100;

      // Secondary insight: implied value at target cap rate (only meaningful if NOI > 0)
      let impliedValueAtTargetCap = null;
      if (noiAnnual > 0 && targetCapRate > 0) {
        impliedValueAtTargetCap = noiAnnual / (targetCapRate / 100);
      }

      // Expense ratio (avoid divide by zero)
      const expenseRatio = annualEffectiveIncome > 0 ? (annualOperatingExpenses / annualEffectiveIncome) * 100 : null;

      // Guard against nonsensical outputs
      if (!Number.isFinite(capRate)) {
        setResultError("Something went wrong. Check your inputs and try again.");
        return;
      }

      const capRateText = formatNumberTwoDecimals(capRate);
      const noiAnnualText = formatNumberTwoDecimals(noiAnnual);
      const noiMonthlyText = formatNumberTwoDecimals(noiMonthly);

      const grossRentText = formatNumberTwoDecimals(annualGrossRent);
      const collectedRentText = formatNumberTwoDecimals(annualCollectedRent);
      const effectiveIncomeText = formatNumberTwoDecimals(annualEffectiveIncome);
      const operatingExpensesText = formatNumberTwoDecimals(annualOperatingExpenses);

      const expenseRatioText = expenseRatio === null ? "N/A" : formatNumberTwoDecimals(expenseRatio) + "%";

      let valuationRow = "";
      if (impliedValueAtTargetCap !== null) {
        valuationRow = `
          <p><strong>Implied property value at ${formatNumberTwoDecimals(targetCapRate)}% cap:</strong> ${formatNumberTwoDecimals(impliedValueAtTargetCap)}</p>
        `;
      } else {
        valuationRow = `
          <p><strong>Implied property value at ${formatNumberTwoDecimals(targetCapRate)}% cap:</strong> N/A (NOI must be above 0)</p>
        `;
      }

      const resultHtml = `
        <p><strong>Cap rate:</strong> ${capRateText}%</p>
        <p><strong>NOI (annual):</strong> ${noiAnnualText}</p>
        <p><strong>NOI (monthly):</strong> ${noiMonthlyText}</p>
        <hr>
        <p><strong>Gross rent (annual):</strong> ${grossRentText}</p>
        <p><strong>Collected rent after vacancy (annual):</strong> ${collectedRentText}</p>
        <p><strong>Effective income incl. other income (annual):</strong> ${effectiveIncomeText}</p>
        <p><strong>Operating expenses (annual):</strong> ${operatingExpensesText}</p>
        <p><strong>Operating expense ratio:</strong> ${expenseRatioText}</p>
        <hr>
        ${valuationRow}
        <p><strong>Note:</strong> Cap rate is NOI divided by purchase price. It excludes financing by design.</p>
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
      const message = "Cap Rate Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
