document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const stepsInput = document.getElementById("stepsInput");
  const weightKgInput = document.getElementById("weightKgInput");
  const cadenceInput = document.getElementById("cadenceInput");
  const stepLengthCmInput = document.getElementById("stepLengthCmInput");

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

  // Add every input that should live-format with commas
  attachLiveFormatting(stepsInput);
  attachLiveFormatting(weightKgInput);
  attachLiveFormatting(cadenceInput);
  attachLiveFormatting(stepLengthCmInput);

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

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      // Parse inputs using toNumber() (from /scripts/main.js)
      const steps = toNumber(stepsInput ? stepsInput.value : "");

      const weightRaw = toNumber(weightKgInput ? weightKgInput.value : "");
      const cadenceRaw = toNumber(cadenceInput ? cadenceInput.value : "");
      const stepLenRaw = toNumber(stepLengthCmInput ? stepLengthCmInput.value : "");

      // Basic existence guard
      if (!stepsInput || !resultDiv) return;

      // Validation
      if (!validatePositive(steps, "steps")) return;

      // Defaults (optional advanced inputs)
      let weightKg = Number.isFinite(weightRaw) && weightRaw > 0 ? weightRaw : 70;
      let cadenceSpm = Number.isFinite(cadenceRaw) && cadenceRaw > 0 ? cadenceRaw : 100;
      let stepLenCm = Number.isFinite(stepLenRaw) && stepLenRaw > 0 ? stepLenRaw : 76.2;

      // Practical clamps to reduce nonsense outputs
      // These are not hard rules, just guardrails.
      weightKg = clamp(weightKg, 30, 250);
      cadenceSpm = clamp(cadenceSpm, 40, 180);
      stepLenCm = clamp(stepLenCm, 40, 120);

      // Calculation logic
      // 1) Duration from steps and cadence
      const minutes = steps / cadenceSpm;

      // 2) MET estimate from cadence bands (walking intent)
      // - easy stroll: < 90 spm
      // - normal walk: 90–110 spm
      // - brisk walk: > 110 spm
      let met = 3.5;
      let intensityLabel = "Normal walking";
      if (cadenceSpm < 90) {
        met = 2.8;
        intensityLabel = "Easy walking";
      } else if (cadenceSpm > 110) {
        met = 4.3;
        intensityLabel = "Brisk walking";
      }

      // 3) Calories using MET formula:
      // kcal = MET * 3.5 * weight(kg) / 200 * minutes
      const calories = (met * 3.5 * weightKg / 200) * minutes;

      // 4) Distance from step length
      const distanceKm = (steps * (stepLenCm / 100)) / 1000;

      // 5) Supporting insight: calories per 1,000 steps
      const caloriesPer1000 = calories / (steps / 1000);

      // Build output HTML
      const hours = minutes / 60;

      const resultHtml = `
        <p><strong>Estimated calories burned (walking):</strong> ${formatNumberTwoDecimals(calories)} kcal</p>
        <p><strong>Estimated walking time:</strong> ${formatNumberTwoDecimals(minutes)} minutes (${formatNumberTwoDecimals(hours)} hours)</p>
        <p><strong>Estimated distance:</strong> ${formatNumberTwoDecimals(distanceKm)} km</p>
        <p><strong>Calories per 1,000 steps:</strong> ${formatNumberTwoDecimals(caloriesPer1000)} kcal</p>
        <p><strong>Intensity used:</strong> ${intensityLabel} (based on ${formatNumberTwoDecimals(cadenceSpm)} steps/min)</p>
        <p><strong>Assumptions applied:</strong> Weight ${formatNumberTwoDecimals(weightKg)} kg, cadence ${formatNumberTwoDecimals(cadenceSpm)} steps/min, step length ${formatNumberTwoDecimals(stepLenCm)} cm.</p>
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
      const message = "Steps to Calories Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
