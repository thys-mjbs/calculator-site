document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const distanceKmInput = document.getElementById("distanceKm");
  const fuelEfficiencyInput = document.getElementById("fuelEfficiency");
  const fuelPricePerLiterInput = document.getElementById("fuelPricePerLiter");

  const tripDaysInput = document.getElementById("tripDays");
  const travelersInput = document.getElementById("travelers");
  const accommodationPerNightInput = document.getElementById("accommodationPerNight");
  const foodPerDayPerPersonInput = document.getElementById("foodPerDayPerPerson");
  const tollsTotalInput = document.getElementById("tollsTotal");
  const parkingTotalInput = document.getElementById("parkingTotal");
  const activitiesTotalInput = document.getElementById("activitiesTotal");
  const contingencyPercentInput = document.getElementById("contingencyPercent");
  const currencySymbolInput = document.getElementById("currencySymbol");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(distanceKmInput);
  attachLiveFormatting(fuelEfficiencyInput);
  attachLiveFormatting(fuelPricePerLiterInput);
  attachLiveFormatting(tripDaysInput);
  attachLiveFormatting(travelersInput);
  attachLiveFormatting(accommodationPerNightInput);
  attachLiveFormatting(foodPerDayPerPersonInput);
  attachLiveFormatting(tollsTotalInput);
  attachLiveFormatting(parkingTotalInput);
  attachLiveFormatting(activitiesTotalInput);
  attachLiveFormatting(contingencyPercentInput);

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

  function sanitizeCurrencySymbol(raw) {
    const s = (raw || "").trim();
    if (!s) return "R";
    const cleaned = s.replace(/[^A-Za-z$€£¥₩₽₹₺₫₦₱₲₴₵₡₸₮₠₢₣₤₥₧₨₩₪₭₯₰₳₴₶₷₸₺₻₼₽₾₿]/g, "");
    return cleaned.slice(0, 3) || "R";
  }

  function formatMoney(currency, amount) {
    return currency + " " + formatNumberTwoDecimals(amount);
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse required inputs using toNumber() (from /scripts/main.js)
      const distanceKm = toNumber(distanceKmInput ? distanceKmInput.value : "");
      const fuelEfficiency = toNumber(fuelEfficiencyInput ? fuelEfficiencyInput.value : "");
      const fuelPricePerLiter = toNumber(fuelPricePerLiterInput ? fuelPricePerLiterInput.value : "");

      // Guard
      if (!distanceKmInput || !fuelEfficiencyInput || !fuelPricePerLiterInput) return;

      // Validation (required)
      if (!validatePositive(distanceKm, "total driving distance (km)")) return;
      if (!validatePositive(fuelEfficiency, "fuel efficiency (L/100 km)")) return;
      if (!validatePositive(fuelPricePerLiter, "fuel price per litre")) return;

      // Optional inputs (defaults)
      let tripDays = toNumber(tripDaysInput ? tripDaysInput.value : "");
      if (!Number.isFinite(tripDays) || tripDays <= 0) tripDays = 1;
      tripDays = Math.max(1, Math.round(tripDays));

      let travelers = toNumber(travelersInput ? travelersInput.value : "");
      if (!Number.isFinite(travelers) || travelers <= 0) travelers = 1;
      travelers = Math.max(1, Math.round(travelers));

      const accommodationPerNight = toNumber(accommodationPerNightInput ? accommodationPerNightInput.value : "");
      const foodPerDayPerPerson = toNumber(foodPerDayPerPersonInput ? foodPerDayPerPersonInput.value : "");
      const tollsTotal = toNumber(tollsTotalInput ? tollsTotalInput.value : "");
      const parkingTotal = toNumber(parkingTotalInput ? parkingTotalInput.value : "");
      const activitiesTotal = toNumber(activitiesTotalInput ? activitiesTotalInput.value : "");

      let contingencyPercent = toNumber(contingencyPercentInput ? contingencyPercentInput.value : "");
      if (!Number.isFinite(contingencyPercent) || contingencyPercent < 0) contingencyPercent = 10;

      // Validate optional non-negative numeric fields (only if user typed something)
      const optionalChecks = [
        { el: accommodationPerNightInput, val: accommodationPerNight, label: "accommodation cost per night" },
        { el: foodPerDayPerPersonInput, val: foodPerDayPerPerson, label: "food cost per day (per person)" },
        { el: tollsTotalInput, val: tollsTotal, label: "tolls (total)" },
        { el: parkingTotalInput, val: parkingTotal, label: "parking (total)" },
        { el: activitiesTotalInput, val: activitiesTotal, label: "activities and attractions (total)" },
        { el: contingencyPercentInput, val: contingencyPercent, label: "contingency (%)" }
      ];

      for (let i = 0; i < optionalChecks.length; i++) {
        const item = optionalChecks[i];
        if (item.el && (item.el.value || "").trim() !== "") {
          if (!validateNonNegative(item.val, item.label)) return;
        }
      }

      // Calculation
      const fuelLiters = distanceKm * (fuelEfficiency / 100);
      const fuelCost = fuelLiters * fuelPricePerLiter;

      const nights = Math.max(tripDays - 1, 0);
      const accommodationCost = (Number.isFinite(accommodationPerNight) && accommodationPerNight > 0)
        ? nights * accommodationPerNight
        : 0;

      const foodCost = (Number.isFinite(foodPerDayPerPerson) && foodPerDayPerPerson > 0)
        ? tripDays * travelers * foodPerDayPerPerson
        : 0;

      const tolls = (Number.isFinite(tollsTotal) && tollsTotal > 0) ? tollsTotal : 0;
      const parking = (Number.isFinite(parkingTotal) && parkingTotal > 0) ? parkingTotal : 0;
      const activities = (Number.isFinite(activitiesTotal) && activitiesTotal > 0) ? activitiesTotal : 0;

      const baseTotal = fuelCost + accommodationCost + foodCost + tolls + parking + activities;
      const contingency = baseTotal * (contingencyPercent / 100);
      const total = baseTotal + contingency;

      const perPerson = total / travelers;
      const perDay = total / tripDays;
      const perKm = total / distanceKm;

      const currency = sanitizeCurrencySymbol(currencySymbolInput ? currencySymbolInput.value : "");

      // Build output HTML
      const resultHtml =
        `<p><strong>Total estimated trip budget:</strong> ${formatMoney(currency, total)}</p>` +
        `<p><strong>Fuel:</strong> ${formatMoney(currency, fuelCost)} (${formatNumberTwoDecimals(fuelLiters)} L)</p>` +
        `<p><strong>Base total (before contingency):</strong> ${formatMoney(currency, baseTotal)}</p>` +
        `<p><strong>Contingency (${formatNumberTwoDecimals(contingencyPercent)}%):</strong> ${formatMoney(currency, contingency)}</p>` +
        `<hr>` +
        `<p><strong>Cost per person:</strong> ${formatMoney(currency, perPerson)} (split across ${travelers} people)</p>` +
        `<p><strong>Cost per day:</strong> ${formatMoney(currency, perDay)} (over ${tripDays} days)</p>` +
        `<p><strong>Cost per km:</strong> ${formatMoney(currency, perKm)} (over ${formatNumberTwoDecimals(distanceKm)} km)</p>`;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Road Trip Budget Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
