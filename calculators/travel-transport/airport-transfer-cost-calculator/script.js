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
  const perKmRateInput = document.getElementById("perKmRate");
  const baseFareInput = document.getElementById("baseFare");

  const durationMinutesInput = document.getElementById("durationMinutes");
  const perMinuteRateInput = document.getElementById("perMinuteRate");
  const surgeMultiplierInput = document.getElementById("surgeMultiplier");
  const tollsInput = document.getElementById("tolls");
  const extraFeesInput = document.getElementById("extraFees");
  const tipPercentInput = document.getElementById("tipPercent");
  const passengersInput = document.getElementById("passengers");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (Not used for this calculator.)

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
  attachLiveFormatting(distanceKmInput);
  attachLiveFormatting(perKmRateInput);
  attachLiveFormatting(baseFareInput);
  attachLiveFormatting(durationMinutesInput);
  attachLiveFormatting(perMinuteRateInput);
  attachLiveFormatting(surgeMultiplierInput);
  attachLiveFormatting(tollsInput);
  attachLiveFormatting(extraFeesInput);
  attachLiveFormatting(tipPercentInput);
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
  // 4) OPTIONAL MODE HANDLING (ONLY IF USED)
  // ------------------------------------------------------------
  function showMode(mode) {
    // Not used.
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

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const distanceKm = toNumber(distanceKmInput ? distanceKmInput.value : "");
      const perKmRate = toNumber(perKmRateInput ? perKmRateInput.value : "");
      const baseFare = toNumber(baseFareInput ? baseFareInput.value : "");

      const durationMinutes = toNumber(durationMinutesInput ? durationMinutesInput.value : "");
      const perMinuteRate = toNumber(perMinuteRateInput ? perMinuteRateInput.value : "");
      const surgeMultiplierRaw = toNumber(surgeMultiplierInput ? surgeMultiplierInput.value : "");

      const tolls = toNumber(tollsInput ? tollsInput.value : "");
      const extraFees = toNumber(extraFeesInput ? extraFeesInput.value : "");
      const tipPercent = toNumber(tipPercentInput ? tipPercentInput.value : "");
      const passengersRaw = toNumber(passengersInput ? passengersInput.value : "");

      // Basic existence guard
      if (!distanceKmInput || !perKmRateInput || !baseFareInput) return;

      // Validation (required inputs)
      if (!validatePositive(distanceKm, "distance (km)")) return;
      if (!validatePositive(perKmRate, "price per km")) return;
      if (!validateNonNegative(baseFare, "base fare")) return;

      // Optional validations with defaults
      const safeDuration = Number.isFinite(durationMinutes) && durationMinutes > 0 ? durationMinutes : 0;
      const safePerMinute = Number.isFinite(perMinuteRate) && perMinuteRate > 0 ? perMinuteRate : 0;

      let surgeMultiplier = 1;
      if (Number.isFinite(surgeMultiplierRaw) && surgeMultiplierRaw > 0) surgeMultiplier = surgeMultiplierRaw;

      const safeTolls = Number.isFinite(tolls) && tolls >= 0 ? tolls : 0;
      const safeExtraFees = Number.isFinite(extraFees) && extraFees >= 0 ? extraFees : 0;

      let safeTipPercent = 0;
      if (Number.isFinite(tipPercent) && tipPercent >= 0) safeTipPercent = tipPercent;
      if (safeTipPercent > 100) {
        setResultError("Tip (%) looks too high. Enter a value between 0 and 100.");
        return;
      }

      let passengers = 1;
      if (Number.isFinite(passengersRaw) && passengersRaw > 0) passengers = Math.round(passengersRaw);

      // Calculation logic
      const distanceCost = distanceKm * perKmRate;
      const timeCost = safeDuration * safePerMinute;
      const fareSubtotal = baseFare + distanceCost + timeCost;

      const surgedFare = fareSubtotal * surgeMultiplier;
      const beforeTip = surgedFare + safeTolls + safeExtraFees;

      const tipAmount = beforeTip * (safeTipPercent / 100);
      const total = beforeTip + tipAmount;

      const costPerKm = total / distanceKm;
      const costPerPerson = passengers > 0 ? total / passengers : total;

      // Build output HTML
      const resultHtml = `
        <p><strong>Estimated total:</strong> ${formatNumberTwoDecimals(total)} (in your currency)</p>
        <p><strong>Before tip:</strong> ${formatNumberTwoDecimals(beforeTip)}</p>
        <p><strong>Tip amount:</strong> ${formatNumberTwoDecimals(tipAmount)} (${formatNumberTwoDecimals(safeTipPercent)}%)</p>
        <p><strong>Cost per km:</strong> ${formatNumberTwoDecimals(costPerKm)}</p>
        <p><strong>Estimated per person:</strong> ${formatNumberTwoDecimals(costPerPerson)} (split by ${passengers})</p>
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
      const message = "Airport Transfer Cost Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
