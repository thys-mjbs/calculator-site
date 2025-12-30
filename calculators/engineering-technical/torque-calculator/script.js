document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const powerKwInput = document.getElementById("powerKw");
  const rpmInput = document.getElementById("rpm");
  const efficiencyPctInput = document.getElementById("efficiencyPct");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (Not used for this calculator)

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Attach formatting where it makes sense
  attachLiveFormatting(powerKwInput);
  attachLiveFormatting(rpmInput);
  attachLiveFormatting(efficiencyPctInput);

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

  function validateEfficiency(valuePct) {
    if (!Number.isFinite(valuePct)) return true;
    if (valuePct <= 0 || valuePct > 100) {
      setResultError("Enter a drivetrain efficiency between 0 and 100, or leave it blank.");
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
      const powerKw = toNumber(powerKwInput ? powerKwInput.value : "");
      const rpm = toNumber(rpmInput ? rpmInput.value : "");
      const efficiencyPctRaw = toNumber(efficiencyPctInput ? efficiencyPctInput.value : "");

      // Input existence guard
      if (!powerKwInput || !rpmInput) return;

      // Validation
      if (!validatePositive(powerKw, "load power (kW)")) return;
      if (!validatePositive(rpm, "speed (RPM)")) return;

      const hasEfficiency = Number.isFinite(efficiencyPctRaw) && efficiencyPctRaw > 0;
      const efficiencyPct = hasEfficiency ? efficiencyPctRaw : 100;

      if (!validateEfficiency(efficiencyPctRaw)) return;

      // Calculation logic
      // Torque (N·m) from kW and RPM:
      // T = 9550 * P(kW) / RPM
      const loadTorqueNm = (9550 * powerKw) / rpm;

      const effFactor = efficiencyPct / 100;
      const motorPowerKw = powerKw / effFactor;
      const motorTorqueNm = (9550 * motorPowerKw) / rpm;

      const loadTorqueLbFt = loadTorqueNm * 0.737562149;
      const motorTorqueLbFt = motorTorqueNm * 0.737562149;

      // Practical reference at 1 m radius
      const forceAt1mN = loadTorqueNm; // F = T / r, with r = 1 m

      // Build output HTML
      const loadTorqueNmStr = formatNumberTwoDecimals(loadTorqueNm);
      const loadTorqueLbFtStr = formatNumberTwoDecimals(loadTorqueLbFt);
      const motorTorqueNmStr = formatNumberTwoDecimals(motorTorqueNm);
      const motorTorqueLbFtStr = formatNumberTwoDecimals(motorTorqueLbFt);
      const forceAt1mNStr = formatNumberTwoDecimals(forceAt1mN);
      const effStr = formatNumberTwoDecimals(efficiencyPct);

      let resultHtml = `
        <div class="result-grid">
          <div class="result-row">
            <span class="result-label">Load torque</span>
            <span class="result-value">${loadTorqueNmStr} N·m</span>
          </div>
          <div class="result-row">
            <span class="result-label">Load torque (imperial)</span>
            <span class="result-value">${loadTorqueLbFtStr} lb·ft</span>
          </div>
          <div class="result-row">
            <span class="result-label">Force at 1 m radius</span>
            <span class="result-value">${forceAt1mNStr} N</span>
          </div>
        </div>
      `;

      if (efficiencyPct !== 100) {
        resultHtml += `
          <div class="result-note">
            Using ${effStr}% efficiency, estimated motor torque to deliver the same load power:
            <strong>${motorTorqueNmStr} N·m</strong> (${motorTorqueLbFtStr} lb·ft).
          </div>
        `;
      } else {
        resultHtml += `
          <div class="result-note">
            Efficiency assumed as 100%, so motor torque equals load torque for this estimate.
          </div>
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
      const message = "Torque Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
