document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const capacityUnit = document.getElementById("capacityUnit");
  const capacityMah = document.getElementById("capacityMah");
  const batteryVoltage = document.getElementById("batteryVoltage");
  const capacityWh = document.getElementById("capacityWh");
  const devicePower = document.getElementById("devicePower");
  const efficiencyPercent = document.getElementById("efficiencyPercent");
  const usablePercent = document.getElementById("usablePercent");

  const capacityMahBlock = document.getElementById("capacityMahBlock");
  const capacityWhBlock = document.getElementById("capacityWhBlock");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(capacityMah);
  attachLiveFormatting(batteryVoltage);
  attachLiveFormatting(capacityWh);
  attachLiveFormatting(devicePower);
  attachLiveFormatting(efficiencyPercent);
  attachLiveFormatting(usablePercent);

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
    if (capacityMahBlock) capacityMahBlock.classList.add("hidden");
    if (capacityWhBlock) capacityWhBlock.classList.add("hidden");

    if (mode === "wh") {
      if (capacityWhBlock) capacityWhBlock.classList.remove("hidden");
    } else {
      if (capacityMahBlock) capacityMahBlock.classList.remove("hidden");
    }

    clearResult();
  }

  if (capacityUnit) {
    showMode(capacityUnit.value);
    capacityUnit.addEventListener("change", function () {
      showMode(capacityUnit.value);
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

  function clampPercent(value, fallback) {
    if (!Number.isFinite(value)) return fallback;
    if (value <= 0) return fallback;
    if (value > 100) return 100;
    return value;
  }

  function hoursToHoursMinutes(hours) {
    if (!Number.isFinite(hours) || hours < 0) return "";
    const totalMinutes = Math.round(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    const mm = String(m).padStart(2, "0");
    return h + "h " + mm + "m";
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const mode = capacityUnit ? capacityUnit.value : "mah";

      const powerW = toNumber(devicePower ? devicePower.value : "");

      let nominalWh = NaN;

      if (mode === "wh") {
        const wh = toNumber(capacityWh ? capacityWh.value : "");
        nominalWh = wh;
      } else {
        const mah = toNumber(capacityMah ? capacityMah.value : "");
        const vRaw = toNumber(batteryVoltage ? batteryVoltage.value : "");
        const v = Number.isFinite(vRaw) && vRaw > 0 ? vRaw : 3.7;
        nominalWh = (mah / 1000) * v;
      }

      const effRaw = toNumber(efficiencyPercent ? efficiencyPercent.value : "");
      const usableRaw = toNumber(usablePercent ? usablePercent.value : "");

      const efficiency = clampPercent(effRaw, 85);
      const usable = clampPercent(usableRaw, 90);

      if (!validatePositive(powerW, "device power draw (W)")) return;

      if (mode === "wh") {
        if (!validatePositive(nominalWh, "battery capacity (Wh)")) return;
      } else {
        const mahCheck = toNumber(capacityMah ? capacityMah.value : "");
        if (!validatePositive(mahCheck, "battery capacity (mAh)")) return;

        const vCheckRaw = toNumber(batteryVoltage ? batteryVoltage.value : "");
        if (Number.isFinite(vCheckRaw) && vCheckRaw <= 0) {
          setResultError("Battery voltage must be greater than 0, or leave it blank to use the default 3.7 V.");
          return;
        }
      }

      if (!validateNonNegative(efficiency, "conversion efficiency (%)")) return;
      if (!validateNonNegative(usable, "usable capacity (%)")) return;

      const usableWh = nominalWh * (usable / 100) * (efficiency / 100);

      if (!Number.isFinite(usableWh) || usableWh <= 0) {
        setResultError("The usable energy works out to 0. Check your inputs.");
        return;
      }

      const runtimeHours = usableWh / powerW;

      if (!Number.isFinite(runtimeHours) || runtimeHours <= 0) {
        setResultError("The runtime could not be calculated. Check your inputs.");
        return;
      }

      const lowPower = powerW * 0.8;
      const highPower = powerW * 1.2;

      const runtimeAtLow = usableWh / highPower;
      const runtimeAtHigh = usableWh / lowPower;

      const nominalWhDisplay = formatNumberTwoDecimals(nominalWh);
      const usableWhDisplay = formatNumberTwoDecimals(usableWh);
      const powerDisplay = formatNumberTwoDecimals(powerW);

      const primaryLine = hoursToHoursMinutes(runtimeHours);
      const rangeLowLine = hoursToHoursMinutes(runtimeAtLow);
      const rangeHighLine = hoursToHoursMinutes(runtimeAtHigh);

      const resultHtml = `
        <p><strong>Estimated battery life:</strong> ${primaryLine}</p>
        <p><strong>Usable energy:</strong> ${usableWhDisplay} Wh (from ${nominalWhDisplay} Wh nominal)</p>
        <p><strong>Assumptions used:</strong> ${formatNumberTwoDecimals(usable)}% usable capacity, ${formatNumberTwoDecimals(efficiency)}% efficiency, ${powerDisplay} W average draw</p>
        <p><strong>Simple range (power varies ±20%):</strong> ${rangeLowLine} to ${rangeHighLine}</p>
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
      const message = "Battery Life Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
