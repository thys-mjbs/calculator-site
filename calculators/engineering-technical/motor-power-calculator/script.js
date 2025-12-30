document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const phaseType = document.getElementById("phaseType");
  const voltageInput = document.getElementById("voltage");
  const currentInput = document.getElementById("current");
  const powerFactorInput = document.getElementById("powerFactor");
  const efficiencyInput = document.getElementById("efficiency");

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

  // Add every input that should live-format with commas
  attachLiveFormatting(voltageInput);
  attachLiveFormatting(currentInput);
  attachLiveFormatting(efficiencyInput);

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
      const phase = phaseType ? phaseType.value : "three";

      const voltage = toNumber(voltageInput ? voltageInput.value : "");
      const current = toNumber(currentInput ? currentInput.value : "");

      const pfRaw = toNumber(powerFactorInput ? powerFactorInput.value : "");
      const effPercentRaw = toNumber(efficiencyInput ? efficiencyInput.value : "");

      if (!voltageInput || !currentInput || !powerFactorInput || !efficiencyInput || !phaseType) return;

      if (!validatePositive(voltage, "voltage (V)")) return;
      if (!validatePositive(current, "current (A)")) return;

      const powerFactor = Number.isFinite(pfRaw) && pfRaw > 0 ? pfRaw : 0.85;
      const effPercent = Number.isFinite(effPercentRaw) && effPercentRaw > 0 ? effPercentRaw : 90;

      if (!Number.isFinite(powerFactor) || powerFactor <= 0 || powerFactor > 1) {
        setResultError("Enter a valid power factor between 0 and 1.");
        return;
      }

      if (!Number.isFinite(effPercent) || effPercent <= 0 || effPercent > 100) {
        setResultError("Enter a valid efficiency percentage between 0 and 100.");
        return;
      }

      const efficiency = effPercent / 100;

      const sqrt3 = 1.7320508075688772;
      const inputWatts =
        phase === "three"
          ? sqrt3 * voltage * current * powerFactor
          : voltage * current * powerFactor;

      const shaftWatts = inputWatts * efficiency;

      const inputkW = inputWatts / 1000;
      const shaftkW = shaftWatts / 1000;
      const shaftHP = shaftkW * 1.34102209;

      const phaseLabel = phase === "three" ? "Three-phase AC" : "Single-phase AC";

      const resultHtml =
        `<p><strong>Estimated input power:</strong> ${formatNumberTwoDecimals(inputkW)} kW</p>` +
        `<p><strong>Estimated shaft power:</strong> ${formatNumberTwoDecimals(shaftkW)} kW</p>` +
        `<p><strong>Estimated shaft power:</strong> ${formatNumberTwoDecimals(shaftHP)} hp</p>` +
        `<p><strong>Assumptions used:</strong> ${phaseLabel}, power factor ${formatNumberTwoDecimals(powerFactor)}, efficiency ${formatNumberTwoDecimals(effPercent)}%</p>`;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Motor Power Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
