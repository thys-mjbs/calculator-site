document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const distanceKmInput = document.getElementById("distanceKm");
  const timeMinutesInput = document.getElementById("timeMinutes");
  const weightKgInput = document.getElementById("weightKg");
  const gradePercentInput = document.getElementById("gradePercent");
  const carriedKgInput = document.getElementById("carriedKg");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(distanceKmInput);
  attachLiveFormatting(timeMinutesInput);
  attachLiveFormatting(weightKgInput);
  attachLiveFormatting(gradePercentInput);
  attachLiveFormatting(carriedKgInput);

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

  function clamp(value, min, max) {
    if (!Number.isFinite(value)) return min;
    return Math.min(Math.max(value, min), max);
  }

  function estimateMetFromSpeedKmh(speedKmh) {
    // Practical running MET bands (approximate) based on speed.
    if (speedKmh < 8) return 8.3;
    if (speedKmh < 9.7) return 9.8;
    if (speedKmh < 11.3) return 11.0;
    if (speedKmh < 12.9) return 11.8;
    if (speedKmh < 14.5) return 12.8;
    if (speedKmh < 16.1) return 14.5;
    if (speedKmh < 17.7) return 16.0;
    return 19.0;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      // Parse inputs using toNumber() (from /scripts/main.js)
      const distanceKm = toNumber(distanceKmInput ? distanceKmInput.value : "");
      const timeMin = toNumber(timeMinutesInput ? timeMinutesInput.value : "");
      const bodyKg = toNumber(weightKgInput ? weightKgInput.value : "");

      // Optional advanced inputs
      const gradePercentRaw = toNumber(gradePercentInput ? gradePercentInput.value : "");
      const carriedKgRaw = toNumber(carriedKgInput ? carriedKgInput.value : "");

      // Input existence guard
      if (!distanceKmInput || !timeMinutesInput || !weightKgInput) return;

      // Validation (required)
      if (!validatePositive(distanceKm, "distance (km)")) return;
      if (!validatePositive(timeMin, "time (minutes)")) return;
      if (!validatePositive(bodyKg, "body weight (kg)")) return;

      // Optional validation (advanced)
      let gradePercent = 0;
      if (gradePercentInput && gradePercentInput.value.trim() !== "") {
        if (!Number.isFinite(gradePercentRaw)) {
          setResultError("Enter a valid average incline / grade (%).");
          return;
        }
        // Keep within a sane range for average route grade
        gradePercent = clamp(gradePercentRaw, -15, 15);
      }

      let carriedKg = 0;
      if (carriedKgInput && carriedKgInput.value.trim() !== "") {
        if (!validateNonNegative(carriedKgRaw, "extra carried weight (kg)")) return;
        carriedKg = carriedKgRaw;
      }

      const effectiveKg = bodyKg + carriedKg;

      // Derived metrics
      const paceMinPerKm = timeMin / distanceKm;
      const speedKmh = (distanceKm / timeMin) * 60;
      const speedMPerMin = (distanceKm * 1000) / timeMin;

      if (!Number.isFinite(paceMinPerKm) || !Number.isFinite(speedKmh) || speedKmh <= 0) {
        setResultError("Enter values that produce a realistic run pace and speed.");
        return;
      }

      // Core calculation (locked intent: running only)
      // ACSM running equation (level and graded): VO2 (ml/kg/min) = 0.2*speed + 0.9*speed*grade + 3.5
      // speed in m/min, grade as decimal.
      const gradeDecimal = gradePercent / 100;
      const vo2 = (0.2 * speedMPerMin) + (0.9 * speedMPerMin * gradeDecimal) + 3.5;

      if (!Number.isFinite(vo2) || vo2 <= 0) {
        setResultError("The inputs produce an invalid estimate. Check distance, time, and incline.");
        return;
      }

      // kcal/min = (VO2 * kg) / 200
      const kcalPerMin = (vo2 * effectiveKg) / 200;
      const totalKcal = kcalPerMin * timeMin;

      if (!Number.isFinite(totalKcal) || totalKcal <= 0) {
        setResultError("The inputs produce an invalid calorie estimate. Check your numbers.");
        return;
      }

      const kcalPerKm = totalKcal / distanceKm;

      // Secondary insight: approximate MET for context (not used for the main burn here)
      const metApprox = estimateMetFromSpeedKmh(speedKmh);

      // Human-friendly pace formatting
      const paceWhole = Math.floor(paceMinPerKm);
      const paceSec = Math.round((paceMinPerKm - paceWhole) * 60);
      const paceSecPadded = String(paceSec === 60 ? 0 : paceSec).padStart(2, "0");
      const paceWholeAdjusted = paceSec === 60 ? paceWhole + 1 : paceWhole;
      const paceText = paceWholeAdjusted + ":" + paceSecPadded + " min/km";

      const usedAdvanced = (gradePercentInput && gradePercentInput.value.trim() !== "") || (carriedKgInput && carriedKgInput.value.trim() !== "");

      const resultHtml = `
        <div class="result-grid">
          <div class="result-row">
            <span><strong>Estimated calories burned</strong></span>
            <span><strong>${formatNumberTwoDecimals(totalKcal)} kcal</strong></span>
          </div>
          <div class="result-row">
            <span>Calories per km</span>
            <span>${formatNumberTwoDecimals(kcalPerKm)} kcal/km</span>
          </div>
          <div class="result-row">
            <span>Calories per minute</span>
            <span>${formatNumberTwoDecimals(kcalPerMin)} kcal/min</span>
          </div>
          <div class="result-row">
            <span>Pace</span>
            <span>${paceText}</span>
          </div>
          <div class="result-row">
            <span>Average speed</span>
            <span>${formatNumberTwoDecimals(speedKmh)} km/h</span>
          </div>
          <div class="result-row">
            <span>Estimated intensity (MET)</span>
            <span>${formatNumberTwoDecimals(metApprox)} MET</span>
          </div>
        </div>
        <div class="result-muted">
          ${usedAdvanced ? "Advanced inputs applied." : "Defaults used: flat route (0% grade) and no carried weight."}
        </div>
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
      const message = "Running Calories Burned Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
