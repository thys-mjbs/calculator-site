document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const areaM2Input = document.getElementById("areaM2");
  const tileLengthMmInput = document.getElementById("tileLengthMm");
  const tileWidthMmInput = document.getElementById("tileWidthMm");
  const jointWidthMmInput = document.getElementById("jointWidthMm");
  const jointDepthMmInput = document.getElementById("jointDepthMm");
  const wastePercentInput = document.getElementById("wastePercent");
  const groutDensityInput = document.getElementById("groutDensity");
  const bagSizeKgInput = document.getElementById("bagSizeKg");

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
  attachLiveFormatting(areaM2Input);
  attachLiveFormatting(tileLengthMmInput);
  attachLiveFormatting(tileWidthMmInput);
  attachLiveFormatting(jointWidthMmInput);
  attachLiveFormatting(jointDepthMmInput);
  attachLiveFormatting(wastePercentInput);
  attachLiveFormatting(groutDensityInput);
  attachLiveFormatting(bagSizeKgInput);

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
      const areaM2 = toNumber(areaM2Input ? areaM2Input.value : "");
      const tileLengthMm = toNumber(tileLengthMmInput ? tileLengthMmInput.value : "");
      const tileWidthMm = toNumber(tileWidthMmInput ? tileWidthMmInput.value : "");
      const jointWidthMm = toNumber(jointWidthMmInput ? jointWidthMmInput.value : "");

      let jointDepthMm = toNumber(jointDepthMmInput ? jointDepthMmInput.value : "");
      let wastePercent = toNumber(wastePercentInput ? wastePercentInput.value : "");
      let groutDensity = toNumber(groutDensityInput ? groutDensityInput.value : "");
      let bagSizeKg = toNumber(bagSizeKgInput ? bagSizeKgInput.value : "");

      // Basic existence guard
      if (!areaM2Input || !tileLengthMmInput || !tileWidthMmInput || !jointWidthMmInput) return;

      // Defaults for optional advanced inputs
      if (!Number.isFinite(jointDepthMm) || jointDepthMm <= 0) jointDepthMm = 6;
      if (!Number.isFinite(wastePercent) || wastePercent < 0) wastePercent = 10;
      if (!Number.isFinite(groutDensity) || groutDensity <= 0) groutDensity = 1800;
      if (!Number.isFinite(bagSizeKg) || bagSizeKg <= 0) bagSizeKg = 5;

      // Validation
      if (!validatePositive(areaM2, "total tiled area (m²)")) return;
      if (!validatePositive(tileLengthMm, "tile length (mm)")) return;
      if (!validatePositive(tileWidthMm, "tile width (mm)")) return;
      if (!validatePositive(jointWidthMm, "grout joint width (mm)")) return;

      if (!validatePositive(jointDepthMm, "grout depth (mm)")) return;
      if (!validateNonNegative(wastePercent, "waste allowance (%)")) return;
      if (!validatePositive(groutDensity, "grout density (kg/m³)")) return;
      if (!validatePositive(bagSizeKg, "bag size (kg)")) return;

      // Guardrails for unrealistic inputs (plain-language)
      if (jointWidthMm > 25) {
        setResultError("Joint width looks unusually large. If you meant millimeters, enter a value like 2 to 10.");
        return;
      }
      if (jointDepthMm > 25) {
        setResultError("Grout depth looks unusually large. If you meant millimeters, enter a value like 3 to 12.");
        return;
      }
      if (wastePercent > 50) {
        setResultError("Waste allowance is very high. Use a value like 5 to 20 unless you have a specific reason.");
        return;
      }

      // Calculation logic
      // Convert mm to meters
      const L = tileLengthMm / 1000;
      const W = tileWidthMm / 1000;
      const J = jointWidthMm / 1000;
      const D = jointDepthMm / 1000;

      // Total grout line length per m² for a grid:
      // vertical lines: 1 / (W + J)
      // horizontal lines: 1 / (L + J)
      const lengthPerM2 = (1 / (W + J)) + (1 / (L + J));

      // Joint cross section area (m²): J * D
      const jointArea = J * D;

      // Volume (m³): areaM2 * lengthPerM2 * jointArea
      const groutVolumeM3 = areaM2 * lengthPerM2 * jointArea;

      // Mass (kg): volume * density
      const groutKgBase = groutVolumeM3 * groutDensity;

      // Add waste
      const wasteFactor = 1 + (wastePercent / 100);
      const groutKgWithWaste = groutKgBase * wasteFactor;

      // Bags (rounded up)
      const bagsNeeded = Math.ceil(groutKgWithWaste / bagSizeKg);

      // Helpful secondary figures
      const groutLitersWithWaste = groutKgWithWaste / groutDensity * 1000;
      const kgPerM2 = groutKgWithWaste / areaM2;
      const m2PerBag = kgPerM2 > 0 ? (bagSizeKg / kgPerM2) : 0;

      // Build output HTML
      const resultHtml =
        `<p><strong>Estimated grout needed:</strong> ${formatNumberTwoDecimals(groutKgWithWaste)} kg</p>` +
        `<p><strong>Bags to buy:</strong> ${bagsNeeded} (bag size ${formatNumberTwoDecimals(bagSizeKg)} kg)</p>` +
        `<p><strong>Approx grout volume:</strong> ${formatNumberTwoDecimals(groutLitersWithWaste)} liters</p>` +
        `<p><strong>Usage rate:</strong> ${formatNumberTwoDecimals(kgPerM2)} kg per m²</p>` +
        `<p><strong>Estimated coverage per bag:</strong> ${formatNumberTwoDecimals(m2PerBag)} m² per ${formatNumberTwoDecimals(bagSizeKg)} kg bag</p>` +
        `<p><strong>Assumptions used:</strong> depth ${formatNumberTwoDecimals(jointDepthMm)} mm, density ${formatNumberTwoDecimals(groutDensity)} kg/m³, waste ${formatNumberTwoDecimals(wastePercent)}%</p>`;

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
      const message = "Tile Grout Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
