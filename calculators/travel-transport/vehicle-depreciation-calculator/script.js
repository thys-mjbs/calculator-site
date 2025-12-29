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
  const ageYearsInput = document.getElementById("ageYears");

  const annualRateInput = document.getElementById("annualRate");
  const currentMileageInput = document.getElementById("currentMileage");
  const annualMileageInput = document.getElementById("annualMileage");
  const mileagePenaltyInput = document.getElementById("mileagePenalty");
  const minResidualInput = document.getElementById("minResidual");

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
  attachLiveFormatting(currentMileageInput);
  attachLiveFormatting(annualMileageInput);

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

  function clamp(value, min, max) {
    if (!Number.isFinite(value)) return min;
    return Math.min(max, Math.max(min, value));
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      // Parse required inputs
      const purchasePrice = toNumber(purchasePriceInput ? purchasePriceInput.value : "");
      const ageYears = toNumber(ageYearsInput ? ageYearsInput.value : "");

      // Existence guard
      if (!purchasePriceInput || !ageYearsInput) return;

      // Validation (required)
      if (!validatePositive(purchasePrice, "purchase price")) return;
      if (!validateNonNegative(ageYears, "vehicle age")) return;

      // Advanced inputs with defaults (optional)
      const annualRateRaw = toNumber(annualRateInput ? annualRateInput.value : "");
      const annualRatePct = Number.isFinite(annualRateRaw) && annualRateRaw > 0 ? annualRateRaw : 15;

      const annualMileageRaw = toNumber(annualMileageInput ? annualMileageInput.value : "");
      const expectedAnnualMileage = Number.isFinite(annualMileageRaw) && annualMileageRaw > 0 ? annualMileageRaw : 15000;

      const mileagePenaltyRaw = toNumber(mileagePenaltyInput ? mileagePenaltyInput.value : "");
      const mileagePenaltyPctPer1k =
        Number.isFinite(mileagePenaltyRaw) && mileagePenaltyRaw >= 0 ? mileagePenaltyRaw : 0.2;

      const minResidualRaw = toNumber(minResidualInput ? minResidualInput.value : "");
      const minResidualPct =
        Number.isFinite(minResidualRaw) && minResidualRaw >= 0 ? minResidualRaw : 10;

      // Validate advanced ranges (soft clamp)
      const annualRate = clamp(annualRatePct, 1, 60) / 100;
      const minResidualRate = clamp(minResidualPct, 0, 50) / 100;
      const mileagePenaltyRatePer1k = clamp(mileagePenaltyPctPer1k, 0, 2) / 100;

      // Core depreciation (declining balance)
      const baseValue = purchasePrice * Math.pow(1 - annualRate, ageYears);
      const floorValue = purchasePrice * minResidualRate;

      let mileageNote = "Mileage not provided. No mileage adjustment applied.";
      let mileageAdjustmentFactor = 1;

      const currentMileage = toNumber(currentMileageInput ? currentMileageInput.value : "");
      if (Number.isFinite(currentMileage) && currentMileage > 0) {
        if (!validateNonNegative(currentMileage, "current mileage")) return;

        const expectedMileageTotal = expectedAnnualMileage * ageYears;
        const mileageDiff = currentMileage - expectedMileageTotal;

        // Positive diff = over expected => penalty; negative diff = under expected => bonus
        const diffInThousands = mileageDiff / 1000;
        const adjustment = -diffInThousands * mileagePenaltyRatePer1k;

        // Cap adjustment to keep it sane
        mileageAdjustmentFactor = clamp(1 + adjustment, 0.70, 1.15);

        const direction = mileageDiff > 0 ? "over" : "under";
        const absDiff = Math.abs(mileageDiff);

        mileageNote =
          "Mileage adjustment applied: " +
          formatNumberTwoDecimals(absDiff) +
          " km " +
          direction +
          " expected for age (expected " +
          formatNumberTwoDecimals(expectedMileageTotal) +
          " km).";
      }

      let estimatedValue = baseValue * mileageAdjustmentFactor;
      if (estimatedValue < floorValue) estimatedValue = floorValue;

      // Supporting figures
      const depreciationAmount = purchasePrice - estimatedValue;
      const depreciationPct = (depreciationAmount / purchasePrice) * 100;

      // Simple range (rate sensitivity)
      const lowRate = clamp((annualRatePct - 3), 1, 60) / 100;
      const highRate = clamp((annualRatePct + 3), 1, 60) / 100;

      let lowValue = purchasePrice * Math.pow(1 - lowRate, ageYears) * mileageAdjustmentFactor;
      let highValue = purchasePrice * Math.pow(1 - highRate, ageYears) * mileageAdjustmentFactor;

      lowValue = Math.max(lowValue, floorValue);
      highValue = Math.max(highValue, floorValue);

      // Forward-looking projections (same assumptions)
      const agePlus1 = ageYears + 1;
      const agePlus3 = ageYears + 3;

      let valuePlus1 = purchasePrice * Math.pow(1 - annualRate, agePlus1) * mileageAdjustmentFactor;
      let valuePlus3 = purchasePrice * Math.pow(1 - annualRate, agePlus3) * mileageAdjustmentFactor;

      valuePlus1 = Math.max(valuePlus1, floorValue);
      valuePlus3 = Math.max(valuePlus3, floorValue);

      const resultHtml = `
        <p><strong>Estimated current value:</strong> ${formatNumberTwoDecimals(estimatedValue)}</p>
        <p><strong>Total depreciation:</strong> ${formatNumberTwoDecimals(depreciationAmount)} (${formatNumberTwoDecimals(depreciationPct)}%)</p>
        <p><strong>Estimate range (rate ±3%):</strong> ${formatNumberTwoDecimals(lowValue)} to ${formatNumberTwoDecimals(highValue)}</p>
        <hr>
        <p><strong>Projected value in 1 year:</strong> ${formatNumberTwoDecimals(valuePlus1)}</p>
        <p><strong>Projected value in 3 years:</strong> ${formatNumberTwoDecimals(valuePlus3)}</p>
        <hr>
        <p><strong>Assumptions used:</strong></p>
        <ul>
          <li>Annual depreciation rate: ${formatNumberTwoDecimals(annualRatePct)}%</li>
          <li>Minimum residual value: ${formatNumberTwoDecimals(minResidualPct)}% of purchase price</li>
          <li>${mileageNote}</li>
        </ul>
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
      const message = "Vehicle Depreciation Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
