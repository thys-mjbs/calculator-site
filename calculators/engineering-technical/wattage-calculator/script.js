/* script.js */
document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const modeSelect = document.getElementById("modeSelect");

  const voltsVI = document.getElementById("voltsVI");
  const ampsVI = document.getElementById("ampsVI");

  const voltsVR = document.getElementById("voltsVR");
  const ohmsVR = document.getElementById("ohmsVR");

  const ampsIR = document.getElementById("ampsIR");
  const ohmsIR = document.getElementById("ohmsIR");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  const modeBlockVI = document.getElementById("modeBlockVI");
  const modeBlockVR = document.getElementById("modeBlockVR");
  const modeBlockIR = document.getElementById("modeBlockIR");

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
  attachLiveFormatting(voltsVI);
  attachLiveFormatting(ampsVI);
  attachLiveFormatting(voltsVR);
  attachLiveFormatting(ohmsVR);
  attachLiveFormatting(ampsIR);
  attachLiveFormatting(ohmsIR);

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
    if (modeBlockVI) modeBlockVI.classList.add("hidden");
    if (modeBlockVR) modeBlockVR.classList.add("hidden");
    if (modeBlockIR) modeBlockIR.classList.add("hidden");

    if (mode === "vi" && modeBlockVI) modeBlockVI.classList.remove("hidden");
    if (mode === "vr" && modeBlockVR) modeBlockVR.classList.remove("hidden");
    if (mode === "ir" && modeBlockIR) modeBlockIR.classList.remove("hidden");

    clearResult();
  }

  if (modeSelect) {
    showMode(modeSelect.value);
    modeSelect.addEventListener("change", function () {
      showMode(modeSelect.value);
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

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const mode = modeSelect ? modeSelect.value : "vi";

      let watts = 0;
      let formulaText = "";
      let inputsText = "";

      if (mode === "vi") {
        const v = toNumber(voltsVI ? voltsVI.value : "");
        const i = toNumber(ampsVI ? ampsVI.value : "");

        if (!validatePositive(v, "voltage (V)")) return;
        if (!validatePositive(i, "current (A)")) return;

        watts = v * i;
        formulaText = "P = V × I";
        inputsText = `V = ${formatNumberTwoDecimals(v)} V, I = ${formatNumberTwoDecimals(i)} A`;
      }

      if (mode === "vr") {
        const v = toNumber(voltsVR ? voltsVR.value : "");
        const r = toNumber(ohmsVR ? ohmsVR.value : "");

        if (!validatePositive(v, "voltage (V)")) return;
        if (!validatePositive(r, "resistance (Ω)")) return;

        watts = (v * v) / r;
        formulaText = "P = V² ÷ R";
        inputsText = `V = ${formatNumberTwoDecimals(v)} V, R = ${formatNumberTwoDecimals(r)} Ω`;
      }

      if (mode === "ir") {
        const i = toNumber(ampsIR ? ampsIR.value : "");
        const r = toNumber(ohmsIR ? ohmsIR.value : "");

        if (!validatePositive(i, "current (A)")) return;
        if (!validatePositive(r, "resistance (Ω)")) return;

        watts = (i * i) * r;
        formulaText = "P = I² × R";
        inputsText = `I = ${formatNumberTwoDecimals(i)} A, R = ${formatNumberTwoDecimals(r)} Ω`;
      }

      if (!Number.isFinite(watts) || watts <= 0) {
        setResultError("Enter valid inputs to calculate wattage.");
        return;
      }

      const kw = watts / 1000;

      const resultHtml = `
        <p><strong>Wattage (W):</strong> ${formatNumberTwoDecimals(watts)} W</p>
        <p><strong>Kilowatts (kW):</strong> ${formatNumberTwoDecimals(kw)} kW</p>
        <p><strong>Formula used:</strong> ${formulaText}</p>
        <p><strong>Inputs:</strong> ${inputsText}</p>
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
      const message = "Wattage Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
