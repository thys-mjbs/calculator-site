document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const weightKgInput = document.getElementById("weightKg");
  const durationMinInput = document.getElementById("durationMin");
  const speedKmhInput = document.getElementById("speedKmh");
  const inclinePercentInput = document.getElementById("inclinePercent");

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
  attachLiveFormatting(weightKgInput);
  attachLiveFormatting(durationMinInput);
  attachLiveFormatting(speedKmhInput);
  attachLiveFormatting(inclinePercentInput);

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

  function validateRange(value, fieldLabel, min, max) {
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
      clearResult();

      if (!weightKgInput || !durationMinInput || !speedKmhInput) return;

      const weightKg = toNumber(weightKgInput.value);
      const durationMin = toNumber(durationMinInput.value);
      const speedKmh = toNumber(speedKmhInput.value);

      let inclinePercent = 0;
      const inclineRaw = inclinePercentInput ? inclinePercentInput.value : "";
      if (inclineRaw && inclineRaw.trim() !== "") {
        inclinePercent = toNumber(inclineRaw);
      }

      // Validate required inputs (real-world bounds)
      if (!validateRange(weightKg, "weight (kg)", 20, 300)) return;
      if (!validateRange(durationMin, "walking time (minutes)", 1, 600)) return;
      if (!validateRange(speedKmh, "walking speed (km/h)", 1, 10)) return;

      // Optional incline validation (allow downhill)
      if (!Number.isFinite(inclinePercent)) {
        setResultError("Enter a valid incline (%) or leave it blank.");
        return;
      }
      if (inclinePercent < -15 || inclinePercent > 25) {
        setResultError("Enter a realistic incline (%) between -15 and 25.");
        return;
      }

      // Calculation (walking-focused equation with optional grade)
      // speed (m/min) = km/h * 1000 / 60
      const speedMPerMin = (speedKmh * 1000) / 60;
      const grade = inclinePercent / 100;

      // VO2 (ml/kg/min) for walking:
      // VO2 = 0.1*speed + 1.8*speed*grade + 3.5
      // Clamp at resting to avoid unrealistic negatives on steep downhills.
      let vo2 = (0.1 * speedMPerMin) + (1.8 * speedMPerMin * grade) + 3.5;
      if (!Number.isFinite(vo2)) {
        setResultError("Something looks off with your inputs. Check speed and incline.");
        return;
      }
      vo2 = Math.max(3.5, vo2);

      // kcal/min = (VO2 * weightKg) / 200
      const kcalPerMin = (vo2 * weightKg) / 200;
      const totalKcal = kcalPerMin * durationMin;

      if (!Number.isFinite(totalKcal) || totalKcal <= 0) {
        setResultError("Unable to calculate. Check that all inputs are realistic.");
        return;
      }

      const met = vo2 / 3.5;

      // Secondary insight: simple uncertainty band (±10%)
      const lowKcal = totalKcal * 0.9;
      const highKcal = totalKcal * 1.1;

      // Supporting insight: minutes to burn ~100 kcal at this pace
      const minutesFor100 = 100 / kcalPerMin;

      const resultHtml = `
        <p><strong>Estimated calories burned:</strong> ${formatNumberTwoDecimals(totalKcal)} kcal</p>
        <p><strong>Estimated burn rate:</strong> ${formatNumberTwoDecimals(kcalPerMin)} kcal/min</p>
        <p><strong>Estimated intensity:</strong> ${formatNumberTwoDecimals(met)} MET</p>
        <p><strong>Typical real-world range (±10%):</strong> ${formatNumberTwoDecimals(lowKcal)} to ${formatNumberTwoDecimals(highKcal)} kcal</p>
        <p><strong>Time to burn ~100 kcal at this pace:</strong> ${formatNumberTwoDecimals(minutesFor100)} minutes</p>
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
      const message = "Walking Calories Burned Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
