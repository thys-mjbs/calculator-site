document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const unitMode = document.getElementById("unitMode");

  const modeMetric = document.getElementById("modeMetric");
  const modeImperial = document.getElementById("modeImperial");

  const distancePerYearKm = document.getElementById("distancePerYearKm");
  const fuelEconomyLper100 = document.getElementById("fuelEconomyLper100");
  const fuelPricePerLiter = document.getElementById("fuelPricePerLiter");

  const distancePerYearMiles = document.getElementById("distancePerYearMiles");
  const fuelEconomyMpg = document.getElementById("fuelEconomyMpg");
  const fuelPricePerGallon = document.getElementById("fuelPricePerGallon");

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
  attachLiveFormatting(distancePerYearKm);
  attachLiveFormatting(fuelEconomyLper100);
  attachLiveFormatting(fuelPricePerLiter);

  attachLiveFormatting(distancePerYearMiles);
  attachLiveFormatting(fuelEconomyMpg);
  attachLiveFormatting(fuelPricePerGallon);

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
    if (modeMetric) modeMetric.classList.add("hidden");
    if (modeImperial) modeImperial.classList.add("hidden");

    if (mode === "imperial") {
      if (modeImperial) modeImperial.classList.remove("hidden");
    } else {
      if (modeMetric) modeMetric.classList.remove("hidden");
    }

    clearResult();
  }

  if (unitMode) {
    showMode(unitMode.value);
    unitMode.addEventListener("change", function () {
      showMode(unitMode.value);
    });
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

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const mode = unitMode ? unitMode.value : "metric";

      if (mode === "imperial") {
        if (!distancePerYearMiles || !fuelEconomyMpg || !fuelPricePerGallon) return;

        const miles = toNumber(distancePerYearMiles.value);
        const mpg = toNumber(fuelEconomyMpg.value);
        const pricePerGallon = toNumber(fuelPricePerGallon.value);

        if (!validatePositive(miles, "distance per year (miles)")) return;
        if (!validatePositive(mpg, "fuel economy (mpg)")) return;
        if (!validatePositive(pricePerGallon, "fuel price per gallon")) return;

        const gallonsUsed = miles / mpg;
        const annualCost = gallonsUsed * pricePerGallon;

        const monthlyCost = annualCost / 12;
        const weeklyCost = annualCost / 52;

        const costPerMile = annualCost / miles;

        const resultHtml =
          `<p><strong>Estimated fuel used (per year):</strong> ${formatNumberTwoDecimals(gallonsUsed)} gallons</p>` +
          `<p><strong>Estimated fuel cost (per year):</strong> ${formatNumberTwoDecimals(annualCost)}</p>` +
          `<p><strong>Estimated fuel cost (per month):</strong> ${formatNumberTwoDecimals(monthlyCost)}</p>` +
          `<p><strong>Estimated fuel cost (per week):</strong> ${formatNumberTwoDecimals(weeklyCost)}</p>` +
          `<p><strong>Estimated fuel cost (per mile):</strong> ${formatNumberTwoDecimals(costPerMile)}</p>`;

        setResultSuccess(resultHtml);
        return;
      }

      // Metric default
      if (!distancePerYearKm || !fuelEconomyLper100 || !fuelPricePerLiter) return;

      const km = toNumber(distancePerYearKm.value);
      const lPer100 = toNumber(fuelEconomyLper100.value);
      const pricePerLiter = toNumber(fuelPricePerLiter.value);

      if (!validatePositive(km, "distance per year (km)")) return;
      if (!validatePositive(lPer100, "fuel economy (L/100 km)")) return;
      if (!validatePositive(pricePerLiter, "fuel price per liter")) return;

      const litersUsed = (km / 100) * lPer100;
      const annualCost = litersUsed * pricePerLiter;

      const monthlyCost = annualCost / 12;
      const weeklyCost = annualCost / 52;

      const costPer100km = lPer100 * pricePerLiter;
      const costPerKm = annualCost / km;

      const resultHtml =
        `<p><strong>Estimated fuel used (per year):</strong> ${formatNumberTwoDecimals(litersUsed)} liters</p>` +
        `<p><strong>Estimated fuel cost (per year):</strong> ${formatNumberTwoDecimals(annualCost)}</p>` +
        `<p><strong>Estimated fuel cost (per month):</strong> ${formatNumberTwoDecimals(monthlyCost)}</p>` +
        `<p><strong>Estimated fuel cost (per week):</strong> ${formatNumberTwoDecimals(weeklyCost)}</p>` +
        `<p><strong>Estimated fuel cost (per 100 km):</strong> ${formatNumberTwoDecimals(costPer100km)}</p>` +
        `<p><strong>Estimated fuel cost (per km):</strong> ${formatNumberTwoDecimals(costPerKm)}</p>`;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Annual Fuel Cost Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
