document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const lengthInput = document.getElementById("length");
  const widthInput = document.getElementById("width");
  const depthInput = document.getElementById("depth");
  const compactionPercentInput = document.getElementById("compactionPercent");
  const wastePercentInput = document.getElementById("wastePercent");
  const densityInput = document.getElementById("density");

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

  // Add every input that should live-format with commas
  attachLiveFormatting(lengthInput);
  attachLiveFormatting(widthInput);
  attachLiveFormatting(depthInput);
  attachLiveFormatting(compactionPercentInput);
  attachLiveFormatting(wastePercentInput);
  attachLiveFormatting(densityInput);

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
      const lengthM = toNumber(lengthInput ? lengthInput.value : "");
      const widthM = toNumber(widthInput ? widthInput.value : "");
      const depthMm = toNumber(depthInput ? depthInput.value : "");

      const compactionPctRaw = toNumber(compactionPercentInput ? compactionPercentInput.value : "");
      const wastePctRaw = toNumber(wastePercentInput ? wastePercentInput.value : "");
      const densityKgM3Raw = toNumber(densityInput ? densityInput.value : "");

      // Basic existence guard
      if (!lengthInput || !widthInput || !depthInput) return;

      // Validation (required fields)
      if (!validatePositive(lengthM, "length (metres)")) return;
      if (!validatePositive(widthM, "width (metres)")) return;
      if (!validatePositive(depthMm, "depth (millimetres)")) return;

      // Reasonable bounds (soft guardrails)
      if (depthMm > 1000) {
        setResultError("Depth looks unusually large. Enter depth in millimetres (e.g. 50 to 200).");
        return;
      }

      // Optional inputs with defaults
      const compactionPct = Number.isFinite(compactionPctRaw) ? compactionPctRaw : 10;
      const wastePct = Number.isFinite(wastePctRaw) ? wastePctRaw : 5;
      const densityKgM3 = Number.isFinite(densityKgM3Raw) ? densityKgM3Raw : 1600;

      if (!validateNonNegative(compactionPct, "compaction allowance (%)")) return;
      if (!validateNonNegative(wastePct, "waste allowance (%)")) return;
      if (!validatePositive(densityKgM3, "bulk density (kg/m³)")) return;

      if (compactionPct > 50) {
        setResultError("Compaction allowance is unusually high. Use a value between 0 and 30 for most projects.");
        return;
      }
      if (wastePct > 30) {
        setResultError("Waste allowance is unusually high. Use a value between 0 and 15 for most projects.");
        return;
      }
      if (densityKgM3 < 1100 || densityKgM3 > 2200) {
        setResultError("Density looks unrealistic for gravel. Typical values are roughly 1300 to 2000 kg/m³.");
        return;
      }

      // Calculation logic
      const depthM = depthMm / 1000;
      const baseVolumeM3 = lengthM * widthM * depthM;

      const compactionFactor = 1 + (compactionPct / 100);
      const wasteFactor = 1 + (wastePct / 100);
      const adjustedVolumeM3 = baseVolumeM3 * compactionFactor * wasteFactor;

      const cubicFeetPerM3 = 35.3146667;
      const cubicYardsPerM3 = 1.30795062;

      const volumeFt3 = adjustedVolumeM3 * cubicFeetPerM3;
      const volumeYd3 = adjustedVolumeM3 * cubicYardsPerM3;

      const weightKg = adjustedVolumeM3 * densityKgM3;
      const weightTonnes = weightKg / 1000; // metric tonnes
      const weightShortTons = weightKg / 907.18474; // US short tons

      // Secondary insight: estimate 1-tonne bulk bags
      const bulkBags1Tonne = weightTonnes; // approx count if each bag is ~1 tonne

      // Build output HTML
      const resultHtml =
        `<p><strong>Gravel required (with allowances):</strong></p>` +
        `<p><strong>Volume:</strong> ${formatNumberTwoDecimals(adjustedVolumeM3)} m³` +
        ` (${formatNumberTwoDecimals(volumeYd3)} yd³, ${formatNumberTwoDecimals(volumeFt3)} ft³)</p>` +
        `<p><strong>Estimated weight:</strong> ${formatNumberTwoDecimals(weightTonnes)} tonnes` +
        ` (${formatNumberTwoDecimals(weightShortTons)} short tons)</p>` +
        `<p><strong>Quick planning:</strong> about ${formatNumberTwoDecimals(bulkBags1Tonne)} bulk bags (1 tonne each)</p>` +
        `<p><strong>Assumptions used:</strong> density ${formatNumberTwoDecimals(densityKgM3)} kg/m³, compaction ${formatNumberTwoDecimals(compactionPct)}%, waste ${formatNumberTwoDecimals(wastePct)}%.</p>`;

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
      const message = "Gravel Volume Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
