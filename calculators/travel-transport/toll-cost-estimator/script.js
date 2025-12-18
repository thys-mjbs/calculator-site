document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const tollPlazasInput = document.getElementById("tollPlazas");
  const avgTollInput = document.getElementById("avgToll");
  const vehicleMultiplierInput = document.getElementById("vehicleMultiplier");
  const tripFactorInput = document.getElementById("tripFactor");
  const discountPercentInput = document.getElementById("discountPercent");
  const distanceKmInput = document.getElementById("distanceKm");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(tollPlazasInput);
  attachLiveFormatting(avgTollInput);
  attachLiveFormatting(vehicleMultiplierInput);
  attachLiveFormatting(tripFactorInput);
  attachLiveFormatting(discountPercentInput);
  attachLiveFormatting(distanceKmInput);

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
      const tollPlazasRaw = toNumber(tollPlazasInput ? tollPlazasInput.value : "");
      const avgTollRaw = toNumber(avgTollInput ? avgTollInput.value : "");
      const vehicleMultiplierRaw = toNumber(vehicleMultiplierInput ? vehicleMultiplierInput.value : "");
      const tripFactorRaw = toNumber(tripFactorInput ? tripFactorInput.value : "");
      const discountPercentRaw = toNumber(discountPercentInput ? discountPercentInput.value : "");
      const distanceKmRaw = toNumber(distanceKmInput ? distanceKmInput.value : "");

      // Basic existence guard
      if (!tollPlazasInput || !avgTollInput || !vehicleMultiplierInput || !tripFactorInput || !discountPercentInput || !distanceKmInput) {
        return;
      }

      // Required: toll plazas
      if (!Number.isFinite(tollPlazasRaw) || tollPlazasRaw < 0) {
        setResultError("Enter a valid number of toll plazas (0 or higher).");
        return;
      }

      // Treat toll plazas as whole number (but do not hard-fail decimals; just round sensibly)
      const tollPlazas = Math.round(tollPlazasRaw);

      // Optional with defaults
      const defaultAvgToll = 2.5;
      const avgToll = Number.isFinite(avgTollRaw) && avgTollRaw > 0 ? avgTollRaw : defaultAvgToll;

      const defaultVehicleMultiplier = 1.0;
      const vehicleMultiplier =
        Number.isFinite(vehicleMultiplierRaw) && vehicleMultiplierRaw > 0 ? vehicleMultiplierRaw : defaultVehicleMultiplier;

      const defaultTripFactor = 1.0;
      const tripFactor =
        Number.isFinite(tripFactorRaw) && tripFactorRaw > 0 ? tripFactorRaw : defaultTripFactor;

      const defaultDiscountPercent = 0.0;
      const discountPercent =
        Number.isFinite(discountPercentRaw) && discountPercentRaw >= 0 ? discountPercentRaw : defaultDiscountPercent;

      if (discountPercent > 100) {
        setResultError("Enter a discount percentage from 0 to 100.");
        return;
      }

      const distanceKm = Number.isFinite(distanceKmRaw) && distanceKmRaw > 0 ? distanceKmRaw : null;

      // Calculation logic
      const baseOneWay = tollPlazas * avgToll;
      const adjustedVehicle = baseOneWay * vehicleMultiplier;
      const adjustedTrips = adjustedVehicle * tripFactor;
      const discountFactor = 1 - (discountPercent / 100);
      const estimatedTotal = adjustedTrips * discountFactor;

      // Practical range (buffer)
      const bufferPercent = 15;
      const lowEstimate = estimatedTotal * (1 - bufferPercent / 100);
      const highEstimate = estimatedTotal * (1 + bufferPercent / 100);

      // Secondary insights
      const perPlaza = tollPlazas > 0 ? (estimatedTotal / tollPlazas) : 0;

      let per100KmHtml = "";
      if (distanceKm !== null) {
        const perKm = estimatedTotal / distanceKm;
        const per100Km = perKm * 100;
        per100KmHtml = `
          <p><strong>Cost per 100 km:</strong> ${formatNumberTwoDecimals(per100Km)}</p>
          <p><strong>Cost per km:</strong> ${formatNumberTwoDecimals(perKm)}</p>
        `;
      }

      const usedDefaultAvgToll = !(Number.isFinite(avgTollRaw) && avgTollRaw > 0);
      const usedDefaultVehicleMultiplier = !(Number.isFinite(vehicleMultiplierRaw) && vehicleMultiplierRaw > 0);
      const usedDefaultTripFactor = !(Number.isFinite(tripFactorRaw) && tripFactorRaw > 0);
      const usedDefaultDiscount = !(Number.isFinite(discountPercentRaw) && discountPercentRaw >= 0);

      const assumptions = [];
      if (usedDefaultAvgToll) assumptions.push("Average toll per plaza defaulted to 2.50.");
      if (usedDefaultVehicleMultiplier) assumptions.push("Vehicle multiplier defaulted to 1.00.");
      if (usedDefaultTripFactor) assumptions.push("Trip factor defaulted to 1 (one-way).");
      if (usedDefaultDiscount) assumptions.push("Discount defaulted to 0%.");
      if (distanceKm === null) assumptions.push("Distance was not provided, so per-distance costs were not shown.");

      const assumptionsHtml = assumptions.length
        ? `<ul>${assumptions.map((a) => `<li>${a}</li>`).join("")}</ul>`
        : "<p>No defaults were applied.</p>";

      // Build output HTML
      const resultHtml = `
        <p><strong>Estimated total toll cost:</strong> ${formatNumberTwoDecimals(estimatedTotal)}</p>
        <p><strong>Estimated range (±${bufferPercent}%):</strong> ${formatNumberTwoDecimals(lowEstimate)} to ${formatNumberTwoDecimals(highEstimate)}</p>
        <p><strong>Inputs used:</strong> ${tollPlazas} plazas, avg ${formatNumberTwoDecimals(avgToll)} per plaza, multiplier ${formatNumberTwoDecimals(vehicleMultiplier)}, trip factor ${formatNumberTwoDecimals(tripFactor)}, discount ${formatNumberTwoDecimals(discountPercent)}%</p>
        <p><strong>Estimated cost per plaza:</strong> ${formatNumberTwoDecimals(perPlaza)}</p>
        ${per100KmHtml}
        <p><strong>Assumptions applied:</strong></p>
        ${assumptionsHtml}
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
      const message = "Toll Cost Estimator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
