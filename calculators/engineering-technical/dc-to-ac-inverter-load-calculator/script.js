document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const acWattsInput = document.getElementById("acWatts");
  const surgeWattsInput = document.getElementById("surgeWatts");
  const dcVoltageInput = document.getElementById("dcVoltage");

  const efficiencyPctInput = document.getElementById("efficiencyPct");
  const powerFactorInput = document.getElementById("powerFactor");
  const headroomPctInput = document.getElementById("headroomPct");
  const surgeHeadroomPctInput = document.getElementById("surgeHeadroomPct");
  const batteryAhInput = document.getElementById("batteryAh");
  const usablePctInput = document.getElementById("usablePct");

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

  // Add every input that should live-format with commas
  attachLiveFormatting(acWattsInput);
  attachLiveFormatting(surgeWattsInput);
  attachLiveFormatting(dcVoltageInput);
  attachLiveFormatting(efficiencyPctInput);
  attachLiveFormatting(headroomPctInput);
  attachLiveFormatting(surgeHeadroomPctInput);
  attachLiveFormatting(batteryAhInput);
  attachLiveFormatting(usablePctInput);

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
    if (!Number.isFinite(value)) return NaN;
    return Math.min(max, Math.max(min, value));
  }

  function roundUpToFuseSize(amps) {
    const sizes = [5, 7.5, 10, 15, 20, 25, 30, 40, 50, 60, 80, 100, 125, 150, 175, 200, 225, 250, 300, 350, 400];
    for (let i = 0; i < sizes.length; i++) {
      if (amps <= sizes[i]) return sizes[i];
    }
    return Math.ceil(amps / 50) * 50;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const acWatts = toNumber(acWattsInput ? acWattsInput.value : "");
      const surgeWattsRaw = toNumber(surgeWattsInput ? surgeWattsInput.value : "");
      const dcVoltageRaw = toNumber(dcVoltageInput ? dcVoltageInput.value : "");

      const efficiencyPctRaw = toNumber(efficiencyPctInput ? efficiencyPctInput.value : "");
      const powerFactorRaw = toNumber(powerFactorInput ? powerFactorInput.value : "");
      const headroomPctRaw = toNumber(headroomPctInput ? headroomPctInput.value : "");
      const surgeHeadroomPctRaw = toNumber(surgeHeadroomPctInput ? surgeHeadroomPctInput.value : "");
      const batteryAhRaw = toNumber(batteryAhInput ? batteryAhInput.value : "");
      const usablePctRaw = toNumber(usablePctInput ? usablePctInput.value : "");

      // Basic existence guard
      if (!acWattsInput || !dcVoltageInput) return;

      // Validation (required inputs)
      if (!validatePositive(acWatts, "total running load (AC watts)")) return;

      // DC voltage: allow common values, but accept any sensible positive voltage
      const dcVoltage = Number.isFinite(dcVoltageRaw) && dcVoltageRaw > 0 ? dcVoltageRaw : 12;
      if (!validatePositive(dcVoltage, "DC system voltage (V)")) return;

      // Optional surge watts
      const surgeWatts = Number.isFinite(surgeWattsRaw) && surgeWattsRaw > 0 ? surgeWattsRaw : 0;

      // Advanced defaults (optional inputs must not block output)
      const efficiencyPct = Number.isFinite(efficiencyPctRaw) && efficiencyPctRaw > 0 ? efficiencyPctRaw : 90;
      const efficiency = clamp(efficiencyPct / 100, 0.5, 0.98);
      if (!Number.isFinite(efficiency)) {
        setResultError("Enter a valid inverter efficiency (%).");
        return;
      }

      const powerFactor = Number.isFinite(powerFactorRaw) && powerFactorRaw > 0 ? clamp(powerFactorRaw, 0.5, 1.0) : 0.9;
      if (!Number.isFinite(powerFactor)) {
        setResultError("Enter a valid power factor between 0.5 and 1.0.");
        return;
      }

      const headroomPct = Number.isFinite(headroomPctRaw) && headroomPctRaw >= 0 ? clamp(headroomPctRaw, 0, 200) : 25;
      const surgeHeadroomPct = Number.isFinite(surgeHeadroomPctRaw) && surgeHeadroomPctRaw >= 0 ? clamp(surgeHeadroomPctRaw, 0, 200) : 10;

      // Calculation logic
      const runningVA = acWatts / powerFactor;
      const surgeVA = surgeWatts > 0 ? surgeWatts / powerFactor : 0;

      const recommendedContinuousVA = runningVA * (1 + headroomPct / 100);
      const recommendedContinuousW = acWatts * (1 + headroomPct / 100);

      const recommendedSurgeVA = surgeVA > 0 ? surgeVA * (1 + surgeHeadroomPct / 100) : 0;
      const recommendedSurgeW = surgeWatts > 0 ? surgeWatts * (1 + surgeHeadroomPct / 100) : 0;

      const dcCurrentRunning = (acWatts / (dcVoltage * efficiency));
      const dcCurrentSurge = surgeWatts > 0 ? (surgeWatts / (dcVoltage * efficiency)) : 0;

      // Fuse estimate: base on worst-case (surge if provided, else running), then step up with margin
      const worstCurrent = dcCurrentSurge > 0 ? dcCurrentSurge : dcCurrentRunning;
      const fuseTarget = worstCurrent * 1.25;
      const fuseSize = roundUpToFuseSize(fuseTarget);

      // Optional runtime estimate (only if battery Ah provided)
      let runtimeHtml = "";
      const batteryAh = Number.isFinite(batteryAhRaw) && batteryAhRaw > 0 ? batteryAhRaw : 0;
      const usablePct = Number.isFinite(usablePctRaw) && usablePctRaw > 0 ? clamp(usablePctRaw, 10, 100) : 80;

      if (batteryAh > 0) {
        const usableFraction = usablePct / 100;
        const usableWh = dcVoltage * batteryAh * usableFraction;
        const dcPowerRunning = acWatts / efficiency; // approximate DC power draw
        const runtimeHours = dcPowerRunning > 0 ? (usableWh / dcPowerRunning) : 0;

        // Convert to hours + minutes for readability
        const totalMinutes = Math.max(0, Math.round(runtimeHours * 60));
        const hoursPart = Math.floor(totalMinutes / 60);
        const minsPart = totalMinutes % 60;

        runtimeHtml = `
          <p><strong>Estimated runtime (rough):</strong> ${hoursPart}h ${minsPart}m at the running load</p>
          <p style="margin-top:6px;"><em>This is a planning estimate and can be shorter under high current draw, cold temperatures, or older batteries.</em></p>
        `;
      }

      // Build output HTML
      const runningWText = formatNumberTwoDecimals(acWatts);
      const runningVAText = formatNumberTwoDecimals(runningVA);

      const recContWText = formatNumberTwoDecimals(recommendedContinuousW);
      const recContVAText = formatNumberTwoDecimals(recommendedContinuousVA);

      const dcRunAText = formatNumberTwoDecimals(dcCurrentRunning);

      let surgeBlock = "";
      if (surgeWatts > 0) {
        const surgeWText = formatNumberTwoDecimals(surgeWatts);
        const surgeVAText = formatNumberTwoDecimals(surgeVA);
        const recSurgeWText = formatNumberTwoDecimals(recommendedSurgeW);
        const recSurgeVAText = formatNumberTwoDecimals(recommendedSurgeVA);
        const dcSurgeAText = formatNumberTwoDecimals(dcCurrentSurge);

        surgeBlock = `
          <p><strong>Surge load:</strong> ${surgeWText} W (≈ ${surgeVAText} VA at PF ${powerFactor})</p>
          <p><strong>Recommended inverter surge rating:</strong> ≥ ${recSurgeWText} W (≈ ${recSurgeVAText} VA)</p>
          <p><strong>Estimated DC current at surge:</strong> ≈ ${dcSurgeAText} A</p>
        `;
      } else {
        surgeBlock = `
          <p><strong>Surge load:</strong> Not provided. If you have motors or compressors, check starting watts and rerun for better sizing.</p>
        `;
      }

      const resultHtml = `
        <p><strong>Running load:</strong> ${runningWText} W (≈ ${runningVAText} VA at PF ${powerFactor})</p>
        <p><strong>Recommended inverter continuous rating:</strong> ≥ ${recContWText} W (≈ ${recContVAText} VA)</p>

        ${surgeBlock}

        <p><strong>Estimated DC current at running load:</strong> ≈ ${dcRunAText} A</p>
        <p><strong>Suggested DC-side fuse / breaker size:</strong> ${fuseSize} A</p>

        <p style="margin-top:10px;"><strong>Assumptions used:</strong> ${efficiencyPct}% efficiency, ${headroomPct}% continuous headroom${surgeWatts > 0 ? ", " + surgeHeadroomPct + "% surge headroom" : ""}.</p>

        ${runtimeHtml}
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
      const message = "DC to AC Inverter Load Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
