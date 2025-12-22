document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const activitySelect = document.getElementById("activitySelect");
  const weightKgInput = document.getElementById("weightKg");
  const durationMinutesInput = document.getElementById("durationMinutes");
  const intensityAdjustPercentInput = document.getElementById("intensityAdjustPercent");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Keep consistent formatting behavior across site (even if commas are rare here)
  attachLiveFormatting(weightKgInput);
  attachLiveFormatting(durationMinutesInput);
  attachLiveFormatting(intensityAdjustPercentInput);

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

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      if (!activitySelect || !weightKgInput || !durationMinutesInput) return;

      const met = toNumber(activitySelect.value);
      const weightKg = toNumber(weightKgInput.value);
      const minutes = toNumber(durationMinutesInput.value);

      let intensityAdj = 0;
      if (intensityAdjustPercentInput && intensityAdjustPercentInput.value.trim() !== "") {
        intensityAdj = toNumber(intensityAdjustPercentInput.value);
      }

      if (!Number.isFinite(met) || met <= 0) {
        setResultError("Select a workout type to estimate calories burned.");
        return;
      }

      if (!validatePositive(weightKg, "weight")) return;
      if (!validatePositive(minutes, "workout duration")) return;

      if (weightKg < 20 || weightKg > 300) {
        setResultError("Enter a realistic weight between 20 kg and 300 kg.");
        return;
      }

      if (minutes < 1 || minutes > 600) {
        setResultError("Enter a realistic duration between 1 and 600 minutes.");
        return;
      }

      if (!Number.isFinite(intensityAdj) || intensityAdj < -50 || intensityAdj > 100) {
        setResultError("Enter an intensity adjustment between -50% and +100%, or leave it blank.");
        return;
      }

      // Calories/min = (MET * 3.5 * kg) / 200
      // Total calories = calories/min * minutes
      const adjustedMet = Math.max(0.1, met * (1 + intensityAdj / 100));
      const caloriesPerMinute = (adjustedMet * 3.5 * weightKg) / 200;
      const totalCalories = caloriesPerMinute * minutes;

      // Practical variability range (small, not over-engineered)
      const lowCalories = totalCalories * 0.9;
      const highCalories = totalCalories * 1.1;

      const roundedTotal = Math.round(totalCalories);
      const roundedLow = Math.round(lowCalories);
      const roundedHigh = Math.round(highCalories);

      const perHour = caloriesPerMinute * 60;

      const intensityNote =
        intensityAdj === 0
          ? "No intensity adjustment applied."
          : "Intensity adjustment applied: " + intensityAdj + "%.";

      const resultHtml = `
        <p><strong>Estimated calories burned:</strong> ${formatNumberTwoDecimals(roundedTotal)} kcal</p>
        <p><strong>Likely range:</strong> ${formatNumberTwoDecimals(roundedLow)} to ${formatNumberTwoDecimals(roundedHigh)} kcal</p>
        <p><strong>Calories per minute:</strong> ${formatNumberTwoDecimals(caloriesPerMinute)} kcal/min</p>
        <p><strong>Calories per hour (same effort):</strong> ${formatNumberTwoDecimals(perHour)} kcal/hour</p>
        <p><strong>Notes:</strong> ${intensityNote}</p>
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
      const message = "Workout Calories Burned Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
