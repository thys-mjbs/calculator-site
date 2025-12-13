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

  const metricBlock = document.getElementById("metricBlock");
  const distanceKm = document.getElementById("distanceKm");
  const consumptionLper100 = document.getElementById("consumptionLper100");
  const pricePerLitre = document.getElementById("pricePerLitre");

  const imperialBlock = document.getElementById("imperialBlock");
  const distanceMiles = document.getElementById("distanceMiles");
  const mpg = document.getElementById("mpg");
  const pricePerGallon = document.getElementById("pricePerGallon");

  const tripType = document.getElementById("tripType");
  const passengers = document.getElementById("passengers");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(distanceKm);
  attachLiveFormatting(consumptionLper100);
  attachLiveFormatting(pricePerLitre);

  attachLiveFormatting(distanceMiles);
  attachLiveFormatting(mpg);
  attachLiveFormatting(pricePerGallon);

  attachLiveFormatting(passengers);

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
    if (metricBlock) metricBlock.classList.add("hidden");
    if (imperialBlock) imperialBlock.classList.add("hidden");

    if (mode === "imperial") {
      if (imperialBlock) imperialBlock.classList.remove("hidden");
    } else {
      if (metricBlock) metricBlock.classList.remove("hidden");
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

  function validateNonNegative(value, fieldLabel) {
    if (!Number.isFinite(value) || value < 0) {
      setResultError("Enter a valid " + fieldLabel + " (0 or higher).");
      return false;
    }
    return true;
  }

  function validateOptionalNonNegativeInt(value, fieldLabel) {
    if (!Number.isFinite(value)) {
      setResultError("Enter a valid " + fieldLabel + " (0 or higher).");
      return false;
    }
    if (value < 0) {
      setResultError("Enter a valid " + fieldLabel + " (0 or higher).");
      return false;
    }
    if (!Number.isInteger(value)) {
      setResultError(fieldLabel + " must be a whole number.");
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

      const multiplier = tripType && tripType.value === "roundtrip" ? 2 : 1;

      const passengerCountRaw = toNumber(passengers ? passengers.value : "");
      const passengerCount = Number.isFinite(passengerCountRaw) ? passengerCountRaw : 0;

      if (!validateOptionalNonNegativeInt(passengerCount, "passenger count")) return;

      let fuelUsed = 0;
      let totalCost = 0;
      let costPerDistance = 0;
      let fuelUnitLabel = "";
      let distanceUnitLabel = "";
      let priceUnitLabel = "";

      if (mode === "imperial") {
        const dMi = toNumber(distanceMiles ? distanceMiles.value : "");
        const mpgVal = toNumber(mpg ? mpg.value : "");
        const priceGal = toNumber(pricePerGallon ? pricePerGallon.value : "");

        if (!validatePositive(dMi, "distance (miles)")) return;
        if (!validatePositive(mpgVal, "fuel economy (MPG)")) return;
        if (!validatePositive(priceGal, "fuel price (per gallon)")) return;

        const tripMiles = dMi * multiplier;
        const gallonsUsed = tripMiles / mpgVal;
        const cost = gallonsUsed * priceGal;

        fuelUsed = gallonsUsed;
        totalCost = cost;
        costPerDistance = cost / tripMiles;

        fuelUnitLabel = "gallons";
        distanceUnitLabel = "mile";
        priceUnitLabel = "per gallon";
      } else {
        const dKm = toNumber(distanceKm ? distanceKm.value : "");
        const lPer100 = toNumber(consumptionLper100 ? consumptionLper100.value : "");
        const priceL = toNumber(pricePerLitre ? pricePerLitre.value : "");

        if (!validatePositive(dKm, "distance (km)")) return;
        if (!validatePositive(lPer100, "fuel consumption (L/100km)")) return;
        if (!validatePositive(priceL, "fuel price (per litre)")) return;

        const tripKm = dKm * multiplier;
        const litresUsed = (tripKm * lPer100) / 100;
        const cost = litresUsed * priceL;

        fuelUsed = litresUsed;
        totalCost = cost;
        costPerDistance = cost / tripKm;

        fuelUnitLabel = "litres";
        distanceUnitLabel = "km";
        priceUnitLabel = "per litre";
      }

      const perPerson = passengerCount > 0 ? totalCost / passengerCount : null;

      const resultHtmlParts = [];
      resultHtmlParts.push(
        `<p><strong>Total fuel used:</strong> ${formatNumberTwoDecimals(fuelUsed)} ${fuelUnitLabel}</p>`
      );
      resultHtmlParts.push(
        `<p><strong>Total fuel cost:</strong> ${formatNumberTwoDecimals(totalCost)} (your currency)</p>`
      );
      resultHtmlParts.push(
        `<p><strong>Cost per ${distanceUnitLabel}:</strong> ${formatNumberTwoDecimals(costPerDistance)} (your currency)</p>`
      );

      if (perPerson !== null) {
        resultHtmlParts.push(
          `<p><strong>Cost per person:</strong> ${formatNumberTwoDecimals(perPerson)} (your currency)</p>`
        );
      }

      const resultHtml = resultHtmlParts.join("");

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
