document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const unitsSelect = document.getElementById("unitsSelect");
  const lengthInput = document.getElementById("lengthInput");
  const widthInput = document.getElementById("widthInput");
  const depthInput = document.getElementById("depthInput");
  const extraPercentInput = document.getElementById("extraPercentInput");
  const densitySelect = document.getElementById("densitySelect");

  const lengthLabel = document.getElementById("lengthLabel");
  const widthLabel = document.getElementById("widthLabel");
  const depthLabel = document.getElementById("depthLabel");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (Not used in this calculator)

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(lengthInput);
  attachLiveFormatting(widthInput);
  attachLiveFormatting(depthInput);
  attachLiveFormatting(extraPercentInput);

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
  // UI: update labels when units change
  // ------------------------------------------------------------
  function updateUnitLabels() {
    const mode = unitsSelect ? unitsSelect.value : "metric";
    if (mode === "imperial") {
      if (lengthLabel) lengthLabel.textContent = "Length (ft)";
      if (widthLabel) widthLabel.textContent = "Width (ft)";
      if (depthLabel) depthLabel.textContent = "Depth (in)";
      if (lengthInput) lengthInput.placeholder = "e.g., 20";
      if (widthInput) widthInput.placeholder = "e.g., 10";
      if (depthInput) depthInput.placeholder = "e.g., 4";
    } else {
      if (lengthLabel) lengthLabel.textContent = "Length (m)";
      if (widthLabel) widthLabel.textContent = "Width (m)";
      if (depthLabel) depthLabel.textContent = "Depth (cm)";
      if (lengthInput) lengthInput.placeholder = "e.g., 6";
      if (widthInput) widthInput.placeholder = "e.g., 3";
      if (depthInput) depthInput.placeholder = "e.g., 10";
    }
    clearResult();
  }

  if (unitsSelect) {
    updateUnitLabels();
    unitsSelect.addEventListener("change", updateUnitLabels);
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const mode = unitsSelect ? unitsSelect.value : "metric";

      const lengthRaw = toNumber(lengthInput ? lengthInput.value : "");
      const widthRaw = toNumber(widthInput ? widthInput.value : "");
      const depthRaw = toNumber(depthInput ? depthInput.value : "");

      if (!lengthInput || !widthInput || !depthInput) return;

      if (!validatePositive(lengthRaw, "length")) return;
      if (!validatePositive(widthRaw, "width")) return;
      if (!validatePositive(depthRaw, "depth")) return;

      const extraPct = extraPercentInput && extraPercentInput.value.trim() !== ""
        ? toNumber(extraPercentInput.value)
        : 10;

      if (!validateNonNegative(extraPct, "extra percentage")) return;

      const density = densitySelect ? toNumber(densitySelect.value) : 1300;
      if (!validatePositive(density, "soil density")) return;

      // Convert inputs to meters
      let lengthM = 0;
      let widthM = 0;
      let depthM = 0;

      if (mode === "imperial") {
        lengthM = lengthRaw * 0.3048; // ft -> m
        widthM = widthRaw * 0.3048;   // ft -> m
        depthM = depthRaw * 0.0254;   // in -> m
      } else {
        lengthM = lengthRaw;          // m
        widthM = widthRaw;            // m
        depthM = depthRaw / 100;      // cm -> m
      }

      // Guard against tiny or unrealistic depths (still valid, but warn by clarity)
      if (!Number.isFinite(lengthM) || !Number.isFinite(widthM) || !Number.isFinite(depthM)) {
        setResultError("Enter valid numeric values for all fields.");
        return;
      }

      const baseVolumeM3 = lengthM * widthM * depthM;
      if (!Number.isFinite(baseVolumeM3) || baseVolumeM3 <= 0) {
        setResultError("Your inputs produce an invalid volume. Check your measurements and try again.");
        return;
      }

      const factor = 1 + (extraPct / 100);
      const volumeM3 = baseVolumeM3 * factor;

      const volumeLiters = volumeM3 * 1000;
      const volumeYd3 = volumeM3 * 1.30795062;

      const bags40L = Math.ceil(volumeLiters / 40);
      const weightKg = volumeM3 * density;
      const weightT = weightKg / 1000;

      const baseVolumeYd3 = baseVolumeM3 * 1.30795062;

      const resultHtml = `
        <p><strong>Soil needed (with ${formatNumberTwoDecimals(extraPct)}% extra):</strong> ${formatNumberTwoDecimals(volumeM3)} m³ (${formatNumberTwoDecimals(volumeYd3)} yd³)</p>
        <p><strong>Base volume (no extra):</strong> ${formatNumberTwoDecimals(baseVolumeM3)} m³ (${formatNumberTwoDecimals(baseVolumeYd3)} yd³)</p>
        <p><strong>That is about:</strong> ${formatNumberTwoDecimals(volumeLiters)} liters, or roughly <strong>${bags40L}</strong> bags of 40L soil.</p>
        <p><strong>Estimated weight:</strong> ${formatNumberTwoDecimals(weightT)} tonnes (${formatNumberTwoDecimals(weightKg)} kg), based on your selected soil type.</p>
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
      const message = "Soil Volume Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
