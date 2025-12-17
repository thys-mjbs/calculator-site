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

  const resistanceOhmsRX = document.getElementById("resistanceOhmsRX");
  const reactanceOhmsRX = document.getElementById("reactanceOhmsRX");

  const resistanceOhmsRLC = document.getElementById("resistanceOhmsRLC");
  const frequencyHz = document.getElementById("frequencyHz");
  const inductanceH = document.getElementById("inductanceH");
  const capacitanceF = document.getElementById("capacitanceF");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  const modeBlockRX = document.getElementById("modeBlockRX");
  const modeBlockRLC = document.getElementById("modeBlockRLC");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(resistanceOhmsRX);
  attachLiveFormatting(reactanceOhmsRX);
  attachLiveFormatting(resistanceOhmsRLC);
  attachLiveFormatting(frequencyHz);
  attachLiveFormatting(inductanceH);
  attachLiveFormatting(capacitanceF);

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
    if (!modeBlockRX || !modeBlockRLC) return;

    modeBlockRX.classList.add("hidden");
    modeBlockRLC.classList.add("hidden");

    if (mode === "rlc") modeBlockRLC.classList.remove("hidden");
    else modeBlockRX.classList.remove("hidden");

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

  function validateNonNegative(value, fieldLabel) {
    if (!Number.isFinite(value) || value < 0) {
      setResultError("Enter a valid " + fieldLabel + " (0 or higher).");
      return false;
    }
    return true;
  }

  function validateFinite(value, fieldLabel) {
    if (!Number.isFinite(value)) {
      setResultError("Enter a valid " + fieldLabel + ".");
      return false;
    }
    return true;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  function toDegrees(rad) {
    return (rad * 180) / Math.PI;
  }

  function formatSignedNumberTwoDecimals(value) {
    const abs = Math.abs(value);
    const formatted = formatNumberTwoDecimals(abs);
    return value < 0 ? "-" + formatted : formatted;
  }

  function classifyReactance(x) {
    if (!Number.isFinite(x) || x === 0) return "resistive";
    return x > 0 ? "inductive" : "capacitive";
  }

  function computeFromRX(R, X) {
    const Zmag = Math.sqrt(R * R + X * X);

    let phaseDeg = 0;
    if (R === 0 && X === 0) {
      phaseDeg = 0;
    } else if (R === 0) {
      phaseDeg = X > 0 ? 90 : -90;
    } else {
      phaseDeg = toDegrees(Math.atan(X / R));
    }

    const pf = Math.cos((phaseDeg * Math.PI) / 180);
    const type = classifyReactance(X);

    const nearThreshold = 0.01 * Math.max(1, Math.abs(R));
    const nearResonance = Math.abs(X) <= nearThreshold && Zmag > 0;

    return { Zmag, phaseDeg, pf, type, nearResonance };
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const mode = modeSelect ? modeSelect.value : "r-x";

      if (mode === "rlc") {
        if (!resistanceOhmsRLC || !frequencyHz || !inductanceH || !capacitanceF) return;

        const R = toNumber(resistanceOhmsRLC.value);
        const f = toNumber(frequencyHz.value);
        const L = toNumber(inductanceH.value);
        const C = toNumber(capacitanceF.value);

        if (!validateNonNegative(R, "resistance (Ω)")) return;
        if (!validatePositive(f, "frequency (Hz)")) return;
        if (!validateNonNegative(L, "inductance (H)")) return;
        if (!validateNonNegative(C, "capacitance (F)")) return;

        const omega = 2 * Math.PI * f;

        const XL = L > 0 ? omega * L : 0;
        const XC = C > 0 ? 1 / (omega * C) : 0;

        const X = XL - XC;

        const computed = computeFromRX(R, X);

        const rect = `${formatNumberTwoDecimals(R)} + j${formatSignedNumberTwoDecimals(X)} Ω`;
        const zmagStr = `${formatNumberTwoDecimals(computed.Zmag)} Ω`;
        const phaseStr = `${formatNumberTwoDecimals(computed.phaseDeg)}°`;
        const pfStr = `${formatNumberTwoDecimals(Math.abs(computed.pf))}`;

        const leadLag =
          computed.type === "inductive"
            ? "Current lags voltage (inductive)."
            : computed.type === "capacitive"
              ? "Current leads voltage (capacitive)."
              : "No lead or lag (purely resistive).";

        const insight =
          computed.nearResonance
            ? "Secondary insight: Net reactance is very close to 0 at this frequency, so the circuit behaves close to resistive (near resonance in a simple series model)."
            : "Secondary insight: Net reactance is not near 0 at this frequency, so the circuit has a noticeable reactive component.";

        const resultHtml = `
          <p><strong>Impedance magnitude |Z|:</strong> ${zmagStr}</p>
          <p><strong>Phase angle:</strong> ${phaseStr}</p>
          <p><strong>Rectangular form:</strong> ${rect}</p>
          <p><strong>Power factor (approx.):</strong> ${pfStr} (${computed.type})</p>
          <p>${leadLag}</p>
          <hr>
          <p><strong>Derived reactance at ${formatNumberTwoDecimals(f)} Hz:</strong></p>
          <p>XL (inductive): ${formatNumberTwoDecimals(XL)} Ω</p>
          <p>XC (capacitive): ${formatNumberTwoDecimals(XC)} Ω</p>
          <p>Net X = XL − XC: ${formatSignedNumberTwoDecimals(X)} Ω</p>
          <p>${insight}</p>
        `;

        setResultSuccess(resultHtml);
        return;
      }

      // Default: R and X
      if (!resistanceOhmsRX || !reactanceOhmsRX) return;

      const R = toNumber(resistanceOhmsRX.value);
      const X = toNumber(reactanceOhmsRX.value);

      if (!validateNonNegative(R, "resistance (Ω)")) return;
      if (!validateFinite(X, "reactance (Ω)")) return;

      const computed = computeFromRX(R, X);

      const rect = `${formatNumberTwoDecimals(R)} + j${formatSignedNumberTwoDecimals(X)} Ω`;
      const zmagStr = `${formatNumberTwoDecimals(computed.Zmag)} Ω`;
      const phaseStr = `${formatNumberTwoDecimals(computed.phaseDeg)}°`;
      const pfStr = `${formatNumberTwoDecimals(Math.abs(computed.pf))}`;

      const leadLag =
        computed.type === "inductive"
          ? "Current lags voltage (inductive)."
          : computed.type === "capacitive"
            ? "Current leads voltage (capacitive)."
            : "No lead or lag (purely resistive).";

      const insight =
        computed.nearResonance
          ? "Secondary insight: Reactance is very small compared to resistance, so the load behaves close to resistive and power factor will be relatively high."
          : "Secondary insight: Reactance is significant relative to resistance, so phase shift and power factor effects will be noticeable.";

      const resultHtml = `
        <p><strong>Impedance magnitude |Z|:</strong> ${zmagStr}</p>
        <p><strong>Phase angle:</strong> ${phaseStr}</p>
        <p><strong>Rectangular form:</strong> ${rect}</p>
        <p><strong>Power factor (approx.):</strong> ${pfStr} (${computed.type})</p>
        <p>${leadLag}</p>
        <p>${insight}</p>
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
      const message = "Impedance Calculator (Basic) - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
