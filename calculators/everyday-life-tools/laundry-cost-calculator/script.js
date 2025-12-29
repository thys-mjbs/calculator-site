document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const loadsPerWeekInput = document.getElementById("loadsPerWeek");
  const electricityRateInput = document.getElementById("electricityRate");
  const waterRatePer1000LInput = document.getElementById("waterRatePer1000L");
  const detergentPerLoadInput = document.getElementById("detergentPerLoad");

  const washerKwhPerLoadInput = document.getElementById("washerKwhPerLoad");
  const waterLitresPerLoadInput = document.getElementById("waterLitresPerLoad");
  const dryerUsePercentInput = document.getElementById("dryerUsePercent");
  const dryerKwhPerLoadInput = document.getElementById("dryerKwhPerLoad");
  const extrasPerLoadInput = document.getElementById("extrasPerLoad");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(loadsPerWeekInput);
  attachLiveFormatting(electricityRateInput);
  attachLiveFormatting(waterRatePer1000LInput);
  attachLiveFormatting(detergentPerLoadInput);
  attachLiveFormatting(washerKwhPerLoadInput);
  attachLiveFormatting(waterLitresPerLoadInput);
  attachLiveFormatting(dryerUsePercentInput);
  attachLiveFormatting(dryerKwhPerLoadInput);
  attachLiveFormatting(extrasPerLoadInput);

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

  function clamp(value, min, max) {
    if (!Number.isFinite(value)) return value;
    return Math.min(Math.max(value, min), max);
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      // Parse required inputs
      const loadsPerWeek = toNumber(loadsPerWeekInput ? loadsPerWeekInput.value : "");
      const electricityRate = toNumber(electricityRateInput ? electricityRateInput.value : "");
      const waterRatePer1000L = toNumber(waterRatePer1000LInput ? waterRatePer1000LInput.value : "");
      const detergentPerLoad = toNumber(detergentPerLoadInput ? detergentPerLoadInput.value : "");

      // Basic existence guard
      if (!loadsPerWeekInput || !electricityRateInput || !waterRatePer1000LInput || !detergentPerLoadInput) return;

      // Validation for required fields
      if (!validatePositive(loadsPerWeek, "loads per week")) return;
      if (!validatePositive(electricityRate, "electricity price per kWh")) return;
      if (!validatePositive(waterRatePer1000L, "water price per 1,000 litres")) return;
      if (!validateNonNegative(detergentPerLoad, "detergent cost per load")) return;

      // Parse optional advanced inputs with defaults
      const washerKwhPerLoadRaw = toNumber(washerKwhPerLoadInput ? washerKwhPerLoadInput.value : "");
      const waterLitresPerLoadRaw = toNumber(waterLitresPerLoadInput ? waterLitresPerLoadInput.value : "");
      const dryerUsePercentRaw = toNumber(dryerUsePercentInput ? dryerUsePercentInput.value : "");
      const dryerKwhPerLoadRaw = toNumber(dryerKwhPerLoadInput ? dryerKwhPerLoadInput.value : "");
      const extrasPerLoadRaw = toNumber(extrasPerLoadInput ? extrasPerLoadInput.value : "");

      const washerKwhPerLoad = Number.isFinite(washerKwhPerLoadRaw) && washerKwhPerLoadRaw > 0 ? washerKwhPerLoadRaw : 0.6;
      const waterLitresPerLoad = Number.isFinite(waterLitresPerLoadRaw) && waterLitresPerLoadRaw > 0 ? waterLitresPerLoadRaw : 60;
      const dryerUsePercent = Number.isFinite(dryerUsePercentRaw) && dryerUsePercentRaw >= 0 ? clamp(dryerUsePercentRaw, 0, 100) : 0;
      const dryerKwhPerLoad = Number.isFinite(dryerKwhPerLoadRaw) && dryerKwhPerLoadRaw > 0 ? dryerKwhPerLoadRaw : 2.5;
      const extrasPerLoad = Number.isFinite(extrasPerLoadRaw) && extrasPerLoadRaw >= 0 ? extrasPerLoadRaw : 0;

      // Sanity checks for advanced inputs (soft constraints, but still fail on extreme nonsense)
      if (!validatePositive(washerKwhPerLoad, "washer electricity per load (kWh)")) return;
      if (!validatePositive(waterLitresPerLoad, "water used per load (litres)")) return;
      if (!validateNonNegative(extrasPerLoad, "extras per load")) return;

      // Calculation
      const washerElectricityCostPerLoad = washerKwhPerLoad * electricityRate;
      const dryerElectricityCostPerLoad = (dryerUsePercent / 100) * dryerKwhPerLoad * electricityRate;
      const waterCostPerLoad = (waterLitresPerLoad / 1000) * waterRatePer1000L;

      const costPerLoad =
        washerElectricityCostPerLoad +
        dryerElectricityCostPerLoad +
        waterCostPerLoad +
        detergentPerLoad +
        extrasPerLoad;

      const weeklyCost = costPerLoad * loadsPerWeek;
      const monthlyLoads = loadsPerWeek * 4.33;
      const monthlyCost = costPerLoad * monthlyLoads;
      const yearlyCost = monthlyCost * 12;

      // Output HTML
      const resultHtml = `
        <p><strong>Estimated cost per load:</strong> ${formatNumberTwoDecimals(costPerLoad)}</p>
        <p><strong>Estimated monthly total:</strong> ${formatNumberTwoDecimals(monthlyCost)} <span style="font-size:12px;">(based on ${formatNumberTwoDecimals(monthlyLoads)} loads per month)</span></p>
        <p><strong>Weekly:</strong> ${formatNumberTwoDecimals(weeklyCost)} &nbsp; <strong>Yearly:</strong> ${formatNumberTwoDecimals(yearlyCost)}</p>

        <p><strong>Breakdown per load</strong></p>
        <ul>
          <li>Washer electricity: ${formatNumberTwoDecimals(washerElectricityCostPerLoad)}</li>
          <li>Water: ${formatNumberTwoDecimals(waterCostPerLoad)}</li>
          <li>Detergent: ${formatNumberTwoDecimals(detergentPerLoad)}</li>
          <li>Dryer electricity (weighted): ${formatNumberTwoDecimals(dryerElectricityCostPerLoad)}</li>
          <li>Extras: ${formatNumberTwoDecimals(extrasPerLoad)}</li>
        </ul>

        <p style="font-size:12px;">
          Defaults used (if blank): washer 0.60 kWh/load, water 60 L/load, dryer 0% with 2.50 kWh/load.
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
      const message = "Laundry Cost Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
