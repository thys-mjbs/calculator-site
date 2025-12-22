document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const loadWattsInput = document.getElementById("loadWatts");
  const batteryVoltageInput = document.getElementById("batteryVoltage");
  const runtimeHoursInput = document.getElementById("runtimeHours");

  const efficiencyPercentInput = document.getElementById("efficiencyPercent");
  const dodPercentInput = document.getElementById("dodPercent");
  const singleBatteryAhInput = document.getElementById("singleBatteryAh");
  const singleBatteryVoltageInput = document.getElementById("singleBatteryVoltage");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(loadWattsInput);
  attachLiveFormatting(batteryVoltageInput);
  attachLiveFormatting(runtimeHoursInput);
  attachLiveFormatting(efficiencyPercentInput);
  attachLiveFormatting(dodPercentInput);
  attachLiveFormatting(singleBatteryAhInput);
  attachLiveFormatting(singleBatteryVoltageInput);

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

  function validatePercent(value, fieldLabel) {
    if (!Number.isFinite(value) || value <= 0 || value > 100) {
      setResultError("Enter a valid " + fieldLabel + " between 0 and 100.");
      return false;
    }
    return true;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse required inputs
      const loadWatts = toNumber(loadWattsInput ? loadWattsInput.value : "");
      const batteryVoltage = toNumber(
        batteryVoltageInput ? batteryVoltageInput.value : ""
      );
      const runtimeHours = toNumber(
        runtimeHoursInput ? runtimeHoursInput.value : ""
      );

      // Guards
      if (!loadWattsInput || !batteryVoltageInput || !runtimeHoursInput) return;

      // Required validation
      if (!validatePositive(loadWatts, "device load (watts)")) return;
      if (!validatePositive(batteryVoltage, "battery/system voltage")) return;
      if (!validatePositive(runtimeHours, "runtime (hours)")) return;

      // Advanced inputs with defaults (never required)
      let efficiencyPercent = toNumber(
        efficiencyPercentInput ? efficiencyPercentInput.value : ""
      );
      if (!Number.isFinite(efficiencyPercent) || efficiencyPercent <= 0) {
        efficiencyPercent = 90;
      }

      let dodPercent = toNumber(dodPercentInput ? dodPercentInput.value : "");
      if (!Number.isFinite(dodPercent) || dodPercent <= 0) {
        dodPercent = 80;
      }

      // Clamp advanced % values sensibly, but error if wildly invalid
      if (!validatePercent(efficiencyPercent, "system efficiency (%)")) return;
      if (!validatePercent(dodPercent, "depth of discharge (%)")) return;

      const efficiency = efficiencyPercent / 100;
      const dod = dodPercent / 100;

      // Calculation logic (locked intent: size battery capacity for a watt load over time)
      // 1) Device energy needed: Wh = W * h
      const deviceEnergyWh = loadWatts * runtimeHours;

      // 2) Account for system losses (inverter/wiring): required battery-side energy
      const requiredFromBatteryWh = deviceEnergyWh / efficiency;

      // 3) Account for usable DoD: nominal battery capacity needed
      const nominalBatteryWhNeeded = requiredFromBatteryWh / dod;

      // 4) Convert to Ah at the system voltage: Ah = Wh / V
      const nominalAhNeeded = nominalBatteryWhNeeded / batteryVoltage;

      // Practical recommendation: add a small buffer and round up
      const recommendedAh = Math.ceil(nominalAhNeeded * 1.15);

      // Optional: estimate number of batteries
      const singleBatteryAh = toNumber(singleBatteryAhInput ? singleBatteryAhInput.value : "");
      const singleBatteryVoltage = toNumber(
        singleBatteryVoltageInput ? singleBatteryVoltageInput.value : ""
      );

      let batteryCountHtml = `<p class="muted">Battery count estimate: add your typical single battery size in Advanced to see an estimate.</p>`;

      if (
        Number.isFinite(singleBatteryAh) &&
        singleBatteryAh > 0 &&
        Number.isFinite(singleBatteryVoltage) &&
        singleBatteryVoltage > 0
      ) {
        // Series count to reach system voltage (rounded up)
        const seriesCount = Math.max(1, Math.ceil(batteryVoltage / singleBatteryVoltage));

        // Parallel strings to meet Ah recommendation
        const parallelCount = Math.max(1, Math.ceil(recommendedAh / singleBatteryAh));

        const totalBatteries = seriesCount * parallelCount;

        batteryCountHtml = `
          <div class="result-note">
            <p><strong>Battery count estimate (advanced):</strong></p>
            <ul>
              <li>Series (to reach ~${formatNumberTwoDecimals(batteryVoltage)}V): <strong>${seriesCount}</strong></li>
              <li>Parallel (to reach ~${recommendedAh}Ah): <strong>${parallelCount}</strong></li>
              <li>Total batteries (series × parallel): <strong>${totalBatteries}</strong></li>
            </ul>
            <p class="muted">This is a sizing guide only. Real wiring and manufacturer limits may change what is safe or practical.</p>
          </div>
        `;
      }

      const resultHtml = `
        <div class="result-grid">
          <div class="result-row">
            <span class="result-label">Minimum nominal capacity</span>
            <span class="result-value">${formatNumberTwoDecimals(nominalAhNeeded)} Ah</span>
          </div>
          <div class="result-row">
            <span class="result-label">Energy (device)</span>
            <span class="result-value">${formatNumberTwoDecimals(deviceEnergyWh)} Wh</span>
          </div>
          <div class="result-row">
            <span class="result-label">Energy from battery (with losses)</span>
            <span class="result-value">${formatNumberTwoDecimals(requiredFromBatteryWh)} Wh</span>
          </div>
          <div class="result-row">
            <span class="result-label">Nominal battery energy needed</span>
            <span class="result-value">${formatNumberTwoDecimals(nominalBatteryWhNeeded)} Wh</span>
          </div>
          <div class="result-row">
            <span class="result-label">Practical recommendation</span>
            <span class="result-value"><strong>${recommendedAh} Ah</strong></span>
          </div>
        </div>

        <p class="result-note">
          Assumptions used: efficiency <strong>${formatNumberTwoDecimals(efficiencyPercent)}%</strong>, usable DoD <strong>${formatNumberTwoDecimals(dodPercent)}%</strong>.
        </p>

        ${batteryCountHtml}
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
      const message = "Battery Capacity Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
