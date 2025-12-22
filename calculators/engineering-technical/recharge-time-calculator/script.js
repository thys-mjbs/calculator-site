document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const batteryWhInput = document.getElementById("batteryWh");
  const batteryMahInput = document.getElementById("batteryMah");
  const batteryVoltageInput = document.getElementById("batteryVoltage");
  const chargerWattsInput = document.getElementById("chargerWatts");

  const startPercentInput = document.getElementById("startPercent");
  const targetPercentInput = document.getElementById("targetPercent");
  const efficiencyPercentInput = document.getElementById("efficiencyPercent");
  const taperPercentInput = document.getElementById("taperPercent");

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
  attachLiveFormatting(batteryWhInput);
  attachLiveFormatting(batteryMahInput);
  attachLiveFormatting(batteryVoltageInput);
  attachLiveFormatting(chargerWattsInput);
  attachLiveFormatting(startPercentInput);
  attachLiveFormatting(targetPercentInput);
  attachLiveFormatting(efficiencyPercentInput);
  attachLiveFormatting(taperPercentInput);

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
    if (!Number.isFinite(value)) return value;
    return Math.min(Math.max(value, min), max);
  }

  function minutesToReadable(totalMinutes) {
    const minutes = Math.max(0, Math.round(totalMinutes));
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs <= 0) return mins + " min";
    if (mins === 0) return hrs + " hr";
    return hrs + " hr " + mins + " min";
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const batteryWh = toNumber(batteryWhInput ? batteryWhInput.value : "");
      const batteryMah = toNumber(batteryMahInput ? batteryMahInput.value : "");
      const batteryVoltage = toNumber(batteryVoltageInput ? batteryVoltageInput.value : "");
      const chargerWatts = toNumber(chargerWattsInput ? chargerWattsInput.value : "");

      let startPercent = toNumber(startPercentInput ? startPercentInput.value : "");
      let targetPercent = toNumber(targetPercentInput ? targetPercentInput.value : "");
      let efficiencyPercent = toNumber(efficiencyPercentInput ? efficiencyPercentInput.value : "");
      let taperPercent = toNumber(taperPercentInput ? taperPercentInput.value : "");

      // Defaults for optional advanced fields
      if (!Number.isFinite(startPercent)) startPercent = 0;
      if (!Number.isFinite(targetPercent)) targetPercent = 100;
      if (!Number.isFinite(efficiencyPercent)) efficiencyPercent = 85;
      if (!Number.isFinite(taperPercent)) taperPercent = 15;

      startPercent = clamp(startPercent, 0, 100);
      targetPercent = clamp(targetPercent, 0, 100);
      efficiencyPercent = clamp(efficiencyPercent, 1, 100);
      taperPercent = clamp(taperPercent, 0, 200);

      // Input existence guard
      if (!chargerWattsInput || !resultDiv) return;

      // Determine battery energy (Wh)
      let batteryWhResolved = NaN;
      let batteryWhSource = "";

      if (Number.isFinite(batteryWh) && batteryWh > 0) {
        batteryWhResolved = batteryWh;
        batteryWhSource = "Entered Wh";
      } else if (Number.isFinite(batteryMah) && batteryMah > 0 && Number.isFinite(batteryVoltage) && batteryVoltage > 0) {
        batteryWhResolved = (batteryMah / 1000) * batteryVoltage;
        batteryWhSource = "Estimated from mAh × V";
      }

      // Validation
      if (!Number.isFinite(batteryWhResolved) || batteryWhResolved <= 0) {
        setResultError("Enter a battery energy (Wh), or enter both battery capacity (mAh) and voltage (V).");
        return;
      }

      if (!validatePositive(chargerWatts, "charger power (W)")) return;

      if (!validateNonNegative(startPercent, "starting charge (%)")) return;
      if (!validateNonNegative(targetPercent, "target charge (%)")) return;

      if (targetPercent <= startPercent) {
        setResultError("Target charge (%) must be greater than starting charge (%).");
        return;
      }

      const fractionToCharge = (targetPercent - startPercent) / 100;
      const energyNeededWh = batteryWhResolved * fractionToCharge;

      const efficiencyFactor = efficiencyPercent / 100;
      const idealHours = energyNeededWh / (chargerWatts * efficiencyFactor);
      const typicalHours = idealHours * (1 + taperPercent / 100);

      if (!Number.isFinite(idealHours) || idealHours <= 0) {
        setResultError("The inputs produce an invalid result. Check your numbers and try again.");
        return;
      }

      const idealMinutes = idealHours * 60;
      const typicalMinutes = typicalHours * 60;

      // Secondary insight: time per 10% at same assumptions
      const tenPercentMinutesIdeal = idealMinutes * (10 / (targetPercent - startPercent));
      const tenPercentMinutesTypical = typicalMinutes * (10 / (targetPercent - startPercent));

      const effectiveWattsToBattery = chargerWatts * efficiencyFactor;
      const resultHtml = `
        <p><strong>Typical recharge time:</strong> ${minutesToReadable(typicalMinutes)}</p>
        <p><strong>Ideal (no taper) time:</strong> ${minutesToReadable(idealMinutes)}</p>

        <p><strong>Energy to add:</strong> ${formatNumberTwoDecimals(energyNeededWh)} Wh (from ${startPercent}% to ${targetPercent}%)</p>
        <p><strong>Battery size used:</strong> ${formatNumberTwoDecimals(batteryWhResolved)} Wh <span style="font-size:12px;color:#444">(${batteryWhSource})</span></p>
        <p><strong>Effective charging power (after efficiency):</strong> ${formatNumberTwoDecimals(effectiveWattsToBattery)} W</p>

        <p><strong>Rule of thumb for this setup:</strong> ~${minutesToReadable(tenPercentMinutesTypical)} per 10% (typical), ~${minutesToReadable(tenPercentMinutesIdeal)} per 10% (ideal)</p>
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
      const message = "Recharge Time Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
