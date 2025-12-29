document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const tripDays = document.getElementById("tripDays");
  const distanceKm = document.getElementById("distanceKm");
  const fuelPricePerLitre = document.getElementById("fuelPricePerLitre");
  const fuelEconomyLper100 = document.getElementById("fuelEconomyLper100");

  const accomPerNight = document.getElementById("accomPerNight");
  const foodPerDay = document.getElementById("foodPerDay");
  const activitiesPerDay = document.getElementById("activitiesPerDay");
  const otherPerDay = document.getElementById("otherPerDay");

  const tollsParkingTotal = document.getElementById("tollsParkingTotal");
  const oneOffCostsTotal = document.getElementById("oneOffCostsTotal");
  const travelersCount = document.getElementById("travelersCount");

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
  attachLiveFormatting(tripDays);
  attachLiveFormatting(distanceKm);
  attachLiveFormatting(fuelPricePerLitre);
  attachLiveFormatting(fuelEconomyLper100);
  attachLiveFormatting(accomPerNight);
  attachLiveFormatting(foodPerDay);
  attachLiveFormatting(activitiesPerDay);
  attachLiveFormatting(otherPerDay);
  attachLiveFormatting(tollsParkingTotal);
  attachLiveFormatting(oneOffCostsTotal);
  attachLiveFormatting(travelersCount);

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
      const days = toNumber(tripDays ? tripDays.value : "");
      const km = toNumber(distanceKm ? distanceKm.value : "");
      const pricePerLitre = toNumber(fuelPricePerLitre ? fuelPricePerLitre.value : "");
      const lPer100 = toNumber(fuelEconomyLper100 ? fuelEconomyLper100.value : "");

      const accomNight = toNumber(accomPerNight ? accomPerNight.value : "");
      const foodDay = toNumber(foodPerDay ? foodPerDay.value : "");
      const activitiesDay = toNumber(activitiesPerDay ? activitiesPerDay.value : "");
      const otherDay = toNumber(otherPerDay ? otherPerDay.value : "");

      const tollsTotal = toNumber(tollsParkingTotal ? tollsParkingTotal.value : "");
      const oneOffTotal = toNumber(oneOffCostsTotal ? oneOffCostsTotal.value : "");
      const travelersRaw = toNumber(travelersCount ? travelersCount.value : "");

      // Basic existence guard
      if (!tripDays || !distanceKm || !fuelPricePerLitre || !fuelEconomyLper100) return;

      // Required validation
      if (!validateWholeNumber(days, "trip length (days)")) return;
      if (!validatePositive(km, "total distance (km)")) return;
      if (!validatePositive(pricePerLitre, "fuel price (per litre)")) return;
      if (!validatePositive(lPer100, "fuel economy (litres per 100 km)")) return;

      // Optional inputs: treat blanks as 0 (or 1 for travellers)
      const accomNightSafe = Number.isFinite(accomNight) ? accomNight : 0;
      const foodDaySafe = Number.isFinite(foodDay) ? foodDay : 0;
      const activitiesDaySafe = Number.isFinite(activitiesDay) ? activitiesDay : 0;
      const otherDaySafe = Number.isFinite(otherDay) ? otherDay : 0;

      const tollsTotalSafe = Number.isFinite(tollsTotal) ? tollsTotal : 0;
      const oneOffTotalSafe = Number.isFinite(oneOffTotal) ? oneOffTotal : 0;

      // Optional validation (only if provided)
      if (!validateNonNegative(accomNightSafe, "accommodation (per night)")) return;
      if (!validateNonNegative(foodDaySafe, "food (per day)")) return;
      if (!validateNonNegative(activitiesDaySafe, "activities (per day)")) return;
      if (!validateNonNegative(otherDaySafe, "other daily costs (per day)")) return;
      if (!validateNonNegative(tollsTotalSafe, "tolls and parking (total)")) return;
      if (!validateNonNegative(oneOffTotalSafe, "one-off costs (total)")) return;

      let travelers = 1;
      if (Number.isFinite(travelersRaw) && travelersRaw > 0) {
        travelers = Math.floor(travelersRaw);
        if (travelers < 1) travelers = 1;
      }

      // Calculation logic
      const litresUsed = (km * lPer100) / 100;
      const fuelCostTotal = litresUsed * pricePerLitre;

      const variableTripTotal = fuelCostTotal + tollsTotalSafe + oneOffTotalSafe;

      const dailyFixed = accomNightSafe + foodDaySafe + activitiesDaySafe + otherDaySafe;
      const dailyFixedTotal = dailyFixed * days;

      const tripTotal = variableTripTotal + dailyFixedTotal;

      const dailyAverage = tripTotal / days;
      const variablePerDay = variableTripTotal / days;
      const fuelPerDay = fuelCostTotal / days;

      const perPersonPerDay = travelers > 0 ? dailyAverage / travelers : dailyAverage;

      const currency = function (n) {
        return formatNumberTwoDecimals(n);
      };

      const resultHtml = `
        <p><strong>Estimated daily cost (average):</strong> ${currency(dailyAverage)}</p>
        <p><strong>Estimated total trip cost:</strong> ${currency(tripTotal)}</p>
        <hr>
        <p><strong>Per-person daily estimate:</strong> ${currency(perPersonPerDay)} <span style="font-weight:400;">(using ${travelers} traveller${travelers === 1 ? "" : "s"})</span></p>
        <hr>
        <p><strong>Fuel (total):</strong> ${currency(fuelCostTotal)} <span style="font-weight:400;">(${currency(fuelPerDay)} per day)</span></p>
        <p><strong>Trip totals (tolls, parking, one-off):</strong> ${currency(tollsTotalSafe + oneOffTotalSafe)} <span style="font-weight:400;">(${currency((tollsTotalSafe + oneOffTotalSafe) / days)} per day)</span></p>
        <p><strong>Daily spending (accommodation + food + activities + other):</strong> ${currency(dailyFixed)} <span style="font-weight:400;">(${currency(dailyFixedTotal)} over the trip)</span></p>
        <hr>
        <p><strong>Quick check:</strong> Variable costs average ${currency(variablePerDay)} per day. If you want a safer budget, round your daily total up.</p>
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
      const message = "Road Trip Daily Cost Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
