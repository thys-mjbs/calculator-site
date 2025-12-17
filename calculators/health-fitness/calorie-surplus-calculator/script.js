document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const maintenanceCalories = document.getElementById("maintenanceCalories");
  const surplusCalories = document.getElementById("surplusCalories");
  const daysPerWeek = document.getElementById("daysPerWeek");
  const timeframeWeeks = document.getElementById("timeframeWeeks");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (Not used in this calculator)

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(maintenanceCalories);
  attachLiveFormatting(surplusCalories);
  attachLiveFormatting(daysPerWeek);
  attachLiveFormatting(timeframeWeeks);

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

  function validateIntegerRange(value, fieldLabel, min, max, defaultValue) {
    if (!Number.isFinite(value)) return defaultValue;
    const rounded = Math.round(value);
    if (rounded < min || rounded > max) {
      setResultError("Enter a valid " + fieldLabel + " between " + min + " and " + max + ".");
      return null;
    }
    return rounded;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const maintenance = toNumber(maintenanceCalories ? maintenanceCalories.value : "");
      const surplusRaw = toNumber(surplusCalories ? surplusCalories.value : "");
      const daysRaw = toNumber(daysPerWeek ? daysPerWeek.value : "");
      const weeksRaw = toNumber(timeframeWeeks ? timeframeWeeks.value : "");

      // Basic existence guard
      if (!maintenanceCalories || !surplusCalories || !daysPerWeek || !timeframeWeeks) return;

      // Validation: required maintenance
      if (!validatePositive(maintenance, "maintenance calories")) return;

      // Optional fields with defaults
      const surplus = Number.isFinite(surplusRaw) ? surplusRaw : 250;
      if (!validateNonNegative(surplus, "daily surplus")) return;

      if (surplus > 2000) {
        setResultError("Daily surplus above 2,000 kcal is unusually high. Use a smaller surplus or double-check your numbers.");
        return;
      }

      const daysValidated = validateIntegerRange(daysRaw, "surplus days per week", 1, 7, 7);
      if (daysValidated === null) return;

      const weeksValidated = validateIntegerRange(weeksRaw, "timeframe (weeks)", 1, 104, 4);
      if (weeksValidated === null) return;

      // Calculation logic
      const targetIntakeOnSurplusDays = maintenance + surplus;

      const weeklySurplus = surplus * daysValidated;
      const weeklyAverageSurplus = weeklySurplus / 7;

      const averageDailyIntakeAcrossWeek = maintenance + weeklyAverageSurplus;

      // Approximation: 7,700 kcal per kg of body weight change
      const KCAL_PER_KG = 7700;

      const estimatedGainKgPerWeek = weeklySurplus / KCAL_PER_KG;
      const estimatedGainKgOverTime = (weeklySurplus * weeksValidated) / KCAL_PER_KG;

      // A simple uncertainty band to be honest about variability (±20%)
      const lowGainKgOverTime = estimatedGainKgOverTime * 0.8;
      const highGainKgOverTime = estimatedGainKgOverTime * 1.2;

      const resultHtml = `
        <p><strong>Target intake on surplus days:</strong> ${formatInputWithCommas(String(Math.round(targetIntakeOnSurplusDays)))} kcal/day</p>
        <p><strong>Weekly surplus:</strong> ${formatInputWithCommas(String(Math.round(weeklySurplus)))} kcal/week (${daysValidated} day(s) in surplus)</p>
        <p><strong>Average daily intake (weekly average):</strong> ${formatInputWithCommas(String(Math.round(averageDailyIntakeAcrossWeek)))} kcal/day</p>
        <p><strong>Estimated weight gain:</strong> ${formatNumberTwoDecimals(estimatedGainKgPerWeek)} kg/week</p>
        <p><strong>Estimated gain over ${weeksValidated} week(s):</strong> ${formatNumberTwoDecimals(estimatedGainKgOverTime)} kg</p>
        <p><strong>Practical range (common real-world variation):</strong> ${formatNumberTwoDecimals(lowGainKgOverTime)} to ${formatNumberTwoDecimals(highGainKgOverTime)} kg over ${weeksValidated} week(s)</p>
        <p style="margin-top:10px;"><strong>Note:</strong> Short-term scale changes can be dominated by water and glycogen. Use a weekly average trend and adjust surplus slowly.</p>
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
      const message = "Calorie Surplus Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
