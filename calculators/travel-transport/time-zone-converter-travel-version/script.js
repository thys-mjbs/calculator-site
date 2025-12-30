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
  const ownershipYearsInput = document.getElementById("ownershipYears");
  const annualKmInput = document.getElementById("annualKm");
  const fuelLitresPer100Input = document.getElementById("fuelLitresPer100");
  const fuelPricePerLitreInput = document.getElementById("fuelPricePerLitre");
  const insurancePerMonthInput = document.getElementById("insurancePerMonth");
  const maintenancePerYearInput = document.getElementById("maintenancePerYear");
  const taxesPerYearInput = document.getElementById("taxesPerYear");
  const resaleValueInput = document.getElementById("resaleValue");
  const downPaymentInput = document.getElementById("downPayment");
  const aprPercentInput = document.getElementById("aprPercent");
  const loanTermMonthsInput = document.getElementById("loanTermMonths");

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
  attachLiveFormatting(purchasePriceInput);
  attachLiveFormatting(annualKmInput);
  attachLiveFormatting(fuelPricePerLitreInput);
  attachLiveFormatting(insurancePerMonthInput);
  attachLiveFormatting(maintenancePerYearInput);
  attachLiveFormatting(taxesPerYearInput);
  attachLiveFormatting(resaleValueInput);
  attachLiveFormatting(downPaymentInput);
  attachLiveFormatting(loanTermMonthsInput);

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
      const purchasePrice = toNumber(purchasePriceInput ? purchasePriceInput.value : "");
      const ownershipYears = toNumber(ownershipYearsInput ? ownershipYearsInput.value : "");
      const annualKm = toNumber(annualKmInput ? annualKmInput.value : "");
      const fuelLitresPer100 = toNumber(fuelLitresPer100Input ? fuelLitresPer100Input.value : "");
      const fuelPricePerLitre = toNumber(fuelPricePerLitreInput ? fuelPricePerLitreInput.value : "");

      const insurancePerMonthRaw = toNumber(insurancePerMonthInput ? insurancePerMonthInput.value : "");
      const maintenancePerYearRaw = toNumber(maintenancePerYearInput ? maintenancePerYearInput.value : "");
      const taxesPerYearRaw = toNumber(taxesPerYearInput ? taxesPerYearInput.value : "");
      const resaleValueRaw = toNumber(resaleValueInput ? resaleValueInput.value : "");

      const downPaymentRaw = toNumber(downPaymentInput ? downPaymentInput.value : "");
      const aprPercentRaw = toNumber(aprPercentInput ? aprPercentInput.value : "");
      const loanTermMonthsRaw = toNumber(loanTermMonthsInput ? loanTermMonthsInput.value : "");

      // Basic existence guard
      if (
        !purchasePriceInput ||
        !ownershipYearsInput ||
        !annualKmInput ||
        !fuelLitresPer100Input ||
        !fuelPricePerLitreInput
      ) {
        return;
      }

      // Validation (required)
      if (!validatePositive(purchasePrice, "purchase price")) return;
      if (!validatePositive(ownershipYears, "ownership period (years)")) return;
      if (!validatePositive(annualKm, "distance driven per year (km)")) return;
      if (!validatePositive(fuelLitresPer100, "fuel consumption (litres per 100 km)")) return;
      if (!validateNonNegative(fuelPricePerLitre, "fuel price (per litre)")) return;

      // Optional values (default to 0 if blank/non-finite)
      const insurancePerMonth = Number.isFinite(insurancePerMonthRaw) ? insurancePerMonthRaw : 0;
      const maintenancePerYear = Number.isFinite(maintenancePerYearRaw) ? maintenancePerYearRaw : 0;
      const taxesPerYear = Number.isFinite(taxesPerYearRaw) ? taxesPerYearRaw : 0;
      const downPayment = Number.isFinite(downPaymentRaw) ? downPaymentRaw : 0;

      if (!validateNonNegative(insurancePerMonth, "insurance per month")) return;
      if (!validateNonNegative(maintenancePerYear, "maintenance per year")) return;
      if (!validateNonNegative(taxesPerYear, "taxes per year")) return;
      if (!validateNonNegative(downPayment, "down payment")) return;

      const ownershipMonths = ownershipYears * 12;
      if (!Number.isFinite(ownershipMonths) || ownershipMonths <= 0) {
        setResultError("Enter a valid ownership period (years) greater than 0.");
        return;
      }

      // Resale value handling
      const hasResale = Number.isFinite(resaleValueRaw) && resaleValueInput && resaleValueInput.value.trim() !== "";
      let resaleValue = 0;

      if (hasResale) {
        resaleValue = resaleValueRaw;
        if (!validateNonNegative(resaleValue, "expected resale value")) return;
        if (resaleValue > purchasePrice) {
          setResultError("Resale value should not be greater than the purchase price.");
          return;
        }
      } else {
        resaleValue = 0;
      }

      // Fuel cost
      const litresPerYear = annualKm * (fuelLitresPer100 / 100);
      const fuelCostPerYear = litresPerYear * fuelPricePerLitre;

      if (!Number.isFinite(fuelCostPerYear) || fuelCostPerYear < 0) {
        setResultError("Fuel inputs produced an invalid fuel cost. Check your values.");
        return;
      }

      // Operating costs
      const insurancePerYear = insurancePerMonth * 12;
      const operatingPerYear = fuelCostPerYear + insurancePerYear + maintenancePerYear + taxesPerYear;
      const operatingTotal = operatingPerYear * ownershipYears;

      // Depreciation (only if resale provided)
      const depreciation = hasResale ? (purchasePrice - resaleValue) : 0;

      // Financing (optional)
      const hasFinanceInputs =
        (aprPercentInput && aprPercentInput.value.trim() !== "") ||
        (loanTermMonthsInput && loanTermMonthsInput.value.trim() !== "") ||
        (downPaymentInput && downPaymentInput.value.trim() !== "");

      let loanPrincipal = 0;
      let aprPercent = 0;
      let loanTermMonths = 0;
      let monthlyPayment = 0;
      let paymentsMadeMonths = 0;
      let remainingBalance = 0;
      let interestPaid = 0;

      if (hasFinanceInputs) {
        aprPercent = Number.isFinite(aprPercentRaw) ? aprPercentRaw : 0;
        loanTermMonths = Number.isFinite(loanTermMonthsRaw) ? loanTermMonthsRaw : 0;

        if (aprPercent < 0 || aprPercent > 100) {
          setResultError("Enter a valid loan APR between 0 and 100.");
          return;
        }
        if (loanTermMonths < 0) {
          setResultError("Enter a valid loan term (months) of 0 or higher.");
          return;
        }

        loanPrincipal = purchasePrice - downPayment;
        if (loanPrincipal < 0) loanPrincipal = 0;

        if (loanPrincipal > 0 && loanTermMonths > 0) {
          const r = (aprPercent / 100) / 12;

          if (r === 0) {
            monthlyPayment = loanPrincipal / loanTermMonths;
          } else {
            const pow = Math.pow(1 + r, loanTermMonths);
            monthlyPayment = (loanPrincipal * r * pow) / (pow - 1);
          }

          paymentsMadeMonths = Math.min(ownershipMonths, loanTermMonths);

          if (paymentsMadeMonths === 0) {
            remainingBalance = loanPrincipal;
            interestPaid = 0;
          } else if (r === 0) {
            const principalPaid = monthlyPayment * paymentsMadeMonths;
            remainingBalance = Math.max(0, loanPrincipal - principalPaid);
            interestPaid = 0;
          } else {
            const powK = Math.pow(1 + r, paymentsMadeMonths);
            remainingBalance = loanPrincipal * powK - monthlyPayment * ((powK - 1) / r);
            if (!Number.isFinite(remainingBalance) || remainingBalance < 0) remainingBalance = 0;

            const totalPaid = monthlyPayment * paymentsMadeMonths;
            const principalRepaid = loanPrincipal - remainingBalance;
            interestPaid = totalPaid - principalRepaid;
            if (!Number.isFinite(interestPaid) || interestPaid < 0) interestPaid = 0;
          }
        }
      }

      // Totals and break-downs
      const totalKm = annualKm * ownershipYears;
      if (!Number.isFinite(totalKm) || totalKm <= 0) {
        setResultError("Your distance driven produces an invalid total kilometres. Check your values.");
        return;
      }

      const totalPaidToLender = monthlyPayment * paymentsMadeMonths;
      const netProceedsFromSale = hasResale ? (resaleValue - remainingBalance) : 0;

      // Cash outflow (net): down payment + payments made + operating - net sale proceeds
      const cashOutflowNet = (downPayment + totalPaidToLender + operatingTotal) - netProceedsFromSale;

      // Economic cost: depreciation (if provided) + operating + interest paid
      const economicCost = (depreciation + operatingTotal + interestPaid);

      const cashPerMonth = cashOutflowNet / ownershipMonths;
      const cashPerKm = cashOutflowNet / totalKm;

      const econPerMonth = economicCost / ownershipMonths;
      const econPerKm = economicCost / totalKm;

      // Build assumptions summary
      const includedParts = [];
      includedParts.push("Fuel");
      if (insurancePerMonth > 0) includedParts.push("Insurance");
      if (maintenancePerYear > 0) includedParts.push("Maintenance");
      if (taxesPerYear > 0) includedParts.push("Licence/taxes");
      if (hasResale) includedParts.push("Depreciation");
      if (loanPrincipal > 0 && loanTermMonths > 0) includedParts.push("Financing");

      const includedText = includedParts.length ? includedParts.join(", ") : "Fuel";

      // Result HTML
      const resultHtml = `
        <p><strong>Net cash outflow (estimated):</strong> ${formatNumberTwoDecimals(cashOutflowNet)}</p>
        <p><strong>Net cash cost per month:</strong> ${formatNumberTwoDecimals(cashPerMonth)}</p>
        <p><strong>Net cash cost per km:</strong> ${formatNumberTwoDecimals(cashPerKm)}</p>
        <hr>
        <p><strong>Economic cost (depreciation + running + interest):</strong> ${formatNumberTwoDecimals(economicCost)}</p>
        <p><strong>Economic cost per month:</strong> ${formatNumberTwoDecimals(econPerMonth)}</p>
        <p><strong>Economic cost per km:</strong> ${formatNumberTwoDecimals(econPerKm)}</p>
        <hr>
        <p><strong>Breakdown (over ${formatNumberTwoDecimals(ownershipYears)} years):</strong></p>
        <ul>
          <li>Running costs (fuel + optional items): ${formatNumberTwoDecimals(operatingTotal)}</li>
          <li>Fuel cost: ${formatNumberTwoDecimals(fuelCostPerYear * ownershipYears)}</li>
          <li>Insurance: ${formatNumberTwoDecimals(insurancePerYear * ownershipYears)}</li>
          <li>Maintenance: ${formatNumberTwoDecimals(maintenancePerYear * ownershipYears)}</li>
          <li>Licence/taxes: ${formatNumberTwoDecimals(taxesPerYear * ownershipYears)}</li>
          <li>Depreciation (if resale entered): ${formatNumberTwoDecimals(depreciation)}</li>
          <li>Interest paid (if financing entered): ${formatNumberTwoDecimals(interestPaid)}</li>
        </ul>
        <p><strong>Included in this estimate:</strong> ${includedText}</p>
        ${
          (loanPrincipal > 0 && loanTermMonths > 0)
            ? `<p><strong>Estimated loan payment:</strong> ${formatNumberTwoDecimals(monthlyPayment)} per month. Remaining balance after ${formatNumberTwoDecimals(paymentsMadeMonths)} months: ${formatNumberTwoDecimals(remainingBalance)}.</p>`
            : `<p><strong>Financing:</strong> Not included (or insufficient details provided).</p>`
        }
        ${
          hasResale
            ? `<p><strong>Estimated net proceeds from sale:</strong> ${formatNumberTwoDecimals(netProceedsFromSale)} (resale value minus any remaining loan balance).</p>`
            : `<p><strong>Resale value:</strong> Not included. Add an expected resale value to estimate depreciation and sale proceeds.</p>`
        }
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
      const message = "Vehicle Ownership Cost Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
