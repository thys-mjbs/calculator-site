document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const itemPrice = document.getElementById("itemPrice");
  const wearsPerMonth = document.getElementById("wearsPerMonth");
  const monthsOwned = document.getElementById("monthsOwned");
  const resaleValue = document.getElementById("resaleValue");
  const alterationCost = document.getElementById("alterationCost");
  const careCostPerWear = document.getElementById("careCostPerWear");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(itemPrice);
  attachLiveFormatting(wearsPerMonth);
  attachLiveFormatting(monthsOwned);
  attachLiveFormatting(resaleValue);
  attachLiveFormatting(alterationCost);
  attachLiveFormatting(careCostPerWear);

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

  function clampMin(value, minValue) {
    if (!Number.isFinite(value)) return minValue;
    return value < minValue ? minValue : value;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const price = toNumber(itemPrice ? itemPrice.value : "");
      const wearsMonth = toNumber(wearsPerMonth ? wearsPerMonth.value : "");
      const months = toNumber(monthsOwned ? monthsOwned.value : "");
      const resale = toNumber(resaleValue ? resaleValue.value : "");
      const alterations = toNumber(alterationCost ? alterationCost.value : "");
      const carePerWear = toNumber(careCostPerWear ? careCostPerWear.value : "");

      // Basic existence guard
      if (!itemPrice || !wearsPerMonth || !monthsOwned) return;

      // Validation (required)
      if (!validatePositive(price, "item price")) return;
      if (!validatePositive(wearsMonth, "wears per month")) return;
      if (!validatePositive(months, "months of ownership")) return;

      // Optional fields: treat empty/invalid as 0
      const resaleSafe = Number.isFinite(resale) ? resale : 0;
      const alterationsSafe = Number.isFinite(alterations) ? alterations : 0;
      const carePerWearSafe = Number.isFinite(carePerWear) ? carePerWear : 0;

      if (!validateNonNegative(resaleSafe, "resale value")) return;
      if (!validateNonNegative(alterationsSafe, "alterations or repairs")) return;
      if (!validateNonNegative(carePerWearSafe, "care cost per wear")) return;

      // Compute total wears (rounded down to a sensible integer)
      const totalWearsRaw = wearsMonth * months;
      if (!Number.isFinite(totalWearsRaw) || totalWearsRaw <= 0) {
        setResultError("Enter wear frequency and ownership duration that result in at least 1 total wear.");
        return;
      }
      const totalWears = Math.max(1, Math.round(totalWearsRaw));

      // Net cost = price + alterations + care-per-wear*wears - resale
      const careTotal = carePerWearSafe * totalWears;
      const netCost = (price + alterationsSafe + careTotal) - resaleSafe;

      // If resale is unrealistically high, net cost can go negative; clamp to 0 for interpretability
      const netCostClamped = clampMin(netCost, 0);

      const costPerWear = netCostClamped / totalWears;

      // Sensitivity: +/- 25% wears (based on total wears)
      const wearsLow = Math.max(1, Math.round(totalWears * 0.75));
      const wearsHigh = Math.max(1, Math.round(totalWears * 1.25));

      const netCostLow = clampMin((price + alterationsSafe + (carePerWearSafe * wearsLow)) - resaleSafe, 0);
      const netCostHigh = clampMin((price + alterationsSafe + (carePerWearSafe * wearsHigh)) - resaleSafe, 0);

      const cpwLow = netCostLow / wearsLow;
      const cpwHigh = netCostHigh / wearsHigh;

      const monthlyNetCost = netCostClamped / months;
      const annualizedNetCost = netCostClamped / (months / 12);

      const resultHtml = `
        <p><strong>Estimated cost per wear:</strong> ${formatNumberTwoDecimals(costPerWear)}</p>
        <p><strong>Estimated total wears:</strong> ${formatInputWithCommas(String(totalWears))}</p>
        <p><strong>Estimated net cost used:</strong> ${formatNumberTwoDecimals(netCostClamped)}</p>
        <p><strong>Cost per month (net):</strong> ${formatNumberTwoDecimals(monthlyNetCost)}</p>
        <p><strong>Annualized cost (net):</strong> ${formatNumberTwoDecimals(annualizedNetCost)}</p>
        <hr>
        <p><strong>Sensitivity check (wear it less vs more):</strong></p>
        <p>
          If you wear it <strong>${formatInputWithCommas(String(wearsLow))}</strong> times instead:
          <strong>${formatNumberTwoDecimals(cpwLow)}</strong> per wear
        </p>
        <p>
          If you wear it <strong>${formatInputWithCommas(String(wearsHigh))}</strong> times instead:
          <strong>${formatNumberTwoDecimals(cpwHigh)}</strong> per wear
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
      const message = "Clothing Cost Per Wear Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
