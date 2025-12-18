document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const distanceInput = document.getElementById("distanceInput");
  const distanceUnit = document.getElementById("distanceUnit");
  const efficiencyInput = document.getElementById("efficiencyInput");
  const efficiencyUnit = document.getElementById("efficiencyUnit");
  const fuelPriceInput = document.getElementById("fuelPriceInput");
  const roundTripCheckbox = document.getElementById("roundTripCheckbox");
  const extraPercentInput = document.getElementById("extraPercentInput");
  const passengersInput = document.getElementById("passengersInput");

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
  attachLiveFormatting(distanceInput);
  attachLiveFormatting(efficiencyInput);
  attachLiveFormatting(fuelPriceInput);
  attachLiveFormatting(extraPercentInput);
  attachLiveFormatting(passengersInput);

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
      const rawDistance = toNumber(distanceInput ? distanceInput.value : "");
      const rawEfficiency = toNumber(efficiencyInput ? efficiencyInput.value : "");
      const fuelPricePerLitre = toNumber(fuelPriceInput ? fuelPriceInput.value : "");
      const extraPercent = toNumber(extraPercentInput ? extraPercentInput.value : "");
      const passengersRaw = toNumber(passengersInput ? passengersInput.value : "");

      // Basic existence guard
      if (
        !distanceInput ||
        !distanceUnit ||
        !efficiencyInput ||
        !efficiencyUnit ||
        !fuelPriceInput ||
        !roundTripCheckbox ||
        !extraPercentInput ||
        !passengersInput
      ) {
        return;
      }

      // Validation (required fields)
      if (!validatePositive(rawDistance, "trip distance")) return;
      if (!validatePositive(rawEfficiency, "fuel efficiency")) return;
      if (!validateNonNegative(fuelPricePerLitre, "fuel price per litre")) return;

      // Optional inputs with safe defaults
      const detourPct = Number.isFinite(extraPercent) ? extraPercent : 0;
      if (detourPct < 0) {
        setResultError("Extra distance percentage must be 0 or higher.");
        return;
      }
      if (detourPct > 200) {
        setResultError("Extra distance percentage looks too high. Enter a smaller, realistic percentage.");
        return;
      }

      let passengers = 1;
      if (Number.isFinite(passengersRaw) && passengersRaw > 0) {
        passengers = Math.floor(passengersRaw);
        if (passengers < 1) passengers = 1;
        if (passengers > 100) {
          setResultError("People sharing cost looks too high. Enter a realistic number.");
          return;
        }
      }

      // Convert distance to kilometres
      const distanceUnitValue = distanceUnit.value;
      let distanceKm = rawDistance;
      if (distanceUnitValue === "mi") {
        distanceKm = rawDistance * 1.609344;
      }

      // Apply detour buffer
      if (detourPct > 0) {
        distanceKm = distanceKm * (1 + detourPct / 100);
      }

      // Apply round trip
      const isRoundTrip = !!roundTripCheckbox.checked;
      if (isRoundTrip) {
        distanceKm = distanceKm * 2;
      }

      // Convert efficiency to litres per 100km
      const effUnit = efficiencyUnit.value;
      let lPer100km = 0;

      if (effUnit === "l_per_100km") {
        lPer100km = rawEfficiency;
      } else if (effUnit === "km_per_l") {
        // L/100km = 100 / (km/L)
        lPer100km = 100 / rawEfficiency;
      } else if (effUnit === "mpg_us") {
        // L/100km = 235.214583 / mpg (US)
        lPer100km = 235.214583 / rawEfficiency;
      } else if (effUnit === "mpg_uk") {
        // L/100km = 282.480936 / mpg (UK)
        lPer100km = 282.480936 / rawEfficiency;
      } else {
        setResultError("Choose a valid fuel efficiency unit.");
        return;
      }

      if (!Number.isFinite(lPer100km) || lPer100km <= 0) {
        setResultError("Fuel efficiency converts to an invalid value. Check your inputs.");
        return;
      }

      if (lPer100km > 60) {
        setResultError("Fuel efficiency looks unrealistic (very high consumption). Check the unit and value.");
        return;
      }

      // Calculation logic
      const litresUsed = (distanceKm * lPer100km) / 100;
      const totalCost = litresUsed * fuelPricePerLitre;

      const costPerKm = distanceKm > 0 ? totalCost / distanceKm : 0;
      const costPerPerson = passengers > 0 ? totalCost / passengers : totalCost;

      // Build output HTML
      const distanceShown = formatNumberTwoDecimals(distanceKm);
      const litresShown = formatNumberTwoDecimals(litresUsed);
      const totalCostShown = formatNumberTwoDecimals(totalCost);
      const perKmShown = formatNumberTwoDecimals(costPerKm);
      const perPersonShown = formatNumberTwoDecimals(costPerPerson);

      const detourNote =
        detourPct > 0
          ? `<li><strong>Detour buffer applied:</strong> ${formatNumberTwoDecimals(detourPct)}%</li>`
          : `<li><strong>Detour buffer applied:</strong> None</li>`;

      const roundTripNote =
        isRoundTrip
          ? `<li><strong>Trip type:</strong> Round trip (distance doubled)</li>`
          : `<li><strong>Trip type:</strong> One way</li>`;

      const splitNote =
        passengers > 1
          ? `<li><strong>Cost per person (split):</strong> ${perPersonShown}</li>`
          : `<li><strong>Cost per person (split):</strong> Not split</li>`;

      const resultHtml = `
        <p><strong>Estimated trip fuel cost:</strong> ${totalCostShown}</p>
        <ul>
          <li><strong>Estimated distance used:</strong> ${distanceShown} km</li>
          ${roundTripNote}
          ${detourNote}
          <li><strong>Estimated fuel used:</strong> ${litresShown} L</li>
          <li><strong>Estimated cost per km:</strong> ${perKmShown}</li>
          ${splitNote}
        </ul>
        <p><strong>Practical tip:</strong> If you are budgeting, use a slightly worse efficiency (higher L/100km or lower mpg) to avoid underestimating the fuel cost.</p>
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
      const message = "Fuel Cost per Trip Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
