document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const lengthFeetInput = document.getElementById("lengthFeet");
  const widthFeetInput = document.getElementById("widthFeet");
  const depthInchesInput = document.getElementById("depthInches");
  const compactionPercentInput = document.getElementById("compactionPercent");
  const densityTonsPerYdInput = document.getElementById("densityTonsPerYd");
  const pricePerYardInput = document.getElementById("pricePerYard");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (Not used for this calculator)

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(lengthFeetInput);
  attachLiveFormatting(widthFeetInput);
  attachLiveFormatting(depthInchesInput);
  attachLiveFormatting(compactionPercentInput);
  attachLiveFormatting(densityTonsPerYdInput);
  attachLiveFormatting(pricePerYardInput);

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

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const lengthFt = toNumber(lengthFeetInput ? lengthFeetInput.value : "");
      const widthFt = toNumber(widthFeetInput ? widthFeetInput.value : "");
      const depthIn = toNumber(depthInchesInput ? depthInchesInput.value : "");

      const extraPctRaw = toNumber(compactionPercentInput ? compactionPercentInput.value : "");
      const densityRaw = toNumber(densityTonsPerYdInput ? densityTonsPerYdInput.value : "");
      const priceRaw = toNumber(pricePerYardInput ? pricePerYardInput.value : "");

      // Basic existence guard
      if (!lengthFeetInput || !widthFeetInput || !depthInchesInput) return;

      // Validation (required)
      if (!validatePositive(lengthFt, "length (feet)")) return;
      if (!validatePositive(widthFt, "width (feet)")) return;
      if (!validatePositive(depthIn, "average depth (inches)")) return;

      // Optional validation and defaults
      const extraPct = Number.isFinite(extraPctRaw) ? extraPctRaw : 10;
      const densityTonsPerYd = Number.isFinite(densityRaw) ? densityRaw : 1.2;

      if (!validateNonNegative(extraPct, "extra allowance (%)")) return;
      if (!validatePositive(densityTonsPerYd, "density (tons per cubic yard)")) return;

      const pricePerYdProvided = pricePerYardInput && pricePerYardInput.value.trim() !== "";
      const pricePerYd = pricePerYdProvided ? priceRaw : 0;

      if (pricePerYdProvided && !validateNonNegative(pricePerYd, "price per cubic yard")) return;

      // Calculation logic
      const depthFt = depthIn / 12;
      const volumeFt3 = lengthFt * widthFt * depthFt;
      const exactYd3 = volumeFt3 / 27;

      const allowanceMultiplier = 1 + (extraPct / 100);
      const orderYd3Exact = exactYd3 * allowanceMultiplier;

      const roundIncrement = 0.25;
      const orderYd3Rounded = Math.ceil(orderYd3Exact / roundIncrement) * roundIncrement;

      const cubicMeters = orderYd3Exact * 0.764554857984;
      const tonsEstimate = orderYd3Exact * densityTonsPerYd;

      const costProvided = pricePerYdProvided;
      const estimatedCost = costProvided ? (orderYd3Rounded * pricePerYd) : 0;

      // Build output HTML
      let resultHtml = "";
      resultHtml += `<p><strong>Order quantity (rounded up):</strong> ${formatNumberTwoDecimals(orderYd3Rounded)} yd³</p>`;
      resultHtml += `<p><strong>Estimated loose volume (with allowance):</strong> ${formatNumberTwoDecimals(orderYd3Exact)} yd³</p>`;
      resultHtml += `<p><strong>Compacted volume (no allowance):</strong> ${formatNumberTwoDecimals(exactYd3)} yd³ (${formatNumberTwoDecimals(volumeFt3)} ft³)</p>`;
      resultHtml += `<p><strong>Metric estimate:</strong> ${formatNumberTwoDecimals(cubicMeters)} m³</p>`;
      resultHtml += `<p><strong>Estimated weight:</strong> ${formatNumberTwoDecimals(tonsEstimate)} tons (using ${formatNumberTwoDecimals(densityTonsPerYd)} tons/yd³)</p>`;

      if (costProvided) {
        resultHtml += `<p><strong>Estimated material cost:</strong> ${formatNumberTwoDecimals(estimatedCost)} (based on ${formatNumberTwoDecimals(pricePerYd)} per yd³)</p>`;
      } else {
        resultHtml += `<p><strong>Cost:</strong> Add a price per cubic yard in Advanced options to estimate material cost.</p>`;
      }

      resultHtml += `<p><strong>Allowance used:</strong> ${formatNumberTwoDecimals(extraPct)}%</p>`;

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
      const message = "Fill Dirt Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
