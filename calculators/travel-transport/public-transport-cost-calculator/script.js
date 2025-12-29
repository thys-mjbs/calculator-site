document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const oneWayFareInput = document.getElementById("oneWayFare");
  const ridesPerDayInput = document.getElementById("ridesPerDay");
  const commuteDaysPerWeekInput = document.getElementById("commuteDaysPerWeek");
  const monthlyPassCostInput = document.getElementById("monthlyPassCost");
  const fareDiscountPercentInput = document.getElementById("fareDiscountPercent");
  const extraRidesPerWeekInput = document.getElementById("extraRidesPerWeek");
  const weeksPerMonthInput = document.getElementById("weeksPerMonth");

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
  attachLiveFormatting(oneWayFareInput);
  attachLiveFormatting(ridesPerDayInput);
  attachLiveFormatting(commuteDaysPerWeekInput);
  attachLiveFormatting(monthlyPassCostInput);
  attachLiveFormatting(fareDiscountPercentInput);
  attachLiveFormatting(extraRidesPerWeekInput);
  attachLiveFormatting(weeksPerMonthInput);

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

  function validateRangeInclusive(value, min, max, fieldLabel) {
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
      // Parse required inputs using toNumber() (from /scripts/main.js)
      const oneWayFare = toNumber(oneWayFareInput ? oneWayFareInput.value : "");
      const ridesPerDay = toNumber(ridesPerDayInput ? ridesPerDayInput.value : "");
      const commuteDaysPerWeek = toNumber(commuteDaysPerWeekInput ? commuteDaysPerWeekInput.value : "");

      // Parse optional inputs (with defaults)
      const monthlyPassCostRaw = toNumber(monthlyPassCostInput ? monthlyPassCostInput.value : "");
      const monthlyPassCost = Number.isFinite(monthlyPassCostRaw) && monthlyPassCostRaw > 0 ? monthlyPassCostRaw : 0;

      const discountRaw = toNumber(fareDiscountPercentInput ? fareDiscountPercentInput.value : "");
      const fareDiscountPercent = Number.isFinite(discountRaw) ? discountRaw : 0;

      const extraRidesRaw = toNumber(extraRidesPerWeekInput ? extraRidesPerWeekInput.value : "");
      const extraRidesPerWeek = Number.isFinite(extraRidesRaw) ? extraRidesRaw : 0;

      const weeksPerMonthRaw = toNumber(weeksPerMonthInput ? weeksPerMonthInput.value : "");
      const weeksPerMonth = Number.isFinite(weeksPerMonthRaw) && weeksPerMonthRaw > 0 ? weeksPerMonthRaw : 4.33;

      // Basic existence guard
      if (!oneWayFareInput || !ridesPerDayInput || !commuteDaysPerWeekInput) return;

      // Validation (required)
      if (!validatePositive(oneWayFare, "one-way fare")) return;
      if (!validatePositive(ridesPerDay, "rides per day")) return;
      if (!validateRangeInclusive(commuteDaysPerWeek, 1, 7, "commute days per week")) return;

      // Validation (optional)
      if (!validateRangeInclusive(fareDiscountPercent, 0, 100, "discount percentage")) return;
      if (!validateNonNegative(extraRidesPerWeek, "extra rides per week")) return;
      if (!validatePositive(weeksPerMonth, "weeks per month")) return;
      if (monthlyPassCostInput && monthlyPassCostRaw) {
        if (!validateNonNegative(monthlyPassCostRaw, "monthly pass cost")) return;
      }

      // Calculation logic
      const discountFactor = 1 - fareDiscountPercent / 100;
      const effectiveOneWayFare = oneWayFare * discountFactor;

      const commuteRidesPerWeek = ridesPerDay * commuteDaysPerWeek;
      const totalRidesPerWeek = commuteRidesPerWeek + extraRidesPerWeek;

      const weeklyCostPayg = totalRidesPerWeek * effectiveOneWayFare;
      const monthlyCostPayg = weeklyCostPayg * weeksPerMonth;
      const annualCostPayg = monthlyCostPayg * 12;

      const avgDailyCommuteCost = (ridesPerDay * effectiveOneWayFare);

      // Pass comparison (only if provided)
      let passHtml = "";
      if (monthlyPassCost > 0) {
        const monthlyDifference = monthlyPassCost - monthlyCostPayg; // positive means pass costs more
        const passIsCheaper = monthlyPassCost < monthlyCostPayg;

        const ridesPerMonth = totalRidesPerWeek * weeksPerMonth;
        const breakEvenRidesPerMonth = effectiveOneWayFare > 0 ? (monthlyPassCost / effectiveOneWayFare) : Infinity;
        const breakEvenRidesPerWeek = effectiveOneWayFare > 0 ? (breakEvenRidesPerMonth / weeksPerMonth) : Infinity;

        const absDiff = Math.abs(monthlyDifference);

        passHtml = `
          <hr>
          <p><strong>Monthly pass comparison:</strong></p>
          <p><strong>Monthly pass cost:</strong> ${formatNumberTwoDecimals(monthlyPassCost)}</p>
          <p><strong>Estimated rides per month:</strong> ${formatNumberTwoDecimals(ridesPerMonth)}</p>
          <p><strong>Break-even rides per month:</strong> ${formatNumberTwoDecimals(breakEvenRidesPerMonth)}</p>
          <p><strong>Break-even rides per week:</strong> ${formatNumberTwoDecimals(breakEvenRidesPerWeek)}</p>
          <p><strong>Verdict:</strong> ${
            passIsCheaper
              ? `The pass is cheaper by about ${formatNumberTwoDecimals(absDiff)} per month for your current pattern.`
              : monthlyPassCost === monthlyCostPayg
              ? `The pass and pay-per-ride are about the same for your current pattern.`
              : `Pay-per-ride is cheaper by about ${formatNumberTwoDecimals(absDiff)} per month for your current pattern.`
          }</p>
        `;
      } else {
        passHtml = `
          <hr>
          <p><strong>Monthly pass comparison:</strong></p>
          <p>Optional: enter a monthly pass cost in Advanced to see whether a pass is cheaper than paying per ride.</p>
        `;
      }

      // Build output HTML
      const resultHtml = `
        <p><strong>Pay-per-ride estimate:</strong></p>
        <p><strong>Cost per commuting day:</strong> ${formatNumberTwoDecimals(avgDailyCommuteCost)}</p>
        <p><strong>Cost per week:</strong> ${formatNumberTwoDecimals(weeklyCostPayg)}</p>
        <p><strong>Cost per month:</strong> ${formatNumberTwoDecimals(monthlyCostPayg)}</p>
        <p><strong>Cost per year:</strong> ${formatNumberTwoDecimals(annualCostPayg)}</p>
        <hr>
        <p><strong>What this means:</strong> If you keep this pattern, your transport spend is roughly ${formatNumberTwoDecimals(monthlyCostPayg)} per month. Use the Advanced section if you have extra rides, fare discounts, or a monthly pass to compare.</p>
        ${passHtml}
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
      const message = "Public Transport Cost Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
