document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const lengthMeters = document.getElementById("lengthMeters");
  const widthMeters = document.getElementById("widthMeters");
  const depthMm = document.getElementById("depthMm");

  // Advanced (optional)
  const wastePercent = document.getElementById("wastePercent");
  const densityKgM3 = document.getElementById("densityKgM3");
  const bagSizeKg = document.getElementById("bagSizeKg");

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
  attachLiveFormatting(lengthMeters);
  attachLiveFormatting(widthMeters);
  attachLiveFormatting(depthMm);
  attachLiveFormatting(wastePercent);
  attachLiveFormatting(densityKgM3);
  attachLiveFormatting(bagSizeKg);

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
      clearResult();

      const L = toNumber(lengthMeters ? lengthMeters.value : "");
      const W = toNumber(widthMeters ? widthMeters.value : "");
      const Dmm = toNumber(depthMm ? depthMm.value : "");

      const waste = toNumber(wastePercent ? wastePercent.value : "");
      const density = toNumber(densityKgM3 ? densityKgM3.value : "");
      const bagSize = toNumber(bagSizeKg ? bagSizeKg.value : "");

      if (!validatePositive(L, "length (meters)")) return;
      if (!validatePositive(W, "width (meters)")) return;
      if (!validatePositive(Dmm, "depth (millimeters)")) return;

      const depthM = Dmm / 1000;

      // Defaults for optional fields
      const wastePct = Number.isFinite(waste) && waste >= 0 ? waste : 10;
      const densityVal = Number.isFinite(density) && density > 0 ? density : 1600;
      const bagSizeVal = Number.isFinite(bagSize) && bagSize > 0 ? bagSize : 20;

      // Guard unrealistic values gently
      if (depthM > 1) {
        setResultError("Depth looks very large for a sand layer. If you meant centimeters or millimeters, adjust the depth and try again.");
        return;
      }
      if (!validateNonNegative(wastePct, "waste / compaction allowance (%)")) return;

      const areaM2 = L * W;
      const baseVolumeM3 = areaM2 * depthM;
      const orderVolumeM3 = baseVolumeM3 * (1 + wastePct / 100);

      const liters = orderVolumeM3 * 1000;

      const weightKg = orderVolumeM3 * densityVal;
      const weightTonnes = weightKg / 1000;

      const bagsNeeded = Math.ceil(weightKg / bagSizeVal);

      const volumeFt3 = orderVolumeM3 * 35.3146667;

      const resultHtml = `
        <p><strong>Recommended sand volume:</strong> ${formatNumberTwoDecimals(orderVolumeM3)} m³</p>
        <p><strong>In other units:</strong> ${formatNumberTwoDecimals(liters)} liters, ${formatNumberTwoDecimals(volumeFt3)} ft³</p>
        <p><strong>Area:</strong> ${formatNumberTwoDecimals(areaM2)} m²</p>
        <p><strong>Depth:</strong> ${formatNumberTwoDecimals(depthM)} m (${formatNumberTwoDecimals(Dmm)} mm)</p>
        <p><strong>Base volume (no allowance):</strong> ${formatNumberTwoDecimals(baseVolumeM3)} m³</p>
        <p><strong>Estimated weight:</strong> ${formatNumberTwoDecimals(weightKg)} kg (${formatNumberTwoDecimals(weightTonnes)} tonnes)</p>
        <p><strong>Approx. bags:</strong> ${formatNumberTwoDecimals(bagsNeeded)} bags of ${formatNumberTwoDecimals(bagSizeVal)} kg</p>
        <p><strong>Assumptions used:</strong> Allowance ${formatNumberTwoDecimals(wastePct)}%, density ${formatNumberTwoDecimals(densityVal)} kg/m³.</p>
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
      const message = "Sand Volume Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
