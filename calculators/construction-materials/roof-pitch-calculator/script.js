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

  const riseInput = document.getElementById("riseInput");
  const runInput = document.getElementById("runInput");

  const angleInput = document.getElementById("angleInput");
  const runAngleInput = document.getElementById("runAngleInput");

  const runLengthInput = document.getElementById("runLengthInput");

  const modeRiseRun = document.getElementById("modeRiseRun");
  const modeAngleRun = document.getElementById("modeAngleRun");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(riseInput);
  attachLiveFormatting(runInput);
  attachLiveFormatting(angleInput);
  attachLiveFormatting(runAngleInput);
  attachLiveFormatting(runLengthInput);

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
  // 4) OPTIONAL MODE HANDLING
  // ------------------------------------------------------------
  function showMode(mode) {
    if (modeRiseRun) modeRiseRun.classList.add("hidden");
    if (modeAngleRun) modeAngleRun.classList.add("hidden");

    if (mode === "angleRun") {
      if (modeAngleRun) modeAngleRun.classList.remove("hidden");
    } else {
      if (modeRiseRun) modeRiseRun.classList.remove("hidden");
    }

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

  function validateAngleDegrees(value) {
    if (!Number.isFinite(value) || value <= 0 || value >= 89.9) {
      setResultError("Enter a valid roof angle between 0 and 89.9 degrees.");
      return false;
    }
    return true;
  }

  function formatPitchNearestQuarter(pitchPer12) {
    const rounded = Math.round(pitchPer12 * 4) / 4;
    const whole = Math.floor(rounded);
    const frac = rounded - whole;

    let fracText = "";
    if (Math.abs(frac - 0.25) < 1e-9) fracText = " 1/4";
    else if (Math.abs(frac - 0.5) < 1e-9) fracText = " 1/2";
    else if (Math.abs(frac - 0.75) < 1e-9) fracText = " 3/4";

    if (whole === 0 && fracText) return fracText.trim() + "/12";
    if (fracText) return String(whole) + fracText + "/12";
    return String(whole) + "/12";
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const mode = modeSelect ? modeSelect.value : "riseRun";

      let rise = NaN;
      let run = NaN;
      let angleDeg = NaN;

      const runLength = toNumber(runLengthInput ? runLengthInput.value : "");

      if (mode === "angleRun") {
        angleDeg = toNumber(angleInput ? angleInput.value : "");
        run = toNumber(runAngleInput ? runAngleInput.value : "");

        if (!validateAngleDegrees(angleDeg)) return;
        if (!validatePositive(run, "reference run")) return;

        const angleRad = (angleDeg * Math.PI) / 180;
        rise = Math.tan(angleRad) * run;
      } else {
        rise = toNumber(riseInput ? riseInput.value : "");
        run = toNumber(runInput ? runInput.value : "");

        if (!validatePositive(rise, "rise")) return;
        if (!validatePositive(run, "run")) return;

        angleDeg = (Math.atan(rise / run) * 180) / Math.PI;
      }

      const slope = rise / run;
      const pitchPer12 = slope * 12;
      const slopePercent = slope * 100;

      const pitchNearestQuarter = formatPitchNearestQuarter(pitchPer12);

      let rafterHtml = "";
      let runLenHtml = "";
      if (Number.isFinite(runLength) && runLength > 0) {
        const riseForRunLength = runLength * slope;

        let rafterLength = NaN;
        if (mode === "angleRun") {
          const angleRad = (angleDeg * Math.PI) / 180;
          rafterLength = runLength / Math.cos(angleRad);
        } else {
          rafterLength = Math.sqrt(runLength * runLength + riseForRunLength * riseForRunLength);
        }

        runLenHtml = `
          <div class="result-row">
            <span>Rise over that run</span>
            <span>${formatNumberTwoDecimals(riseForRunLength)}</span>
          </div>
        `;

        rafterHtml = `
          <div class="result-row">
            <span>Estimated rafter length</span>
            <span>${formatNumberTwoDecimals(rafterLength)}</span>
          </div>
        `;
      } else if (runLengthInput && runLengthInput.value.trim() !== "") {
        setResultError("Optional run length must be greater than 0, or leave it blank.");
        return;
      }

      const resultHtml = `
        <div class="result-grid">
          <div class="result-row">
            <span>Pitch (per 12)</span>
            <span>${formatNumberTwoDecimals(pitchPer12)}/12</span>
          </div>

          <div class="result-row">
            <span>Common pitch (nearest 1/4)</span>
            <span>${pitchNearestQuarter}</span>
          </div>

          <div class="result-row">
            <span>Roof angle</span>
            <span>${formatNumberTwoDecimals(angleDeg)}°</span>
          </div>

          <div class="result-row">
            <span>Slope</span>
            <span>${formatNumberTwoDecimals(slopePercent)}%</span>
          </div>

          ${runLenHtml}
          ${rafterHtml}
        </div>
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
      const message = "Roof Pitch Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
