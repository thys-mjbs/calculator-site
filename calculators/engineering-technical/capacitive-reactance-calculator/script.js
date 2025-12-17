document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const frequencyValue = document.getElementById("frequencyValue");
  const frequencyUnit = document.getElementById("frequencyUnit");
  const capacitanceValue = document.getElementById("capacitanceValue");
  const capacitanceUnit = document.getElementById("capacitanceUnit");
  const voltageValue = document.getElementById("voltageValue");

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

  attachLiveFormatting(frequencyValue);
  attachLiveFormatting(capacitanceValue);
  attachLiveFormatting(voltageValue);

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
  function unitToHz(value, unit) {
    if (!Number.isFinite(value)) return NaN;
    if (unit === "khz") return value * 1000;
    if (unit === "mhz") return value * 1000000;
    return value; // hz
  }

  function unitToFarads(value, unit) {
    if (!Number.isFinite(value)) return NaN;
    if (unit === "pf") return value * 1e-12;
    if (unit === "nf") return value * 1e-9;
    if (unit === "uf") return value * 1e-6;
    if (unit === "mf") return value * 1e-3;
    return value; // f
  }

  function formatOhmsSmart(ohms) {
    if (!Number.isFinite(ohms) || ohms <= 0) return "";
    if (ohms >= 1000000) return formatNumberTwoDecimals(ohms / 1000000) + " MΩ";
    if (ohms >= 1000) return formatNumberTwoDecimals(ohms / 1000) + " kΩ";
    return formatNumberTwoDecimals(ohms) + " Ω";
  }

  function formatAmpsSmart(amps) {
    if (!Number.isFinite(amps) || amps < 0) return "";
    if (amps >= 1) return formatNumberTwoDecimals(amps) + " A";
    if (amps >= 0.001) return formatNumberTwoDecimals(amps * 1000) + " mA";
    if (amps >= 0.000001) return formatNumberTwoDecimals(amps * 1000000) + " µA";
    return formatNumberTwoDecimals(amps * 1000000000) + " nA";
  }

  function formatVarsSmart(vars) {
    if (!Number.isFinite(vars) || vars < 0) return "";
    if (vars >= 1000) return formatNumberTwoDecimals(vars / 1000) + " kVAR";
    return formatNumberTwoDecimals(vars) + " VAR";
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      const fInput = toNumber(frequencyValue ? frequencyValue.value : "");
      const cInput = toNumber(capacitanceValue ? capacitanceValue.value : "");
      const vInput = toNumber(voltageValue ? voltageValue.value : "");

      if (!validatePositive(fInput, "frequency")) return;
      if (!validatePositive(cInput, "capacitance")) return;

      const fHz = unitToHz(fInput, frequencyUnit ? frequencyUnit.value : "hz");
      const cF = unitToFarads(cInput, capacitanceUnit ? capacitanceUnit.value : "uf");

      if (!validatePositive(fHz, "frequency")) return;
      if (!validatePositive(cF, "capacitance")) return;

      const xc = 1 / (2 * Math.PI * fHz * cF);

      if (!Number.isFinite(xc) || xc <= 0) {
        setResultError("Unable to calculate reactance with the values provided. Check your inputs.");
        return;
      }

      const xc50 = 1 / (2 * Math.PI * 50 * cF);
      const xc60 = 1 / (2 * Math.PI * 60 * cF);

      const hasVoltage = Number.isFinite(vInput) && vInput > 0;
      let current = NaN;
      let qVars = NaN;

      if (hasVoltage) {
        current = vInput / xc;
        qVars = (vInput * vInput) / xc;
      }

      let resultHtml = `
        <p><strong>Capacitive reactance (Xc):</strong> ${formatOhmsSmart(xc)}</p>
        <p><strong>Impedance magnitude (ideal capacitor):</strong> ${formatOhmsSmart(xc)}</p>
        <p><strong>Quick reference for the same capacitor:</strong></p>
        <ul>
          <li><strong>At 50 Hz:</strong> ${formatOhmsSmart(xc50)}</li>
          <li><strong>At 60 Hz:</strong> ${formatOhmsSmart(xc60)}</li>
        </ul>
      `;

      if (hasVoltage) {
        resultHtml += `
          <p><strong>Estimated AC current (RMS):</strong> ${formatAmpsSmart(current)}</p>
          <p><strong>Estimated capacitive reactive power:</strong> ${formatVarsSmart(qVars)}</p>
          <p><em>Note:</em> Current and reactive power assume the capacitor is the main limiting impedance in series.</p>
        `;
      } else {
        resultHtml += `
          <p><em>Tip:</em> Add an RMS voltage to estimate current and reactive power in a simple series case.</p>
        `;
      }

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Capacitive Reactance Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
