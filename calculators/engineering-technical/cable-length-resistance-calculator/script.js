document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const lengthMetersInput = document.getElementById("lengthMeters");
  const includeReturnCheckbox = document.getElementById("includeReturn");
  const materialSelect = document.getElementById("material");
  const sizePresetSelect = document.getElementById("sizePreset");
  const customAreaGroup = document.getElementById("customAreaGroup");
  const areaMm2Input = document.getElementById("areaMm2");
  const tempCInput = document.getElementById("tempC");
  const currentAInput = document.getElementById("currentA");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  const modeSelect = sizePresetSelect;
  const modeBlockCustom = customAreaGroup;

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
  attachLiveFormatting(lengthMetersInput);
  attachLiveFormatting(areaMm2Input);
  attachLiveFormatting(tempCInput);
  attachLiveFormatting(currentAInput);

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
    if (modeBlockCustom) modeBlockCustom.classList.add("hidden");
    if (mode === "custom" && modeBlockCustom) modeBlockCustom.classList.remove("hidden");
    clearResult();
  }

  if (modeSelect) {
    const initialMode = modeSelect.value === "custom" ? "custom" : "preset";
    showMode(initialMode);

    modeSelect.addEventListener("change", function () {
      const mode = modeSelect.value === "custom" ? "custom" : "preset";
      showMode(mode);
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
      const mode = modeSelect && modeSelect.value === "custom" ? "custom" : "preset";

      const lengthMeters = toNumber(lengthMetersInput ? lengthMetersInput.value : "");
      const includeReturn = includeReturnCheckbox ? includeReturnCheckbox.checked : true;
      const material = materialSelect ? materialSelect.value : "copper";
      const presetAreaMm2Raw = sizePresetSelect ? sizePresetSelect.value : "";
      const customAreaMm2 = toNumber(areaMm2Input ? areaMm2Input.value : "");
      const tempCRaw = toNumber(tempCInput ? tempCInput.value : "");
      const currentA = toNumber(currentAInput ? currentAInput.value : "");

      if (
        !lengthMetersInput ||
        !materialSelect ||
        !sizePresetSelect ||
        !includeReturnCheckbox ||
        !tempCInput ||
        !currentAInput
      ) {
        return;
      }

      if (!validatePositive(lengthMeters, "cable length (m)")) return;

      let areaMm2 = 0;
      if (mode === "custom") {
        if (!validatePositive(customAreaMm2, "custom conductor area (mm²)")) return;
        areaMm2 = customAreaMm2;
      } else {
        const presetAreaMm2 = toNumber(presetAreaMm2Raw);
        if (!validatePositive(presetAreaMm2, "cable size")) return;
        areaMm2 = presetAreaMm2;
      }

      let tempC = tempCRaw;
      if (!Number.isFinite(tempC) || tempC === 0) {
        // If blank or invalid, default to 20°C. If user literally enters 0, treat as a valid value.
        if ((tempCInput.value || "").trim() === "") tempC = 20;
      }
      if (!Number.isFinite(tempC)) tempC = 20;

      // Reasonable sanity range without being hostile
      if (tempC < -50 || tempC > 200) {
        setResultError("Enter a realistic conductor temperature between -50°C and 200°C (or leave it blank for 20°C).");
        return;
      }

      let includeCurrent = true;
      if ((currentAInput.value || "").trim() === "") {
        includeCurrent = false;
      } else {
        if (!validateNonNegative(currentA, "current (A)")) return;
        if (currentA > 5000) {
          setResultError("Enter a realistic current value (0 to 5000 A).");
          return;
        }
      }

      // Resistivity at 20°C in ohm·mm²/m (typical engineering values)
      let rho20 = 0.017241; // copper
      let alpha = 0.00393; // copper temperature coefficient

      if (material === "aluminum") {
        rho20 = 0.028264;
        alpha = 0.00403;
      }

      const rhoT = rho20 * (1 + alpha * (tempC - 20));
      const effectiveLength = includeReturn ? lengthMeters * 2 : lengthMeters;

      const resistanceOhms = (rhoT * effectiveLength) / areaMm2;

      if (!Number.isFinite(resistanceOhms) || resistanceOhms <= 0) {
        setResultError("Could not calculate resistance from the provided inputs. Check your values and try again.");
        return;
      }

      const resistanceMilliOhms = resistanceOhms * 1000;

      let voltageDropV = null;
      let powerLossW = null;

      if (includeCurrent && currentA > 0) {
        voltageDropV = currentA * resistanceOhms;
        powerLossW = currentA * currentA * resistanceOhms;
      }

      const resistanceOhmsText = resistanceOhms.toFixed(6);
      const resistanceMilliOhmsText = formatNumberTwoDecimals(resistanceMilliOhms);

      const lengthLabel = includeReturn ? "Round-trip length used" : "One-way length used";
      const lengthUsedText = formatNumberTwoDecimals(effectiveLength);

      const areaText = areaMm2.toFixed(3);

      const materialLabel = material === "aluminum" ? "Aluminum" : "Copper";
      const tempText = (Number.isFinite(tempC) ? tempC : 20).toFixed(0);

      let extrasHtml = `<p><strong>Voltage drop:</strong> Enter a current to estimate voltage drop.</p>
<p><strong>Heat loss:</strong> Enter a current to estimate power loss.</p>`;

      if (includeCurrent && currentA > 0 && Number.isFinite(voltageDropV) && Number.isFinite(powerLossW)) {
        extrasHtml = `<p><strong>Voltage drop:</strong> ${formatNumberTwoDecimals(voltageDropV)} V</p>
<p><strong>Heat loss (power loss):</strong> ${formatNumberTwoDecimals(powerLossW)} W</p>`;
      }

      const resultHtml = `
        <p><strong>Total cable resistance:</strong> ${resistanceOhmsText} Ω</p>
        <p><strong>Equivalent:</strong> ${resistanceMilliOhmsText} mΩ</p>
        ${extrasHtml}
        <hr>
        <p><strong>${lengthLabel}:</strong> ${lengthUsedText} m</p>
        <p><strong>Conductor area used:</strong> ${areaText} mm²</p>
        <p><strong>Material:</strong> ${materialLabel}</p>
        <p><strong>Temperature used:</strong> ${tempText} °C</p>
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
      const message = "Cable Length Resistance Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
