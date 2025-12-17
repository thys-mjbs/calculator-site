/* script.js */
document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const sex = document.getElementById("sex");
  const ageYears = document.getElementById("ageYears");
  const heightCm = document.getElementById("heightCm");
  const weightKg = document.getElementById("weightKg");
  const activityLevel = document.getElementById("activityLevel");
  const maintenanceOverride = document.getElementById("maintenanceOverride");

  const goalMode = document.getElementById("goalMode");
  const modeTimeline = document.getElementById("modeTimeline");
  const modeRate = document.getElementById("modeRate");

  const targetWeightKg = document.getElementById("targetWeightKg");
  const timelineWeeks = document.getElementById("timelineWeeks");

  const rateKgPerWeek = document.getElementById("rateKgPerWeek");
  const optionalTargetWeightKg = document.getElementById("optionalTargetWeightKg");

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
  attachLiveFormatting(ageYears);
  attachLiveFormatting(heightCm);
  attachLiveFormatting(weightKg);
  attachLiveFormatting(maintenanceOverride);
  attachLiveFormatting(targetWeightKg);
  attachLiveFormatting(timelineWeeks);
  attachLiveFormatting(rateKgPerWeek);
  attachLiveFormatting(optionalTargetWeightKg);

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
    if (modeTimeline) modeTimeline.classList.add("hidden");
    if (modeRate) modeRate.classList.add("hidden");

    if (mode === "timeline" && modeTimeline) modeTimeline.classList.remove("hidden");
    if (mode === "rate" && modeRate) modeRate.classList.remove("hidden");

    clearResult();
  }

  if (goalMode) {
    showMode(goalMode.value);
    goalMode.addEventListener("change", function () {
      showMode(goalMode.value);
    });
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
  // Helper: maintenance estimate (Mifflin-St Jeor)
  // ------------------------------------------------------------
  function estimateMaintenanceCalories(sexValue, age, height, weight, activityMultiplier) {
    // BMR (kcal/day)
    let bmr = 0;
    if (sexValue === "female") {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
    } else {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
    }
    const tdee = bmr * activityMultiplier;
    return tdee;
  }

  // Helper: clamp
  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const mode = goalMode ? goalMode.value : "timeline";

      // Parse inputs using toNumber() (from /scripts/main.js)
      const age = toNumber(ageYears ? ageYears.value : "");
      const height = toNumber(heightCm ? heightCm.value : "");
      const weight = toNumber(weightKg ? weightKg.value : "");
      const activity = toNumber(activityLevel ? activityLevel.value : "");
      const maintenanceOverrideVal = toNumber(maintenanceOverride ? maintenanceOverride.value : "");

      const tgtWeightTimeline = toNumber(targetWeightKg ? targetWeightKg.value : "");
      const weeksTimeline = toNumber(timelineWeeks ? timelineWeeks.value : "");

      const rateWeekly = toNumber(rateKgPerWeek ? rateKgPerWeek.value : "");
      const tgtWeightOptional = toNumber(optionalTargetWeightKg ? optionalTargetWeightKg.value : "");

      // Basic existence guard
      if (!sex || !ageYears || !heightCm || !weightKg || !activityLevel || !goalMode) return;

      // Validation: baseline profile for estimate
      if (!validatePositive(age, "age")) return;
      if (!validatePositive(height, "height")) return;
      if (!validatePositive(weight, "current weight")) return;
      if (!validatePositive(activity, "activity level")) return;

      // Determine maintenance calories (override if provided)
      let maintenance = 0;
      let maintenanceSource = "estimated from your stats";
      if (Number.isFinite(maintenanceOverrideVal) && maintenanceOverrideVal > 0) {
        maintenance = maintenanceOverrideVal;
        maintenanceSource = "your maintenance calories override";
      } else {
        maintenance = estimateMaintenanceCalories(sex.value, age, height, weight, activity);
      }

      if (!Number.isFinite(maintenance) || maintenance <= 0) {
        setResultError("Enter valid inputs so maintenance calories can be calculated.");
        return;
      }

      // Goal calculations
      const KCAL_PER_KG = 7700;
      let dailyDeficit = 0;
      let weeklyDeficit = 0;
      let impliedWeeklyChangeKg = 0;
      let extraLine = "";
      let timeToGoalLine = "";

      if (mode === "timeline") {
        if (!validatePositive(tgtWeightTimeline, "target weight")) return;
        if (!validatePositive(weeksTimeline, "timeline (weeks)")) return;

        const kgToLose = weight - tgtWeightTimeline;
        if (!Number.isFinite(kgToLose) || kgToLose <= 0) {
          setResultError("Target weight must be lower than your current weight for a deficit goal.");
          return;
        }

        const totalKcal = kgToLose * KCAL_PER_KG;
        const totalDays = weeksTimeline * 7;

        dailyDeficit = totalKcal / totalDays;
        weeklyDeficit = dailyDeficit * 7;
        impliedWeeklyChangeKg = kgToLose / weeksTimeline;

        extraLine = "This assumes a steady average loss of about " + formatNumberTwoDecimals(impliedWeeklyChangeKg) + " kg per week.";
      } else {
        if (!validatePositive(rateWeekly, "weekly change rate")) return;

        dailyDeficit = (rateWeekly * KCAL_PER_KG) / 7;
        weeklyDeficit = dailyDeficit * 7;
        impliedWeeklyChangeKg = rateWeekly;

        // If optional target weight provided, estimate weeks to goal
        if (Number.isFinite(tgtWeightOptional) && tgtWeightOptional > 0) {
          const kgToLose = weight - tgtWeightOptional;
          if (kgToLose > 0) {
            const estWeeks = kgToLose / rateWeekly;
            timeToGoalLine = "Estimated time to reach " + formatNumberTwoDecimals(tgtWeightOptional) + " kg: about " + formatNumberTwoDecimals(estWeeks) + " weeks (average).";
          } else {
            timeToGoalLine = "Optional target weight is not below your current weight, so time-to-goal was not calculated.";
          }
        }
      }

      // Sanity checks and conservative safety clamps
      const maxDeficitByPercent = maintenance * 0.35;
      const deficitCapped = clamp(dailyDeficit, 0, maxDeficitByPercent);

      let wasCapped = false;
      if (deficitCapped !== dailyDeficit) {
        wasCapped = true;
        dailyDeficit = deficitCapped;
        weeklyDeficit = dailyDeficit * 7;
        impliedWeeklyChangeKg = (weeklyDeficit / KCAL_PER_KG);
      }

      // Minimum intake floor (conservative)
      const minIntake = (sex.value === "female") ? 1500 : 1800;
      let targetIntake = maintenance - dailyDeficit;

      let intakeFloored = false;
      if (targetIntake < minIntake) {
        intakeFloored = true;
        targetIntake = minIntake;
        dailyDeficit = Math.max(0, maintenance - targetIntake);
        weeklyDeficit = dailyDeficit * 7;
        impliedWeeklyChangeKg = (weeklyDeficit / KCAL_PER_KG);
      }

      // Teen caution
      let teenCaution = "";
      if (age < 18) {
        teenCaution = "If you are under 18, do not use aggressive deficits. Treat these numbers as rough estimates and speak to a qualified health professional.";
      }

      // Build output HTML
      const maintenanceRounded = Math.round(maintenance);
      const targetIntakeRounded = Math.round(targetIntake);
      const dailyDeficitRounded = Math.round(dailyDeficit);
      const weeklyDeficitRounded = Math.round(weeklyDeficit);

      let notices = "";
      if (wasCapped) {
        notices += "<p><strong>Note:</strong> Your requested deficit was very aggressive. This tool capped it at 35% of maintenance for a more conservative target.</p>";
      }
      if (intakeFloored) {
        notices += "<p><strong>Note:</strong> The calculated intake was very low. This tool applied a conservative minimum intake floor and recalculated the deficit from that.</p>";
      }
      if (teenCaution) {
        notices += "<p><strong>Caution:</strong> " + teenCaution + "</p>";
      }

      const resultHtml =
        "<p><strong>Maintenance calories:</strong> " + maintenanceRounded + " kcal/day (" + maintenanceSource + ")</p>" +
        "<p><strong>Daily calorie target:</strong> " + targetIntakeRounded + " kcal/day</p>" +
        "<p><strong>Daily deficit:</strong> " + dailyDeficitRounded + " kcal/day</p>" +
        "<p><strong>Weekly deficit:</strong> " + weeklyDeficitRounded + " kcal/week</p>" +
        "<p><strong>Implied weekly change:</strong> about " + formatNumberTwoDecimals(impliedWeeklyChangeKg) + " kg/week (average)</p>" +
        (extraLine ? "<p>" + extraLine + "</p>" : "") +
        (timeToGoalLine ? "<p>" + timeToGoalLine + "</p>" : "") +
        notices +
        "<p><strong>Practical check:</strong> If results feel extreme, reduce the pace (smaller deficit) and reassess after 2 to 4 weeks using your weight trend, not single weigh-ins.</p>";

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Calorie Deficit Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
