document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const wattageWatts = document.getElementById("wattageWatts");
  const pricePerKwh = document.getElementById("pricePerKwh");
  const hoursPerDay = document.getElementById("hoursPerDay");
  const daysPerMonth = document.getElementById("daysPerMonth");
  const standbyWatts = document.getElementById("standbyWatts");
  const standbyHoursPerDay = document.getElementById("standbyHoursPerDay");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (not used)
  
  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(wattageWatts);
  attachLiveFormatting(pricePerKwh);
  attachLiveFormatting(hoursPerDay);
  attachLiveFormatting(daysPerMonth);
  attachLiveFormatting(standbyWatts);
  attachLiveFormatting(standbyHoursPerDay);

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

  function validateRangeInclusive(value, min, max, fieldLabel) {
    if (!Number.isFinite(value) || value < min || value > max) {
      setResultError("Enter a valid " + fieldLabel + " between " + min + " and " + max + ".");
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
      const watts = toNumber(wattageWatts ? wattageWatts.value : "");
      const rate = toNumber(pricePerKwh ? pricePerKwh.value : "");
      const useHours = toNumber(hoursPerDay ? hoursPerDay.value : "");

      const monthDaysRaw = toNumber(daysPerMonth ? daysPerMonth.value : "");
      const monthDays = Number.isFinite(monthDaysRaw) && monthDaysRaw > 0 ? monthDaysRaw : 30;

      const standbyW = toNumber(standbyWatts ? standbyWatts.value : "");
      const standbyHRaw = toNumber(standbyHoursPerDay ? standbyHoursPerDay.value : "");
      const standbyH = Number.isFinite(standbyHRaw) && standbyHRaw > 0 ? standbyHRaw : 0;

      // Basic existence guard
      if (!wattageWatts || !pricePerKwh || !hoursPerDay) return;

      // Validation (constructive, non-technical)
      if (!validatePositive(watts, "appliance power (watts)")) return;
      if (!validatePositive(rate, "electricity price per kWh")) return;

      if (!validateNonNegative(useHours, "hours used per day")) return;
      if (!validateNonNegative(standbyW, "standby power (watts)")) return;
      if (!validateNonNegative(standbyH, "standby hours per day")) return;

      if (!validateRangeInclusive(useHours, 0, 24, "hours used per day")) return;
      if (!validateRangeInclusive(standbyH, 0, 24, "standby hours per day")) return;

      if (!validatePositive(monthDays, "days per month")) return;
      if (!validateRangeInclusive(monthDays, 1, 31, "days per month")) return;

      if (useHours <= 0 && standbyH <= 0) {
        setResultError("Enter hours used per day, or use the standby fields if the device runs while “off”.");
        return;
      }

      // Calculation logic
      const runningKwhPerDay = (watts / 1000) * useHours;
      const standbyKwhPerDay = (standbyW / 1000) * standbyH;
      const totalKwhPerDay = runningKwhPerDay + standbyKwhPerDay;

      const costPerHourRunning = (watts / 1000) * rate;
      const costPerHourStandby = (standbyW / 1000) * rate;

      const costPerDay = totalKwhPerDay * rate;
      const costPerMonth = costPerDay * monthDays;
      const costPerYear = costPerDay * 365;

      const totalKwhPerMonth = totalKwhPerDay * monthDays;
      const totalKwhPerYear = totalKwhPerDay * 365;

      const oneHourSavePerMonth = (watts / 1000) * rate * monthDays;

      // Build output HTML
      const resultHtml = `
        <p><strong>Estimated cost:</strong></p>
        <ul>
          <li><strong>Per hour (running):</strong> ${formatNumberTwoDecimals(costPerHourRunning)}</li>
          <li><strong>Per day:</strong> ${formatNumberTwoDecimals(costPerDay)}</li>
          <li><strong>Per month (${formatNumberTwoDecimals(monthDays)} days):</strong> ${formatNumberTwoDecimals(costPerMonth)}</li>
          <li><strong>Per year:</strong> ${formatNumberTwoDecimals(costPerYear)}</li>
        </ul>

        <p><strong>Estimated energy use:</strong></p>
        <ul>
          <li><strong>kWh per day:</strong> ${formatNumberTwoDecimals(totalKwhPerDay)}</li>
          <li><strong>kWh per month:</strong> ${formatNumberTwoDecimals(totalKwhPerMonth)}</li>
          <li><strong>kWh per year:</strong> ${formatNumberTwoDecimals(totalKwhPerYear)}</li>
        </ul>

        <p><strong>Quick insight:</strong> Cutting usage by 1 hour per day saves about <strong>${formatNumberTwoDecimals(oneHourSavePerMonth)}</strong> per month (based on your rate and month length).</p>
        ${
          standbyW > 0 && standbyH > 0
            ? `<p><strong>Standby note:</strong> Standby costs about <strong>${formatNumberTwoDecimals(costPerHourStandby)}</strong> per hour while the device is “off”.</p>`
            : ""
        }
      `;

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
      const message = "Appliance Running Cost Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
