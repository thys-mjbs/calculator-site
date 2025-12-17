document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  // Replace these bindings per calculator or add more as needed.
  const weightInput = document.getElementById("weightInput");
  const weightUnit = document.getElementById("weightUnit");
  const activityMinutes = document.getElementById("activityMinutes");
  const activityIntensity = document.getElementById("activityIntensity");
  const climate = document.getElementById("climate");
  const lifeStage = document.getElementById("lifeStage");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // Example:
  // const modeSelect = document.getElementById("modeSelect");
  // const modeBlockA = document.getElementById("modeBlockA");
  // const modeBlockB = document.getElementById("modeBlockB");

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
  attachLiveFormatting(weightInput);
  attachLiveFormatting(activityMinutes);

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
      // Parse inputs using toNumber() (from /scripts/main.js)
      const weightRaw = toNumber(weightInput ? weightInput.value : "");
      const minutesRaw = toNumber(activityMinutes ? activityMinutes.value : "");

      // Basic existence guard
      if (!weightInput || !weightUnit || !activityMinutes || !activityIntensity || !climate || !lifeStage) return;

      // Validation
      if (!validatePositive(weightRaw, "body weight")) return;

      // Plausibility checks (friendly, non-hostile)
      const unit = (weightUnit.value || "kg").toLowerCase();
      const weightKg = unit === "lb" ? (weightRaw * 0.45359237) : weightRaw;

      if (!Number.isFinite(weightKg) || weightKg < 20 || weightKg > 300) {
        setResultError("Enter a realistic body weight. For most adults, 20 kg to 300 kg is a reasonable range.");
        return;
      }

      const minutes = Number.isFinite(minutesRaw) ? minutesRaw : 0;
      if (!validateNonNegative(minutes, "exercise minutes")) return;
      if (minutes > 600) {
        setResultError("Exercise minutes looks unusually high. Enter a value between 0 and 600 minutes.");
        return;
      }

      // Calculation logic
      // Baseline: 35 ml per kg per day
      const baselineLiters = (weightKg * 35) / 1000;

      // Exercise adjustment (liters per hour by intensity)
      const intensity = (activityIntensity.value || "moderate").toLowerCase();
      let litersPerHour = 0.5; // moderate default
      if (intensity === "light") litersPerHour = 0.3;
      if (intensity === "vigorous") litersPerHour = 0.8;

      const activityHours = minutes / 60;
      const exerciseLiters = activityHours * litersPerHour;

      // Climate adjustment
      const climateSetting = (climate.value || "temperate").toLowerCase();
      let climateLiters = 0;
      if (climateSetting === "warm") climateLiters = 0.2;
      if (climateSetting === "hot") climateLiters = 0.4;

      // Life stage adjustment
      const stage = (lifeStage.value || "none").toLowerCase();
      let stageLiters = 0;
      if (stage === "pregnant") stageLiters = 0.3;
      if (stage === "breastfeeding") stageLiters = 0.7;

      // Total target with a practical clamp
      let targetLiters = baselineLiters + exerciseLiters + climateLiters + stageLiters;
      if (targetLiters < 1.5) targetLiters = 1.5;
      if (targetLiters > 6.0) targetLiters = 6.0;

      // Range (±10%)
      const lowLiters = targetLiters * 0.9;
      const highLiters = targetLiters * 1.1;

      // Conversions and practical breakdowns
      const ozPerLiter = 33.8140226;
      const targetOz = targetLiters * ozPerLiter;

      const bottles500 = targetLiters / 0.5;
      const cups250 = targetLiters / 0.25;

      const wakingHours = 16;
      const perHourMl = (targetLiters * 1000) / wakingHours;

      // Build output HTML
      const resultHtml = `
        <p><strong>Recommended daily water target:</strong> ${formatNumberTwoDecimals(targetLiters)} L (${formatNumberTwoDecimals(targetOz)} fl oz)</p>
        <p><strong>Practical range:</strong> ${formatNumberTwoDecimals(lowLiters)} to ${formatNumberTwoDecimals(highLiters)} L</p>
        <p><strong>Easy breakdown:</strong> about ${formatNumberTwoDecimals(bottles500)} × 500 ml bottles or ${formatNumberTwoDecimals(cups250)} × 250 ml cups per day</p>
        <p><strong>Simple pace:</strong> about ${formatNumberTwoDecimals(perHourMl)} ml per hour if spread over ~${wakingHours} waking hours</p>
        <p><strong>What this includes:</strong> baseline (${formatNumberTwoDecimals(baselineLiters)} L) + exercise (${formatNumberTwoDecimals(exerciseLiters)} L) + climate (${formatNumberTwoDecimals(climateLiters)} L) + life stage (${formatNumberTwoDecimals(stageLiters)} L)</p>
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
      const message = "Daily Water Intake Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
