document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const totalFuelCostInput = document.getElementById("totalFuelCost");
  const peopleCountInput = document.getElementById("peopleCount");
  const distanceKmInput = document.getElementById("distanceKm");
  const fuelEconomyInput = document.getElementById("fuelEconomy");
  const fuelPricePerLInput = document.getElementById("fuelPricePerL");

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
  attachLiveFormatting(totalFuelCostInput);
  attachLiveFormatting(peopleCountInput);
  attachLiveFormatting(distanceKmInput);
  attachLiveFormatting(fuelEconomyInput);
  attachLiveFormatting(fuelPricePerLInput);

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

  function validateWholeNumber(value, fieldLabel) {
    if (!Number.isFinite(value) || value <= 0 || Math.floor(value) !== value) {
      setResultError("Enter a valid " + fieldLabel + " as a whole number (1 or higher).");
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
      const totalFuelCost = toNumber(totalFuelCostInput ? totalFuelCostInput.value : "");
      const peopleCountRaw = toNumber(peopleCountInput ? peopleCountInput.value : "");

      const distanceKm = toNumber(distanceKmInput ? distanceKmInput.value : "");
      const fuelEconomyLPer100 = toNumber(fuelEconomyInput ? fuelEconomyInput.value : "");
      const fuelPricePerL = toNumber(fuelPricePerLInput ? fuelPricePerLInput.value : "");

      // Basic existence guard
      if (!totalFuelCostInput || !peopleCountInput) return;

      // Validation (required)
      if (!validatePositive(totalFuelCost, "total fuel spend")) return;
      if (!validateWholeNumber(peopleCountRaw, "number of people")) return;

      // Soft sanity limits (do not block unless extreme)
      const peopleCount = Math.floor(peopleCountRaw);
      if (peopleCount > 100) {
        setResultError("Enter a realistic number of people (100 or fewer).");
        return;
      }

      // Calculation logic (primary intent)
      const perPerson = totalFuelCost / peopleCount;

      // Optional advanced estimate (only if all 3 provided and valid)
      const hasAdvanced =
        Number.isFinite(distanceKm) &&
        Number.isFinite(fuelEconomyLPer100) &&
        Number.isFinite(fuelPricePerL) &&
        distanceKm > 0 &&
        fuelEconomyLPer100 > 0 &&
        fuelPricePerL > 0;

      let advancedHtml = "";
      if (hasAdvanced) {
        const estimatedLiters = (distanceKm * fuelEconomyLPer100) / 100;
        const estimatedCost = estimatedLiters * fuelPricePerL;

        const diff = totalFuelCost - estimatedCost;
        const diffAbs = Math.abs(diff);
        const diffPct = estimatedCost > 0 ? (diffAbs / estimatedCost) * 100 : 0;

        const diffLabel = diff >= 0 ? "higher" : "lower";

        const costPerKmActual = distanceKm > 0 ? totalFuelCost / distanceKm : NaN;
        const costPerKmEstimate = distanceKm > 0 ? estimatedCost / distanceKm : NaN;

        advancedHtml = `
          <hr class="result-sep">
          <p><strong>Sanity-check estimate (optional inputs):</strong></p>
          <ul>
            <li><strong>Estimated fuel used:</strong> ${formatNumberTwoDecimals(estimatedLiters)} L</li>
            <li><strong>Estimated fuel cost:</strong> ${formatNumberTwoDecimals(estimatedCost)}</li>
            <li><strong>Actual vs estimate:</strong> Actual is ${formatNumberTwoDecimals(diffAbs)} (${formatNumberTwoDecimals(diffPct)}%) ${diffLabel} than the estimate</li>
            <li><strong>Cost per km (actual):</strong> ${formatNumberTwoDecimals(costPerKmActual)}</li>
            <li><strong>Cost per km (estimate):</strong> ${formatNumberTwoDecimals(costPerKmEstimate)}</li>
          </ul>
          <p class="result-note">If the gap is large, check for missing receipts, non-fuel items, wrong units, detours, or heavy traffic. The split still uses the actual total you entered.</p>
        `;
      } else {
        advancedHtml = `
          <hr class="result-sep">
          <p class="result-note">Optional sanity-check: add distance, fuel economy (L/100 km), and fuel price per liter to estimate liters used and compare your total against an expected cost.</p>
        `;
      }

      // Build output HTML
      const resultHtml = `
        <p><strong>Per-person fuel share:</strong> ${formatNumberTwoDecimals(perPerson)}</p>
        <ul>
          <li><strong>Total fuel spend:</strong> ${formatNumberTwoDecimals(totalFuelCost)}</li>
          <li><strong>People splitting:</strong> ${peopleCount}</li>
          <li><strong>Split share:</strong> ${formatNumberTwoDecimals(100 / peopleCount)}% each</li>
        </ul>
        ${advancedHtml}
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
      const message = "Fuel Split Calculator (Group Travel) - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
