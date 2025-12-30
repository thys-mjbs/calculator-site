document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const loadMassKgInput = document.getElementById("loadMassKg");
  const supportingStrandsInput = document.getElementById("supportingStrands");
  const efficiencyPercentInput = document.getElementById("efficiencyPercent");
  const liftHeightMInput = document.getElementById("liftHeightM");

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
  attachLiveFormatting(loadMassKgInput);
  attachLiveFormatting(efficiencyPercentInput);
  attachLiveFormatting(liftHeightMInput);

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

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const loadMassKg = toNumber(loadMassKgInput ? loadMassKgInput.value : "");
      const strandsRaw = toNumber(supportingStrandsInput ? supportingStrandsInput.value : "");
      const efficiencyInput = toNumber(efficiencyPercentInput ? efficiencyPercentInput.value : "");
      const liftHeightM = toNumber(liftHeightMInput ? liftHeightMInput.value : "");

      // Basic existence guard
      if (!loadMassKgInput || !supportingStrandsInput) return;

      // Validation
      if (!validatePositive(loadMassKg, "load (kg)")) return;

      if (!Number.isFinite(strandsRaw) || strandsRaw <= 0) {
        setResultError("Enter a valid number of supporting rope segments (1 or higher).");
        return;
      }

      const supportingStrands = Math.round(strandsRaw);
      if (supportingStrands !== strandsRaw) {
        setResultError("Supporting rope segments must be a whole number (for example, 2, 4, 6).");
        return;
      }

      if (supportingStrands < 1 || supportingStrands > 20) {
        setResultError("Supporting rope segments must be between 1 and 20 for a practical estimate.");
        return;
      }

      let efficiencyPercent = 85;
      if (Number.isFinite(efficiencyInput) && efficiencyInput > 0) {
        efficiencyPercent = efficiencyInput;
      }

      if (!Number.isFinite(efficiencyPercent) || efficiencyPercent <= 0 || efficiencyPercent > 100) {
        setResultError("Enter a valid system efficiency between 1 and 100, or leave it blank.");
        return;
      }

      let useLiftHeight = false;
      if (Number.isFinite(liftHeightM) && liftHeightM > 0) {
        useLiftHeight = true;
      } else if (Number.isFinite(liftHeightM) && liftHeightM < 0) {
        setResultError("Lift height must be 0 or higher.");
        return;
      }

      // Calculation logic
      const g = 9.80665; // m/s^2
      const loadForceN = loadMassKg * g;

      const idealMA = supportingStrands;
      const eff = efficiencyPercent / 100;
      const actualMA = idealMA * eff;

      const inputForceN = loadForceN / actualMA;
      const inputForceKgEq = inputForceN / g;

      // Rope travel (ideal parts-of-line)
      const ropePerMeter = idealMA;
      const ropePulledM = useLiftHeight ? liftHeightM * ropePerMeter : 0;

      // Work check (energy)
      const outputWorkJ = useLiftHeight ? loadForceN * liftHeightM : 0;
      const inputWorkJ = useLiftHeight ? inputForceN * ropePulledM : 0;

      // Build output HTML
      const loadMassDisplay = formatNumberTwoDecimals(loadMassKg);
      const loadForceDisplay = formatNumberTwoDecimals(loadForceN);

      const idealMADisplay = formatNumberTwoDecimals(idealMA);
      const actualMADisplay = formatNumberTwoDecimals(actualMA);

      const inputForceNDisplay = formatNumberTwoDecimals(inputForceN);
      const inputForceKgEqDisplay = formatNumberTwoDecimals(inputForceKgEq);

      let extraHtml = "";
      if (useLiftHeight) {
        const liftHeightDisplay = formatNumberTwoDecimals(liftHeightM);
        const ropePerMeterDisplay = formatNumberTwoDecimals(ropePerMeter);
        const ropePulledDisplay = formatNumberTwoDecimals(ropePulledM);
        const outputWorkDisplay = formatNumberTwoDecimals(outputWorkJ);
        const inputWorkDisplay = formatNumberTwoDecimals(inputWorkJ);

        extraHtml = `
          <p><strong>Lift planning:</strong></p>
          <p>Lift height: <strong>${liftHeightDisplay} m</strong></p>
          <p>Rope to pull per 1 m lift: <strong>${ropePerMeterDisplay} m</strong></p>
          <p>Total rope to pull: <strong>${ropePulledDisplay} m</strong></p>
          <p><strong>Energy check (approx.):</strong></p>
          <p>Load work (out): <strong>${outputWorkDisplay} J</strong></p>
          <p>Pull work (in): <strong>${inputWorkDisplay} J</strong></p>
        `;
      } else {
        extraHtml = `
          <p><strong>Lift planning:</strong> Add a lift height in Advanced options to estimate rope travel.</p>
        `;
      }

      const resultHtml = `
        <p><strong>Pulling force needed:</strong> ${inputForceNDisplay} N</p>
        <p><strong>Pulling force (kg equivalent):</strong> ${inputForceKgEqDisplay} kg</p>
        <p><strong>Pulley ratio (ideal mechanical advantage):</strong> ${idealMADisplay}:1</p>
        <p><strong>Mechanical advantage (with ${formatNumberTwoDecimals(efficiencyPercent)}% efficiency):</strong> ${actualMADisplay}:1</p>
        <p><strong>Load entered:</strong> ${loadMassDisplay} kg (${loadForceDisplay} N)</p>
        ${extraHtml}
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
      const message = "Pulley Ratio Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
