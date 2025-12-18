document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const currencySymbol = document.getElementById("currencySymbol");

  const modeSelect = document.getElementById("modeSelect");
  const modeBlockMetric = document.getElementById("modeBlockMetric");
  const modeBlockImperial = document.getElementById("modeBlockImperial");

  const annualDistanceKm = document.getElementById("annualDistanceKm");
  const efficiencyKmPerL = document.getElementById("efficiencyKmPerL");
  const fuelPricePerL = document.getElementById("fuelPricePerL");

  const annualDistanceMiles = document.getElementById("annualDistanceMiles");
  const efficiencyMpg = document.getElementById("efficiencyMpg");
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

  attachLiveFormatting(annualDistanceKm);
  attachLiveFormatting(efficiencyKmPerL);
  attachLiveFormatting(fuelPricePerL);

  attachLiveFormatting(annualDistanceMiles);
  attachLiveFormatting(efficiencyMpg);
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
    if (modeBlockMetric) modeBlockMetric.classList.add("hidden");
    if (modeBlockImperial) modeBlockImperial.classList.add("hidden");

    if (mode === "imperial") {
      if (modeBlockImperial) modeBlockImperial.classList.remove("hidden");
    } else {
      if (modeBlockMetric) modeBlockMetric.classList.remove("hidden");
    }

    clearResult();
  }

  if (modeSelect) {
    showMode(modeSelect.value);
    modeSelect.addEventListener("change", function () {
      showMode(modeSelect.value);
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

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const mode = modeSelect ? modeSelect.value : "metric";

      const symbolRaw = currencySymbol ? String(currencySymbol.value || "").trim() : "";
      const symbol = symbolRaw.length > 0 ? symbolRaw : "$";

      let distance = NaN;
      let efficiency = NaN;
      let price = NaN;

      if (mode === "imperial") {
        distance = toNumber(annualDistanceMiles ? annualDistanceMiles.value : "");
        efficiency = toNumber(efficiencyMpg ? efficiencyMpg.value : "");
        price = toNumber(fuelPricePerGallon ? fuelPricePerGallon.value : "");
      } else {
        distance = toNumber(annualDistanceKm ? annualDistanceKm.value : "");
        efficiency = toNumber(efficiencyKmPerL ? efficiencyKmPerL.value : "");
        price = toNumber(fuelPricePerL ? fuelPricePerL.value : "");
      }

      if (!validatePositive(distance, mode === "imperial" ? "annual distance (miles)" : "annual distance (km)")) return;
      if (!validatePositive(efficiency, mode === "imperial" ? "fuel efficiency (mpg)" : "fuel efficiency (km per litre)")) return;
      if (!validateNonNegative(price, mode === "imperial" ? "fuel price (per gallon)" : "fuel price (per litre)")) return;

      const fuelUsed = distance / efficiency;
      const annualCost = fuelUsed * price;
      const monthlyCost = annualCost / 12;
      const unitCost = annualCost / distance;

      const distanceUnit = mode === "imperial" ? "miles" : "km";
      const fuelUnit = mode === "imperial" ? "gallons" : "litres";
      const perUnitLabel = mode === "imperial" ? "per mile" : "per km";

      const annualCostFmt = symbol + formatNumberTwoDecimals(annualCost);
      const monthlyCostFmt = symbol + formatNumberTwoDecimals(monthlyCost);
      const unitCostFmt = symbol + formatNumberTwoDecimals(unitCost);

      const fuelUsedFmt = formatNumberTwoDecimals(fuelUsed);

      const resultHtml = `
        <p><strong>Estimated annual fuel cost:</strong> ${annualCostFmt}</p>
        <p><strong>Estimated monthly fuel cost:</strong> ${monthlyCostFmt}</p>
        <p><strong>Cost ${perUnitLabel}:</strong> ${unitCostFmt}</p>
        <p><strong>Estimated fuel used:</strong> ${fuelUsedFmt} ${fuelUnit} per year</p>
        <p><em>Based on ${formatNumberTwoDecimals(distance)} ${distanceUnit} per year, efficiency ${formatNumberTwoDecimals(efficiency)}, and fuel price ${symbol}${formatNumberTwoDecimals(price)}.</em></p>
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
      const message = "Annual Fuel Cost Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
