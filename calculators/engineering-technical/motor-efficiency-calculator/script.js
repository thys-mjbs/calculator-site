document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const inputPowerKw = document.getElementById("inputPowerKw");
  const outputMethod = document.getElementById("outputMethod");

  const outputPowerKw = document.getElementById("outputPowerKw");
  const torqueNm = document.getElementById("torqueNm");
  const speedRpm = document.getElementById("speedRpm");

  const showAdvanced = document.getElementById("showAdvanced");
  const hoursPerYear = document.getElementById("hoursPerYear");
  const pricePerKwh = document.getElementById("pricePerKwh");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  const modeBlockKw = document.getElementById("modeKwBlock");
  const modeBlockTorqueRpm = document.getElementById("modeTorqueRpmBlock");
  const advancedBlock = document.getElementById("advancedBlock");

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
  attachLiveFormatting(inputPowerKw);
  attachLiveFormatting(outputPowerKw);
  attachLiveFormatting(torqueNm);
  attachLiveFormatting(speedRpm);
  attachLiveFormatting(hoursPerYear);
  attachLiveFormatting(pricePerKwh);

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
    if (modeBlockKw) modeBlockKw.classList.add("hidden");
    if (modeBlockTorqueRpm) modeBlockTorqueRpm.classList.add("hidden");

    if (mode === "kw") {
      if (modeBlockKw) modeBlockKw.classList.remove("hidden");
    } else if (mode === "torqueRpm") {
      if (modeBlockTorqueRpm) modeBlockTorqueRpm.classList.remove("hidden");
    }

    clearResult();
  }

  if (outputMethod) {
    showMode(outputMethod.value);
    outputMethod.addEventListener("change", function () {
      showMode(outputMethod.value);
    });
  }

  // Advanced toggle
  function syncAdvanced() {
    if (!advancedBlock) return;
    if (showAdvanced && showAdvanced.checked) {
      advancedBlock.classList.remove("hidden");
    } else {
      advancedBlock.classList.add("hidden");
    }
    clearResult();
  }

  if (showAdvanced) {
    syncAdvanced();
    showAdvanced.addEventListener("change", syncAdvanced);
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
      const mode = outputMethod ? outputMethod.value : "kw";

      // Parse inputs using toNumber() (from /scripts/main.js)
      const pinKw = toNumber(inputPowerKw ? inputPowerKw.value : "");

      const poutKwDirect = toNumber(outputPowerKw ? outputPowerKw.value : "");
      const tNm = toNumber(torqueNm ? torqueNm.value : "");
      const rpm = toNumber(speedRpm ? speedRpm.value : "");

      const advOn = !!(showAdvanced && showAdvanced.checked);
      const hrs = toNumber(hoursPerYear ? hoursPerYear.value : "");
      const price = toNumber(pricePerKwh ? pricePerKwh.value : "");

      // Basic existence guard
      if (!inputPowerKw || !resultDiv) return;

      // Validation
      if (!validatePositive(pinKw, "electrical input power (kW)")) return;

      let poutKw = NaN;

      if (mode === "kw") {
        if (!validatePositive(poutKwDirect, "mechanical output power (kW)")) return;
        poutKw = poutKwDirect;
      } else if (mode === "torqueRpm") {
        if (!validatePositive(tNm, "torque (N·m)")) return;
        if (!validatePositive(rpm, "speed (RPM)")) return;

        // P(W) = T(Nm) * omega(rad/s), omega = 2π * RPM / 60
        const omega = (2 * Math.PI * rpm) / 60;
        const poutW = tNm * omega;
        poutKw = poutW / 1000;
      } else {
        setResultError("Select a valid output method.");
        return;
      }

      if (!Number.isFinite(poutKw) || poutKw <= 0) {
        setResultError("Enter a valid mechanical output greater than 0.");
        return;
      }

      if (poutKw > pinKw) {
        setResultError("Your inputs imply output power is higher than input power. Re-check measurement points and units.");
        return;
      }

      const efficiency = (poutKw / pinKw) * 100;
      const lossKw = pinKw - poutKw;
      const lossPercent = (lossKw / pinKw) * 100;

      // Optional cost estimate
      let costLine = "";
      if (advOn) {
        const defaultHours = 2000;
        const useHours = Number.isFinite(hrs) && hrs > 0 ? hrs : defaultHours;

        // Energy lost (kWh/year) = loss(kW) * hours
        const lossKwhYear = lossKw * useHours;

        if (Number.isFinite(price) && price > 0) {
          const lossCostYear = lossKwhYear * price;
          costLine = `
            <p><strong>Estimated annual loss:</strong> ${formatNumberTwoDecimals(lossKwhYear)} kWh per year (about ${formatNumberTwoDecimals(lossCostYear)} per year at your price).</p>
          `;
        } else {
          costLine = `
            <p><strong>Estimated annual loss:</strong> ${formatNumberTwoDecimals(lossKwhYear)} kWh per year (using ${formatNumberTwoDecimals(useHours)} hours per year).</p>
          `;
        }
      }

      const resultHtml = `
        <p><strong>Estimated motor efficiency:</strong> ${formatNumberTwoDecimals(efficiency)}%</p>
        <p><strong>Power loss:</strong> ${formatNumberTwoDecimals(lossKw)} kW (${formatNumberTwoDecimals(lossPercent)}% of input)</p>
        <p><strong>Input power:</strong> ${formatNumberTwoDecimals(pinKw)} kW</p>
        <p><strong>Mechanical output power:</strong> ${formatNumberTwoDecimals(poutKw)} kW</p>
        ${costLine}
        <p><strong>Interpretation:</strong> Losses mainly become heat. If your efficiency is unusually low, confirm the motor is under load and that input power is real kW measured at steady state.</p>
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
      const message = "Motor Efficiency Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
