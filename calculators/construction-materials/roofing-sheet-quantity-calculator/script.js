document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const roofRunMInput = document.getElementById("roofRunM");
  const slopeLengthMInput = document.getElementById("slopeLengthM");
  const effectiveCoverWidthMmInput = document.getElementById("effectiveCoverWidthMm");
  const roofPlanesInput = document.getElementById("roofPlanes");
  const wastePercentInput = document.getElementById("wastePercent");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (not used)

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
  attachLiveFormatting(roofRunMInput);
  attachLiveFormatting(slopeLengthMInput);
  attachLiveFormatting(effectiveCoverWidthMmInput);
  attachLiveFormatting(roofPlanesInput);
  attachLiveFormatting(wastePercentInput);

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
  // (not used)

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
      const roofRunM = toNumber(roofRunMInput ? roofRunMInput.value : "");
      const slopeLengthM = toNumber(slopeLengthMInput ? slopeLengthMInput.value : "");
      const effectiveCoverWidthMm = toNumber(effectiveCoverWidthMmInput ? effectiveCoverWidthMmInput.value : "");
      const roofPlanesRaw = toNumber(roofPlanesInput ? roofPlanesInput.value : "");
      const wastePercentRaw = toNumber(wastePercentInput ? wastePercentInput.value : "");

      // Basic existence guard
      if (
        !roofRunMInput ||
        !slopeLengthMInput ||
        !effectiveCoverWidthMmInput ||
        !roofPlanesInput ||
        !wastePercentInput
      ) {
        return;
      }

      // Defaults for optional inputs
      const roofPlanes = Number.isFinite(roofPlanesRaw) && roofPlanesRaw > 0 ? Math.round(roofPlanesRaw) : 2;
      const wastePercent = Number.isFinite(wastePercentRaw) && wastePercentRaw >= 0 ? wastePercentRaw : 10;

      // Validation (required inputs)
      if (!validatePositive(roofRunM, "roof run length")) return;
      if (!validatePositive(slopeLengthM, "roof slope length")) return;
      if (!validatePositive(effectiveCoverWidthMm, "sheet effective cover width")) return;

      if (roofPlanes < 1 || roofPlanes > 12) {
        setResultError("Enter a realistic number of roof planes (1 to 12).");
        return;
      }

      if (wastePercent < 0 || wastePercent > 50) {
        setResultError("Enter a realistic waste allowance (0% to 50%).");
        return;
      }

      // Calculation logic
      const coverWidthM = effectiveCoverWidthMm / 1000;
      if (!Number.isFinite(coverWidthM) || coverWidthM <= 0) {
        setResultError("Enter a valid sheet effective cover width.");
        return;
      }

      const sheetsPerPlane = Math.ceil(roofRunM / coverWidthM);
      const baseSheetsTotal = sheetsPerPlane * roofPlanes;

      const wasteMultiplier = 1 + (wastePercent / 100);
      const totalSheetsWithWaste = Math.ceil(baseSheetsTotal * wasteMultiplier);

      const roofAreaM2 = roofRunM * slopeLengthM * roofPlanes;
      const roofAreaWithWasteM2 = roofAreaM2 * wasteMultiplier;

      const totalSheetRunLengthM = totalSheetsWithWaste * slopeLengthM;

      // Build output HTML
      const resultHtml =
        `<p><strong>Total sheets to order:</strong> ${formatInputWithCommas(String(totalSheetsWithWaste))}</p>` +
        `<p><strong>Sheets per plane:</strong> ${formatInputWithCommas(String(sheetsPerPlane))}</p>` +
        `<p><strong>Roof planes counted:</strong> ${formatInputWithCommas(String(roofPlanes))}</p>` +
        `<p><strong>Waste allowance applied:</strong> ${formatNumberTwoDecimals(wastePercent)}%</p>` +
        `<p><strong>Estimated roof area covered:</strong> ${formatNumberTwoDecimals(roofAreaM2)} m²</p>` +
        `<p><strong>Area with waste allowance:</strong> ${formatNumberTwoDecimals(roofAreaWithWasteM2)} m²</p>` +
        `<p><strong>Total sheet length (all sheets):</strong> ${formatNumberTwoDecimals(totalSheetRunLengthM)} m</p>` +
        `<p><strong>Note:</strong> Use the sheet <em>effective cover width</em> from the supplier spec. If your design uses end laps (length overlaps), this calculator will undercount sheets.</p>`;

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
      const message = "Roofing Sheet Quantity Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
