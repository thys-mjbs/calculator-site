document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const prePregWeightKgInput = document.getElementById("prePregWeightKg");
  const heightCmInput = document.getElementById("heightCm");
  const pregWeekInput = document.getElementById("pregWeek");
  const currentWeightKgInput = document.getElementById("currentWeightKg");

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
  attachLiveFormatting(prePregWeightKgInput);
  attachLiveFormatting(heightCmInput);
  attachLiveFormatting(pregWeekInput);
  attachLiveFormatting(currentWeightKgInput);

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
    return Math.min(Math.max(value, min), max);
  }

  function roundTwo(value) {
    return Math.round(value * 100) / 100;
  }

  function bmiCategoryFor(bmi) {
    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Normal weight";
    if (bmi < 30) return "Overweight";
    return "Obesity";
  }

  function recommendationsForCategory(category) {
    // Typical singleton pregnancy guidance modeled as:
    // - Total gain range (kg)
    // - Weekly gain range after week 13 (kg/week)
    // - First trimester modeled as 0.5 to 2.0 kg by end of week 13
    if (category === "Underweight") {
      return { totalMin: 12.5, totalMax: 18.0, rateMin: 0.44, rateMax: 0.58 };
    }
    if (category === "Normal weight") {
      return { totalMin: 11.5, totalMax: 16.0, rateMin: 0.35, rateMax: 0.5 };
    }
    if (category === "Overweight") {
      return { totalMin: 7.0, totalMax: 11.5, rateMin: 0.23, rateMax: 0.33 };
    }
    return { totalMin: 5.0, totalMax: 9.0, rateMin: 0.17, rateMax: 0.27 };
  }

  function formatRange(minVal, maxVal, unit) {
    return `${formatNumberTwoDecimals(minVal)} to ${formatNumberTwoDecimals(maxVal)} ${unit}`;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const preKg = toNumber(prePregWeightKgInput ? prePregWeightKgInput.value : "");
      const heightCm = toNumber(heightCmInput ? heightCmInput.value : "");
      const week = toNumber(pregWeekInput ? pregWeekInput.value : "");
      const currentKg = toNumber(currentWeightKgInput ? currentWeightKgInput.value : "");

      // Basic existence guard
      if (!prePregWeightKgInput || !heightCmInput || !pregWeekInput) return;

      // Validation (required inputs)
      if (!validatePositive(preKg, "pre-pregnancy weight (kg)")) return;
      if (!validatePositive(heightCm, "height (cm)")) return;
      if (!Number.isFinite(week) || week < 1 || week > 42) {
        setResultError("Enter a valid pregnancy week between 1 and 42.");
        return;
      }

      // Additional validation (optional input if provided)
      const hasCurrentWeight = Number.isFinite(currentKg) && currentWeightKgInput && currentWeightKgInput.value.trim() !== "";
      if (hasCurrentWeight) {
        if (!validatePositive(currentKg, "current weight (kg)")) return;
        if (currentKg < preKg * 0.7) {
          setResultError("Your current weight looks much lower than your pre-pregnancy weight. Double-check the value.");
          return;
        }
      }

      const heightM = heightCm / 100;
      const bmi = preKg / (heightM * heightM);
      if (!Number.isFinite(bmi) || bmi <= 0) {
        setResultError("Unable to calculate BMI. Check your height and pre-pregnancy weight.");
        return;
      }

      const bmiRounded = roundTwo(bmi);
      const category = bmiCategoryFor(bmi);
      const rec = recommendationsForCategory(category);

      const firstTrimMin = 0.5;
      const firstTrimMax = 2.0;

      const weeksAfter13 = Math.max(0, week - 13);

      let gainMinNow = firstTrimMin + weeksAfter13 * rec.rateMin;
      let gainMaxNow = firstTrimMax + weeksAfter13 * rec.rateMax;

      // Clamp cumulative targets so they do not exceed total recommended range
      gainMinNow = clamp(gainMinNow, 0, rec.totalMax);
      gainMaxNow = clamp(gainMaxNow, 0, rec.totalMax);

      // Also keep the lower bound from drifting above totalMin late in pregnancy
      gainMinNow = Math.min(gainMinNow, rec.totalMin);

      const targetWeightMinNow = preKg + gainMinNow;
      const targetWeightMaxNow = preKg + gainMaxNow;

      const totalMin = rec.totalMin;
      const totalMax = rec.totalMax;

      let comparisonHtml = "";
      if (hasCurrentWeight) {
        const gainedSoFar = currentKg - preKg;

        let status = "Within range";
        let statusNote = "Your gain so far is within the typical target range for this week.";

        if (gainedSoFar < gainMinNow) {
          status = "Below range";
          const diff = gainMinNow - gainedSoFar;
          statusNote = `You are about ${formatNumberTwoDecimals(diff)} kg below the low end of the typical range for this week.`;
        } else if (gainedSoFar > gainMaxNow) {
          status = "Above range";
          const diff = gainedSoFar - gainMaxNow;
          statusNote = `You are about ${formatNumberTwoDecimals(diff)} kg above the high end of the typical range for this week.`;
        }

        const remainingToLow = Math.max(0, totalMin - gainedSoFar);
        const remainingToHigh = Math.max(0, totalMax - gainedSoFar);

        comparisonHtml = `
          <hr>
          <p><strong>Current check:</strong> ${status}</p>
          <p>${statusNote}</p>
          <p><strong>Your gain so far:</strong> ${formatNumberTwoDecimals(gainedSoFar)} kg</p>
          <p><strong>To reach total range by term:</strong> ${formatNumberTwoDecimals(remainingToLow)} kg to ${formatNumberTwoDecimals(remainingToHigh)} kg remaining</p>
        `;
      } else {
        comparisonHtml = `
          <hr>
          <p><strong>Optional:</strong> Add your current weight to see whether you are below, within, or above the typical target range for this week.</p>
        `;
      }

      const resultHtml = `
        <p><strong>Estimated pre-pregnancy BMI:</strong> ${formatNumberTwoDecimals(bmiRounded)}</p>
        <p><strong>BMI category:</strong> ${category}</p>

        <hr>

        <p><strong>Recommended total pregnancy weight gain (singleton):</strong> ${formatRange(totalMin, totalMax, "kg")}</p>
        <p><strong>Typical weekly gain after week 13:</strong> ${formatRange(rec.rateMin, rec.rateMax, "kg/week")}</p>

        <hr>

        <p><strong>Target gain by week ${Math.round(week)}:</strong> ${formatRange(gainMinNow, gainMaxNow, "kg")}</p>
        <p><strong>Target weight range now:</strong> ${formatRange(targetWeightMinNow, targetWeightMaxNow, "kg")}</p>

        ${comparisonHtml}

        <p><strong>Note:</strong> This is a general planning guide for singleton pregnancies. Individual medical factors can change targets.</p>
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
      const message = "Pregnancy Weight Gain Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
