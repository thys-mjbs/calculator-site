document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const pressureValue = document.getElementById("pressureValue");
  const pressureUnit = document.getElementById("pressureUnit");
  const boreValue = document.getElementById("boreValue");
  const diameterUnit = document.getElementById("diameterUnit");
  const rodValue = document.getElementById("rodValue");
  const efficiencyPercent = document.getElementById("efficiencyPercent");

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
  attachLiveFormatting(pressureValue);
  attachLiveFormatting(boreValue);
  attachLiveFormatting(rodValue);
  attachLiveFormatting(efficiencyPercent);

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

  function clamp(value, min, max) {
    if (!Number.isFinite(value)) return value;
    return Math.min(Math.max(value, min), max);
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const pInput = toNumber(pressureValue ? pressureValue.value : "");
      const boreInput = toNumber(boreValue ? boreValue.value : "");
      const rodInput = toNumber(rodValue ? rodValue.value : "");
      const effInput = toNumber(efficiencyPercent ? efficiencyPercent.value : "");

      // Basic existence guard
      if (!pressureValue || !pressureUnit || !boreValue || !diameterUnit) return;

      // Validation (required fields)
      if (!validatePositive(pInput, "system pressure")) return;
      if (!validatePositive(boreInput, "cylinder bore diameter")) return;

      // Optional fields
      const hasRod = Number.isFinite(rodInput) && rodInput > 0;
      const hasEff = Number.isFinite(effInput) && effInput > 0;

      // Pressure conversion to Pa
      const pUnit = pressureUnit.value || "bar";
      let pressurePa = pInput;

      if (pUnit === "bar") pressurePa = pInput * 100000;
      if (pUnit === "psi") pressurePa = pInput * 6894.757293168;
      if (pUnit === "mpa") pressurePa = pInput * 1000000;

      // Diameter conversion to meters
      const dUnit = diameterUnit.value || "mm";
      let boreM = boreInput;
      let rodM = rodInput;

      if (dUnit === "mm") {
        boreM = boreInput / 1000;
        rodM = rodInput / 1000;
      } else if (dUnit === "in") {
        boreM = boreInput * 0.0254;
        rodM = rodInput * 0.0254;
      }

      // Validate rod diameter if present
      if (hasRod) {
        if (!validatePositive(rodInput, "rod diameter")) return;
        if (rodM >= boreM) {
          setResultError("Rod diameter must be smaller than the bore diameter.");
          return;
        }
      }

      // Efficiency factor
      let eff = 0.9;
      if (hasEff) {
        if (!validateNonNegative(effInput, "efficiency")) return;
        eff = clamp(effInput, 1, 100) / 100;
      }

      // Areas
      const boreAreaM2 = Math.PI * Math.pow(boreM / 2, 2);

      // Extension force
      const extForceN = pressurePa * boreAreaM2 * eff;

      // Retraction force (optional)
      let retractAreaM2 = null;
      let retForceN = null;
      if (hasRod) {
        const rodAreaM2 = Math.PI * Math.pow(rodM / 2, 2);
        retractAreaM2 = Math.max(boreAreaM2 - rodAreaM2, 0);
        retForceN = pressurePa * retractAreaM2 * eff;
      }

      // Secondary insight: force per 1 bar for this bore (extension)
      const forcePerBarN = 100000 * boreAreaM2 * eff;

      // Friendly units
      function toKN(n) {
        return n / 1000;
      }
      function toTF(n) {
        return n / 9806.65;
      }
      function m2ToCm2(a) {
        return a * 10000;
      }

      const boreAreaCm2 = m2ToCm2(boreAreaM2);

      // Build output HTML
      const extKN = toKN(extForceN);
      const extTF = toTF(extForceN);

      let resultHtml = "";
      resultHtml += `<p><strong>Extension (push) force:</strong> ${formatNumberTwoDecimals(extForceN)} N (${formatNumberTwoDecimals(extKN)} kN, ${formatNumberTwoDecimals(extTF)} tf)</p>`;
      resultHtml += `<p><strong>Piston area (bore):</strong> ${formatNumberTwoDecimals(boreAreaCm2)} cm²</p>`;

      if (hasRod && retractAreaM2 !== null && retForceN !== null) {
        const retractAreaCm2 = m2ToCm2(retractAreaM2);
        const retKN = toKN(retForceN);
        const retTF = toTF(retForceN);
        resultHtml += `<p><strong>Retraction (pull) force:</strong> ${formatNumberTwoDecimals(retForceN)} N (${formatNumberTwoDecimals(retKN)} kN, ${formatNumberTwoDecimals(retTF)} tf)</p>`;
        resultHtml += `<p><strong>Effective pull area (annulus):</strong> ${formatNumberTwoDecimals(retractAreaCm2)} cm²</p>`;
      } else {
        resultHtml += `<p><strong>Retraction (pull) force:</strong> Add rod diameter to calculate pull force.</p>`;
      }

      resultHtml += `<p><strong>Force per 1 bar (extension):</strong> ${formatNumberTwoDecimals(forcePerBarN)} N per bar</p>`;
      resultHtml += `<p><strong>Efficiency used:</strong> ${formatNumberTwoDecimals(eff * 100)}%</p>`;

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
      const message = "Hydraulic Force Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
