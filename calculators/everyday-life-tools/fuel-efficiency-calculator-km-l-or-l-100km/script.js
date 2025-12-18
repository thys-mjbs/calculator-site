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
  const fuelLitersInput = document.getElementById("fuelLiters");
  const fuelPricePerLiterInput = document.getElementById("fuelPricePerLiter");
  const tankSizeLitersInput = document.getElementById("tankSizeLiters");

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
  attachLiveFormatting(fuelLitersInput);
  attachLiveFormatting(fuelPricePerLiterInput);
  attachLiveFormatting(tankSizeLitersInput);

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
      clearResult();

      const distanceKm = toNumber(distanceKmInput ? distanceKmInput.value : "");
      const fuelLiters = toNumber(fuelLitersInput ? fuelLitersInput.value : "");
      const fuelPricePerLiter = toNumber(
        fuelPricePerLiterInput ? fuelPricePerLiterInput.value : ""
      );
      const tankSizeLiters = toNumber(
        tankSizeLitersInput ? tankSizeLitersInput.value : ""
      );

      if (!distanceKmInput || !fuelLitersInput) return;

      if (!validatePositive(distanceKm, "distance (km)")) return;
      if (!validatePositive(fuelLiters, "fuel used (liters)")) return;

      const hasFuelPrice = Number.isFinite(fuelPricePerLiter) && fuelPricePerLiterInput && fuelPricePerLiterInput.value.trim() !== "";
      const hasTankSize = Number.isFinite(tankSizeLiters) && tankSizeLitersInput && tankSizeLitersInput.value.trim() !== "";

      if (hasFuelPrice && !validateNonNegative(fuelPricePerLiter, "fuel price per liter")) return;
      if (hasTankSize && !validatePositive(tankSizeLiters, "tank size (liters)")) return;

      const kmPerLiter = distanceKm / fuelLiters;
      const litersPer100Km = (fuelLiters / distanceKm) * 100;

      let interpretation = "";
      if (Number.isFinite(litersPer100Km)) {
        if (litersPer100Km <= 6) interpretation = "Very efficient for typical passenger vehicles.";
        else if (litersPer100Km <= 8) interpretation = "Good efficiency for mixed driving.";
        else if (litersPer100Km <= 11) interpretation = "Average efficiency for many vehicles.";
        else interpretation = "Higher fuel use than average; conditions or driving style may be contributing.";
      }

      let costBlock = "";
      if (hasFuelPrice) {
        const totalFuelCost = fuelLiters * fuelPricePerLiter;
        const costPerKm = totalFuelCost / distanceKm;
        const costPer100Km = costPerKm * 100;

        costBlock = `
          <p><strong>Estimated fuel cost:</strong></p>
          <ul>
            <li><strong>Cost per km:</strong> ${formatNumberTwoDecimals(costPerKm)}</li>
            <li><strong>Cost per 100 km:</strong> ${formatNumberTwoDecimals(costPer100Km)}</li>
          </ul>
        `;
      }

      let rangeBlock = "";
      if (hasTankSize) {
        const estimatedRangeKm = kmPerLiter * tankSizeLiters;
        rangeBlock = `
          <p><strong>Estimated range (from tank size):</strong> ${formatNumberTwoDecimals(estimatedRangeKm)} km</p>
        `;
      }

      const resultHtml = `
        <p><strong>Fuel efficiency results:</strong></p>
        <ul>
          <li><strong>km/l:</strong> ${formatNumberTwoDecimals(kmPerLiter)}</li>
          <li><strong>l/100km:</strong> ${formatNumberTwoDecimals(litersPer100Km)}</li>
        </ul>
        ${interpretation ? `<p><strong>Interpretation:</strong> ${interpretation}</p>` : ""}
        ${costBlock}
        ${rangeBlock}
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
      const message = "Fuel Efficiency Calculator (km/l or l/100km) - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
