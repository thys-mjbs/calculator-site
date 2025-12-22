document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const unitSystem = document.getElementById("unitSystem");
  const metricBlock = document.getElementById("metricBlock");
  const imperialBlock = document.getElementById("imperialBlock");

  const sex = document.getElementById("sex");
  const age = document.getElementById("age");
  const activity = document.getElementById("activity");

  const heightCm = document.getElementById("heightCm");
  const weightKg = document.getElementById("weightKg");

  const heightFt = document.getElementById("heightFt");
  const heightIn = document.getElementById("heightIn");
  const weightLb = document.getElementById("weightLb");

  const bodyFat = document.getElementById("bodyFat");
  const goal = document.getElementById("goal");
  const ratePerWeek = document.getElementById("ratePerWeek");
  const rateUnit = document.getElementById("rateUnit");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  const modeSelect = unitSystem;
  const modeBlockA = metricBlock;
  const modeBlockB = imperialBlock;

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(age);
  attachLiveFormatting(heightCm);
  attachLiveFormatting(weightKg);
  attachLiveFormatting(heightFt);
  attachLiveFormatting(heightIn);
  attachLiveFormatting(weightLb);
  attachLiveFormatting(bodyFat);
  attachLiveFormatting(ratePerWeek);

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
    if (modeBlockA) modeBlockA.classList.add("hidden");
    if (modeBlockB) modeBlockB.classList.add("hidden");

    if (mode === "metric" && modeBlockA) modeBlockA.classList.remove("hidden");
    if (mode === "imperial" && modeBlockB) modeBlockB.classList.remove("hidden");

    clearResult();
  }

  if (modeSelect) {
    showMode(modeSelect.value);
    modeSelect.addEventListener("change", function () {
      showMode(modeSelect.value);
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

  function validateRange(value, min, max, fieldLabel) {
    if (!Number.isFinite(value) || value < min || value > max) {
      setResultError("Enter a valid " + fieldLabel + " between " + min + " and " + max + ".");
      return false;
    }
    return true;
  }

  function calories(n) {
    return Math.round(n).toLocaleString("en-US");
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const mode = modeSelect ? modeSelect.value : "metric";

      if (!sex || !age || !activity) return;

      const ageYears = toNumber(age.value);
      const activityKey = activity.value;
      const sexValue = sex.value;

      if (!sexValue) {
        setResultError("Select your sex to estimate TDEE.");
        return;
      }

      if (!validateRange(ageYears, 10, 120, "age (years)")) return;

      const multipliers = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        very: 1.725,
        extra: 1.9
      };

      const activityMult = multipliers[activityKey];
      if (!Number.isFinite(activityMult)) {
        setResultError("Select an activity level.");
        return;
      }

      let heightCmVal = 0;
      let weightKgVal = 0;

      if (mode === "metric") {
        if (!heightCm || !weightKg) return;
        heightCmVal = toNumber(heightCm.value);
        weightKgVal = toNumber(weightKg.value);

        if (!validateRange(heightCmVal, 100, 250, "height (cm)")) return;
        if (!validateRange(weightKgVal, 20, 300, "weight (kg)")) return;
      } else {
        if (!heightFt || !heightIn || !weightLb) return;

        const ft = toNumber(heightFt.value);
        const inch = toNumber(heightIn.value);
        const lb = toNumber(weightLb.value);

        if (!validateRange(ft, 3, 8, "height (feet)")) return;
        if (!validateRange(inch, 0, 11.99, "height (inches)")) return;
        if (!validateRange(lb, 44, 660, "weight (lb)")) return;

        const totalInches = (ft * 12) + inch;
        const cm = totalInches * 2.54;
        const kg = lb * 0.45359237;

        heightCmVal = cm;
        weightKgVal = kg;
      }

      // Optional body fat
      let bmr = 0;
      const bf = bodyFat ? toNumber(bodyFat.value) : NaN;

      const hasBodyFat = Number.isFinite(bf) && bf > 0;
      if (hasBodyFat) {
        if (!validateRange(bf, 3, 70, "body fat percentage")) return;
        const lbmKg = weightKgVal * (1 - (bf / 100));
        bmr = 370 + (21.6 * lbmKg);
      } else {
        // Mifflin-St Jeor
        if (sexValue === "male") {
          bmr = (10 * weightKgVal) + (6.25 * heightCmVal) - (5 * ageYears) + 5;
        } else {
          bmr = (10 * weightKgVal) + (6.25 * heightCmVal) - (5 * ageYears) - 161;
        }
      }

      if (!validatePositive(bmr, "BMR estimate")) return;

      const tdee = bmr * activityMult;
      if (!validatePositive(tdee, "TDEE estimate")) return;

      const tdeeLow = tdee * 0.95;
      const tdeeHigh = tdee * 1.05;

      // Goal calories
      const goalValue = goal ? goal.value : "maintain";
      const rateVal = ratePerWeek ? toNumber(ratePerWeek.value) : NaN;
      const rateUnitVal = rateUnit ? rateUnit.value : "kg";

      let goalCalories = tdee;
      let goalNote = "";
      let usingRate = false;

      if (goalValue === "lose" || goalValue === "gain") {
        if (Number.isFinite(rateVal) && rateVal > 0) {
          usingRate = true;
          const kcalPerUnit = rateUnitVal === "lb" ? 3500 : 7700;
          const dailyChange = (rateVal * kcalPerUnit) / 7;

          if (dailyChange > (tdee * 0.35)) {
            setResultError("That weekly target is too aggressive for this estimate. Reduce the rate or leave it blank for a conservative default.");
            return;
          }

          goalCalories = goalValue === "lose" ? (tdee - dailyChange) : (tdee + dailyChange);
          goalNote = "Based on your target rate, this applies about " + calories(dailyChange) + " calories per day " + (goalValue === "lose" ? "below" : "above") + " maintenance.";
        } else {
          const dailyChange = tdee * 0.10;
          goalCalories = goalValue === "lose" ? (tdee - dailyChange) : (tdee + dailyChange);
          goalNote = "No weekly rate provided, so this uses a conservative 10% " + (goalValue === "lose" ? "deficit" : "surplus") + " from maintenance.";
        }
      }

      const methodLine = hasBodyFat
        ? "BMR method: Lean-mass based (requires body fat %)."
        : "BMR method: Mifflin-St Jeor (age, sex, height, weight).";

      const goalLabel =
        goalValue === "maintain" ? "Suggested maintenance calories" :
        goalValue === "lose" ? "Suggested fat loss calories" :
        "Suggested weight gain calories";

      const goalRateLine = usingRate
        ? "<p><strong>Weekly target used:</strong> " + rateVal + " " + (rateUnitVal === "lb" ? "lb" : "kg") + " per week</p>"
        : "";

      const resultHtml =
        "<p><strong>Estimated maintenance calories (TDEE):</strong> " + calories(tdee) + " kcal/day</p>" +
        "<p><strong>Maintenance range (approx):</strong> " + calories(tdeeLow) + " to " + calories(tdeeHigh) + " kcal/day</p>" +
        "<p><strong>Estimated BMR:</strong> " + calories(bmr) + " kcal/day</p>" +
        "<p><strong>" + goalLabel + ":</strong> " + calories(goalCalories) + " kcal/day</p>" +
        (goalNote ? "<p>" + goalNote + "</p>" : "") +
        goalRateLine +
        "<p><strong>Activity multiplier used:</strong> " + activityMult + "</p>" +
        "<p>" + methodLine + "</p>";

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Total Daily Energy Expenditure (TDEE) Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
