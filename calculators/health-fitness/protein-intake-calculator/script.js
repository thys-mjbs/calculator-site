document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const weightInput = document.getElementById("weightInput");
  const weightUnit = document.getElementById("weightUnit");
  const goalSelect = document.getElementById("goalSelect");
  const activitySelect = document.getElementById("activitySelect");
  const bodyFatInput = document.getElementById("bodyFatInput");

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

  attachLiveFormatting(weightInput);
  attachLiveFormatting(bodyFatInput);

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
    // not used
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
    return Math.min(max, Math.max(min, value));
  }

  function roundToOneDecimal(n) {
    if (!Number.isFinite(n)) return n;
    return Math.round(n * 10) / 10;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const weightRaw = toNumber(weightInput ? weightInput.value : "");
      const bfRaw = toNumber(bodyFatInput ? bodyFatInput.value : "");
      const unit = weightUnit ? weightUnit.value : "kg";
      const goal = goalSelect ? goalSelect.value : "maintenance";
      const activity = activitySelect ? activitySelect.value : "moderate";

      // Basic existence guard
      if (!weightInput || !weightUnit || !goalSelect || !activitySelect) return;

      // Validation
      if (!validatePositive(weightRaw, "body weight")) return;

      const bfProvided = Number.isFinite(bfRaw) && bodyFatInput && bodyFatInput.value.trim() !== "";
      if (bfProvided) {
        if (!validateNonNegative(bfRaw, "body fat percentage")) return;
        if (bfRaw > 70) {
          setResultError("Enter a realistic body fat percentage (0 to 70). Leave it blank if unsure.");
          return;
        }
      }

      // Convert weight to kg for internal calculations
      let weightKg = weightRaw;
      if (unit === "lb") {
        weightKg = weightRaw * 0.45359237;
      }

      // Choose protein range factors (g per kg)
      // Goal + activity mapping designed for practical, non-clinical use.
      const ranges = {
        maintenance: {
          sedentary: { low: 1.2, high: 1.6 },
          moderate: { low: 1.4, high: 2.0 },
          high: { low: 1.6, high: 2.2 }
        },
        fatloss: {
          sedentary: { low: 1.6, high: 2.0 },
          moderate: { low: 1.8, high: 2.2 },
          high: { low: 2.0, high: 2.4 }
        },
        musclegain: {
          sedentary: { low: 1.6, high: 2.0 },
          moderate: { low: 1.8, high: 2.2 },
          high: { low: 2.0, high: 2.4 }
        }
      };

      const selected = (ranges[goal] && ranges[goal][activity]) ? ranges[goal][activity] : ranges.maintenance.moderate;
      const lowFactor = selected.low;
      const highFactor = selected.high;

      // Optional lean body mass handling
      // If body fat is provided, calculate LBM and base target on LBM for a more realistic estimate for higher body fat.
      let basisKg = weightKg;
      let basisLabel = "body weight";
      let lbmKg = null;

      if (bfProvided) {
        const bfClamped = clamp(bfRaw, 0, 70);
        lbmKg = weightKg * (1 - (bfClamped / 100));
        // Guard against pathological inputs (extremely low LBM)
        if (Number.isFinite(lbmKg) && lbmKg > 20) {
          basisKg = lbmKg;
          basisLabel = "estimated lean body mass";
        }
      }

      // Calculate grams per day
      const lowG = basisKg * lowFactor;
      const highG = basisKg * highFactor;

      // Secondary insights: per-meal targets for 3 and 4 meals
      const low3 = lowG / 3;
      const high3 = highG / 3;
      const low4 = lowG / 4;
      const high4 = highG / 4;

      // Present g/kg based on chosen basis
      const basisPerKgLow = lowFactor;
      const basisPerKgHigh = highFactor;

      // Build output HTML
      const lowOut = formatNumberTwoDecimals(lowG);
      const highOut = formatNumberTwoDecimals(highG);

      const low3Out = formatNumberTwoDecimals(low3);
      const high3Out = formatNumberTwoDecimals(high3);
      const low4Out = formatNumberTwoDecimals(low4);
      const high4Out = formatNumberTwoDecimals(high4);

      const weightKgOut = formatNumberTwoDecimals(weightKg);
      const basisKgOut = formatNumberTwoDecimals(basisKg);

      let goalText = "Maintain weight";
      if (goal === "fatloss") goalText = "Fat loss (cutting)";
      if (goal === "musclegain") goalText = "Muscle gain (lean bulk)";

      let activityText = "Moderately active";
      if (activity === "sedentary") activityText = "Sedentary";
      if (activity === "high") activityText = "Very active";

      const notes = [];
      notes.push("This target is a range. Hitting the minimum consistently matters more than chasing the maximum.");
      if (bfProvided && basisLabel === "estimated lean body mass") {
        notes.push("Body fat percentage was used to estimate lean body mass. If that estimate is off, your result will shift.");
      } else if (bfProvided && basisLabel !== "estimated lean body mass") {
        notes.push("Body fat percentage was provided, but the estimate looked unreliable, so the calculator used total body weight instead.");
      } else {
        notes.push("No body fat percentage was provided, so the calculator used total body weight.");
      }

      const resultHtml = `
        <p><strong>Daily protein target:</strong> ${lowOut} to ${highOut} g/day</p>
        <p><strong>Based on:</strong> ${basisLabel} (${basisKgOut} kg). Your weight in kg: ${weightKgOut} kg.</p>
        <p><strong>Selected profile:</strong> ${goalText}, ${activityText} (${basisPerKgLow} to ${basisPerKgHigh} g/kg).</p>

        <hr>

        <p><strong>Per-meal breakdown (3 meals):</strong> ${low3Out} to ${high3Out} g per meal</p>
        <p><strong>Per-meal breakdown (4 meals):</strong> ${low4Out} to ${high4Out} g per meal</p>

        <hr>

        <p><strong>Practical use:</strong> Aim to hit the minimum most days. Use the upper end on harder training days or when cutting aggressively.</p>
        <ul>
          <li>${notes[0]}</li>
          <li>${notes[1]}</li>
        </ul>
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
      const message = "Protein Intake Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
