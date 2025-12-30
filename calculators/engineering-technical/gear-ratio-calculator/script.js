document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const driverTeethInput = document.getElementById("driverTeeth");
  const drivenTeethInput = document.getElementById("drivenTeeth");
  const inputRpmInput = document.getElementById("inputRpm");
  const inputTorqueInput = document.getElementById("inputTorque");
  const efficiencyInput = document.getElementById("efficiency");

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
  attachLiveFormatting(driverTeethInput);
  attachLiveFormatting(drivenTeethInput);
  attachLiveFormatting(inputRpmInput);
  attachLiveFormatting(inputTorqueInput);
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
      // Parse inputs using toNumber() (from /scripts/main.js)
      const driverTeeth = toNumber(driverTeethInput ? driverTeethInput.value : "");
      const drivenTeeth = toNumber(drivenTeethInput ? drivenTeethInput.value : "");
      const inputRpm = toNumber(inputRpmInput ? inputRpmInput.value : "");
      const inputTorque = toNumber(inputTorqueInput ? inputTorqueInput.value : "");
      const efficiencyRaw = toNumber(efficiencyInput ? efficiencyInput.value : "");

      // Basic existence guard
      if (!driverTeethInput || !drivenTeethInput) return;

      // Validation
      if (!validatePositive(driverTeeth, "driving gear teeth")) return;
      if (!validatePositive(drivenTeeth, "driven gear teeth")) return;

      const teethDriverRounded = Math.round(driverTeeth);
      const teethDrivenRounded = Math.round(drivenTeeth);

      if (!Number.isFinite(teethDriverRounded) || teethDriverRounded <= 0) {
        setResultError("Enter a valid driving gear tooth count greater than 0.");
        return;
      }
      if (!Number.isFinite(teethDrivenRounded) || teethDrivenRounded <= 0) {
        setResultError("Enter a valid driven gear tooth count greater than 0.");
        return;
      }

      // Optional inputs: allow blank
      const hasRpm = Number.isFinite(inputRpm) && inputRpm > 0;
      const hasTorque = Number.isFinite(inputTorque) && inputTorque > 0;

      let efficiencyPct = 100;
      if (Number.isFinite(efficiencyRaw) && efficiencyRaw > 0) {
        efficiencyPct = efficiencyRaw;
      }
      if (efficiencyPct > 100) efficiencyPct = 100;

      // Calculation logic
      // Ratio as reduction: driven / driver
      const ratio = teethDrivenRounded / teethDriverRounded;
      const speedFactor = 1 / ratio; // output speed = input speed * speedFactor
      const torqueFactorIdeal = ratio; // output torque = input torque * ratio
      const efficiencyFactor = efficiencyPct / 100;
      const torqueFactorEffective = torqueFactorIdeal * efficiencyFactor;

      // Derived outputs
      const outputRpm = hasRpm ? inputRpm * speedFactor : null;
      const outputTorque = hasTorque ? inputTorque * torqueFactorEffective : null;

      // Build output HTML
      const ratioText = formatNumberTwoDecimals(ratio);
      const speedFactorText = formatNumberTwoDecimals(speedFactor);
      const torqueFactorText = formatNumberTwoDecimals(torqueFactorEffective);

      let resultHtml = "";
      resultHtml += `<p><strong>Gear ratio (reduction):</strong> ${ratioText}:1</p>`;
      resultHtml += `<p><strong>Speed factor:</strong> output RPM = input RPM × ${speedFactorText}</p>`;
      resultHtml += `<p><strong>Torque multiplier:</strong> output torque ≈ input torque × ${torqueFactorText} (at ${formatNumberTwoDecimals(efficiencyPct)}% efficiency)</p>`;

      if (hasRpm) {
        resultHtml += `<p><strong>Estimated output speed:</strong> ${formatNumberTwoDecimals(outputRpm)} RPM</p>`;
      } else {
        resultHtml += `<p><strong>Estimated output speed:</strong> Add input RPM to calculate an output RPM.</p>`;
      }

      if (hasTorque) {
        resultHtml += `<p><strong>Estimated output torque:</strong> ${formatNumberTwoDecimals(outputTorque)} N·m</p>`;
      } else {
        resultHtml += `<p><strong>Estimated output torque:</strong> Add input torque to calculate an output torque.</p>`;
      }

      resultHtml += `<p><strong>Quick read:</strong> A higher ratio reduces speed and increases torque. A lower ratio increases speed and reduces torque.</p>`;

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
      const message = "Gear Ratio Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
