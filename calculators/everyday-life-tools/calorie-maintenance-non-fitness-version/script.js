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
  const sex = document.getElementById("sex");
  const ageYears = document.getElementById("ageYears");
  const heightCm = document.getElementById("heightCm");
  const weightKg = document.getElementById("weightKg");

  const heightFt = document.getElementById("heightFt");
  const heightIn = document.getElementById("heightIn");
  const weightLb = document.getElementById("weightLb");

  const activityLevel = document.getElementById("activityLevel");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  const metricBlock = document.getElementById("metricBlock");
  const imperialBlock = document.getElementById("imperialBlock");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(ageYears);
  attachLiveFormatting(heightCm);
  attachLiveFormatting(weightKg);
  attachLiveFormatting(heightFt);
  attachLiveFormatting(heightIn);
  attachLiveFormatting(weightLb);

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
    if (metricBlock) metricBlock.classList.add("hidden");
    if (imperialBlock) imperialBlock.classList.add("hidden");

    if (mode === "imperial") {
      if (imperialBlock) imperialBlock.classList.remove("hidden");
    } else {
      if (metricBlock) metricBlock.classList.remove("hidden");
    }

    clearResult();
  }

  if (unitSystem) {
    showMode(unitSystem.value);
    unitSystem.addEventListener("change", function () {
      showMode(unitSystem.value);
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
      const mode = unitSystem ? unitSystem.value : "metric";

      const age = toNumber(ageYears ? ageYears.value : "");
      const act = toNumber(activityLevel ? activityLevel.value : "");
      const sexVal = sex ? sex.value : "female";

      if (!validateRange(age, "age", 13, 100)) return;
      if (!validateRange(act, "activity level", 1.2, 1.9)) return;

      let kg = 0;
      let cm = 0;

      if (mode === "imperial") {
        const ft = toNumber(heightFt ? heightFt.value : "");
        const inch = toNumber(heightIn ? heightIn.value : "");
        const lb = toNumber(weightLb ? weightLb.value : "");

        if (!validatePositive(ft, "height (feet)")) return;
        if (!validateRange(inch, "height (inches)", 0, 11)) return;
        if (!validatePositive(lb, "weight (lb)")) return;

        const totalInches = ft * 12 + inch;

        // Reasonable guardrails
        if (!validateRange(totalInches, "height (total inches)", 48, 84)) return;
        if (!validateRange(lb, "weight (lb)", 66, 550)) return;

        cm = totalInches * 2.54;
        kg = lb * 0.45359237;
      } else {
        const hcm = toNumber(heightCm ? heightCm.value : "");
        const wkg = toNumber(weightKg ? weightKg.value : "");

        if (!validatePositive(hcm, "height (cm)")) return;
        if (!validatePositive(wkg, "weight (kg)")) return;

        if (!validateRange(hcm, "height (cm)", 120, 230)) return;
        if (!validateRange(wkg, "weight (kg)", 30, 250)) return;

        cm = hcm;
        kg = wkg;
      }

      // Mifflin-St Jeor (most common practical estimate)
      let bmr = 10 * kg + 6.25 * cm - 5 * age;
      if (sexVal === "male") {
        bmr += 5;
      } else {
        bmr -= 161;
      }

      const maintenance = bmr * act;

      // Practical planning outputs
      const low = maintenance * 0.9;
      const high = maintenance * 1.1;

      const perMeal = maintenance / 3;
      const perWeek = maintenance * 7;

      const bmrRounded = Math.round(bmr);
      const maintRounded = Math.round(maintenance);
      const lowRounded = Math.round(low);
      const highRounded = Math.round(high);
      const perMealRounded = Math.round(perMeal);
      const perWeekRounded = Math.round(perWeek);

      const activityLabel =
        activityLevel && activityLevel.options && activityLevel.selectedIndex >= 0
          ? activityLevel.options[activityLevel.selectedIndex].text
          : "Selected activity level";

      const resultHtml =
        `<p><strong>Estimated maintenance calories:</strong> ${formatInputWithCommas(String(maintRounded))} calories per day</p>` +
        `<p><strong>Practical range:</strong> ${formatInputWithCommas(String(lowRounded))} to ${formatInputWithCommas(String(highRounded))} calories per day</p>` +
        `<p><strong>Simple breakdown:</strong> about ${formatInputWithCommas(String(perMealRounded))} calories per meal (3 meals), or ${formatInputWithCommas(String(perWeekRounded))} per week</p>` +
        `<hr>` +
        `<p><strong>How this was estimated:</strong></p>` +
        `<p>Baseline (resting) calories: ${formatInputWithCommas(String(bmrRounded))} per day</p>` +
        `<p>Activity level used: ${activityLabel}</p>`;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Calorie Maintenance (Non-Fitness Version) - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
