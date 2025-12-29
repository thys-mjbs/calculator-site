document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const wattsInput = document.getElementById("wattsInput");
  const hoursPerDayInput = document.getElementById("hoursPerDayInput");
  const ratePerKwhInput = document.getElementById("ratePerKwhInput");
  const daysPerMonthInput = document.getElementById("daysPerMonthInput");

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

  // Attach formatting where it makes sense
  attachLiveFormatting(wattsInput);
  attachLiveFormatting(daysPerMonthInput);

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

  function validateIntegerRange(value, fieldLabel, min, max) {
    if (!Number.isFinite(value) || Math.floor(value) !== value || value < min || value > max) {
      setResultError("Enter a valid " + fieldLabel + " as a whole number from " + min + " to " + max + ".");
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
      const watts = toNumber(wattsInput ? wattsInput.value : "");
      const hoursPerDay = toNumber(hoursPerDayInput ? hoursPerDayInput.value : "");
      const ratePerKwh = toNumber(ratePerKwhInput ? ratePerKwhInput.value : "");

      // Optional advanced input (defaults)
      const daysRaw = daysPerMonthInput ? daysPerMonthInput.value : "";
      let daysPerMonth = 30;
      if (daysRaw && String(daysRaw).trim() !== "") {
        daysPerMonth = toNumber(daysRaw);
      }

      // Basic existence guard
      if (!wattsInput || !hoursPerDayInput || !ratePerKwhInput) return;

      // Validation
      if (!validatePositive(watts, "appliance power (watts)")) return;
      if (!validatePositive(hoursPerDay, "hours used per day")) return;
      if (!validatePositive(ratePerKwh, "electricity price per kWh")) return;

      if (daysRaw && String(daysRaw).trim() !== "") {
        if (!validateIntegerRange(daysPerMonth, "days in your billing month", 1, 31)) return;
      }

      // Calculation logic
      const kw = watts / 1000;
      const kwhPerDay = kw * hoursPerDay;

      const costPerHour = kw * ratePerKwh;
      const costPerDay = kwhPerDay * ratePerKwh;

      const costPerWeek = costPerDay * 7;
      const costPerMonth = costPerDay * daysPerMonth;
      const costPerYear = costPerDay * 365;

      // Build output HTML
      const resultHtml = `
        <p><strong>Estimated running cost:</strong></p>
        <ul>
          <li><strong>Per hour:</strong> ${formatNumberTwoDecimals(costPerHour)}</li>
          <li><strong>Per day:</strong> ${formatNumberTwoDecimals(costPerDay)}</li>
          <li><strong>Per week:</strong> ${formatNumberTwoDecimals(costPerWeek)}</li>
          <li><strong>Per month (${daysPerMonth} days):</strong> ${formatNumberTwoDecimals(costPerMonth)}</li>
          <li><strong>Per year (365 days):</strong> ${formatNumberTwoDecimals(costPerYear)}</li>
        </ul>
        <p><strong>Energy use:</strong> ${formatNumberTwoDecimals(kwhPerDay)} kWh per day</p>
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
      const message = "Electricity Usage Cost Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
