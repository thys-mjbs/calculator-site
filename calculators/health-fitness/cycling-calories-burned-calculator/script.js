document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const durationMinutesInput = document.getElementById("durationMinutes");
  const intensitySelect = document.getElementById("intensity");
  const weightKgInput = document.getElementById("weightKg");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (Not used for this calculator)

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Keep minimal and avoid comma-formatting minutes.
  // Apply only to weight (users sometimes type 1,000 by habit; harmless).
  attachLiveFormatting(weightKgInput);

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

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      const minutes = toNumber(durationMinutesInput ? durationMinutesInput.value : "");
      const intensity = intensitySelect ? String(intensitySelect.value || "").toLowerCase() : "";

      let weightKg = toNumber(weightKgInput ? weightKgInput.value : "");
      if (!Number.isFinite(weightKg) || weightKg <= 0) {
        weightKg = 70;
      }

      if (!validatePositive(minutes, "duration (minutes)")) return;

      if (intensity !== "easy" && intensity !== "moderate" && intensity !== "vigorous") {
        setResultError("Choose a valid intensity.");
        return;
      }

      // MET values (common practical mapping for steady cycling)
      let met = 8.0;
      if (intensity === "easy") met = 4.0;
      if (intensity === "moderate") met = 8.0;
      if (intensity === "vigorous") met = 10.0;

      // Calories formula (kcal):
      // kcal = MET * 3.5 * weight(kg) / 200 * minutes
      const calories = (met * 3.5 * weightKg) / 200 * minutes;

      const perHour = (calories / minutes) * 60;
      const perMinute = calories / minutes;

      // Practical secondary insight: time to ~500 kcal at this pace
      const minutesFor500 = perMinute > 0 ? (500 / perMinute) : NaN;

      const intensityLabel =
        intensity === "easy"
          ? "Easy (casual pace)"
          : intensity === "moderate"
            ? "Moderate (steady effort)"
            : "Vigorous (hard effort)";

      const usedWeightNote = (weightKgInput && toNumber(weightKgInput.value) > 0) ? "" : " (assumed)";

      const resultHtml = `
        <div class="result-grid">
          <div class="result-row">
            <span class="label">Estimated calories burned</span>
            <span class="value">${formatNumberTwoDecimals(calories)} kcal</span>
          </div>
          <div class="result-row">
            <span class="label">Calories per hour</span>
            <span class="value">${formatNumberTwoDecimals(perHour)} kcal/hour</span>
          </div>
          <div class="result-row">
            <span class="label">Calories per minute</span>
            <span class="value">${formatNumberTwoDecimals(perMinute)} kcal/min</span>
          </div>
          <hr>
          <div class="result-row">
            <span class="label">Intensity used</span>
            <span class="value">${intensityLabel}</span>
          </div>
          <div class="result-row">
            <span class="label">Weight used</span>
            <span class="value">${formatNumberTwoDecimals(weightKg)} kg${usedWeightNote}</span>
          </div>
          <div class="result-row">
            <span class="label">Rough time to burn 500 kcal</span>
            <span class="value">${Number.isFinite(minutesFor500) ? formatNumberTwoDecimals(minutesFor500) : "—"} min</span>
          </div>
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
      const message = "Cycling Calories Burned Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
