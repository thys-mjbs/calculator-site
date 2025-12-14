document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const modeSelect = document.getElementById("modeSelect");
  const sexSelect = document.getElementById("sexSelect");
  const ageInput = document.getElementById("ageInput");

  const metricBlock = document.getElementById("metricBlock");
  const imperialBlock = document.getElementById("imperialBlock");

  const heightCmInput = document.getElementById("heightCmInput");
  const weightKgInput = document.getElementById("weightKgInput");

  const heightFtInput = document.getElementById("heightFtInput");
  const heightInInput = document.getElementById("heightInInput");
  const weightLbInput = document.getElementById("weightLbInput");

  const activitySelect = document.getElementById("activitySelect");
  const macroPresetSelect = document.getElementById("macroPresetSelect");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(ageInput);
  attachLiveFormatting(heightCmInput);
  attachLiveFormatting(weightKgInput);
  attachLiveFormatting(heightFtInput);
  attachLiveFormatting(heightInInput);
  attachLiveFormatting(weightLbInput);

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

  function validateNonNegative(value, fieldLabel) {
    if (!Number.isFinite(value) || value < 0) {
      setResultError("Enter a valid " + fieldLabel + " (0 or higher).");
      return false;
    }
    return true;
  }

  function validateRangeInclusive(value, fieldLabel, min, max) {
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
      const mode = modeSelect ? modeSelect.value : "metric";

      const age = toNumber(ageInput ? ageInput.value : "");
      const sex = sexSelect ? sexSelect.value : "";
      const activityFactor = activitySelect ? toNumber(activitySelect.value) : NaN;
      const macroPreset = macroPresetSelect ? macroPresetSelect.value : "";

      if (!sex) {
        setResultError("Select a sex.");
        return;
      }

      if (!validateRangeInclusive(age, "age", 10, 120)) return;

      if (!Number.isFinite(activityFactor) || activityFactor <= 0) {
        setResultError("Select an activity level.");
        return;
      }

      let heightCm = NaN;
      let weightKg = NaN;

      if (mode === "imperial") {
        const ft = toNumber(heightFtInput ? heightFtInput.value : "");
        const inch = toNumber(heightInInput ? heightInInput.value : "");
        const lb = toNumber(weightLbInput ? weightLbInput.value : "");

        if (!validatePositive(ft, "height (ft)")) return;
        if (!validateNonNegative(inch, "height (in)")) return;
        if (!validateRangeInclusive(inch, "height (in)", 0, 11)) return;
        if (!validatePositive(lb, "weight (lb)")) return;

        const totalInches = (ft * 12) + inch;
        heightCm = totalInches * 2.54;
        weightKg = lb * 0.45359237;
      } else {
        heightCm = toNumber(heightCmInput ? heightCmInput.value : "");
        weightKg = toNumber(weightKgInput ? weightKgInput.value : "");

        if (!validatePositive(heightCm, "height (cm)")) return;
        if (!validatePositive(weightKg, "weight (kg)")) return;
      }

      // Mifflin-St Jeor:
      // Male:   BMR = 10*kg + 6.25*cm - 5*age + 5
      // Female: BMR = 10*kg + 6.25*cm - 5*age - 161
      const base = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
      const bmr = sex === "male" ? (base + 5) : (base - 161);
      const tdee = bmr * activityFactor;

      const bmrRounded = Math.round(bmr);
      const tdeeRounded = Math.round(tdee);

      let macroHtml = "";
      if (macroPreset) {
        let pPct = 0;
        let cPct = 0;
        let fPct = 0;

        if (macroPreset === "balanced") {
          pPct = 25; cPct = 45; fPct = 30;
        } else if (macroPreset === "high-protein") {
          pPct = 30; cPct = 40; fPct = 30;
        } else if (macroPreset === "low-carb") {
          pPct = 30; cPct = 25; fPct = 45;
        }

        const proteinCals = tdee * (pPct / 100);
        const carbCals = tdee * (cPct / 100);
        const fatCals = tdee * (fPct / 100);

        const proteinG = Math.round(proteinCals / 4);
        const carbsG = Math.round(carbCals / 4);
        const fatG = Math.round(fatCals / 9);

        macroHtml = `
          <p><strong>Macro targets (grams/day):</strong></p>
          <ul>
            <li>Protein: ${proteinG} g (${pPct}%)</li>
            <li>Carbs: ${carbsG} g (${cPct}%)</li>
            <li>Fat: ${fatG} g (${fPct}%)</li>
          </ul>
        `;
      }

      const resultHtml = `
        <p><strong>Estimated maintenance calories (TDEE):</strong> ${tdeeRounded} kcal/day</p>
        <p><strong>Estimated BMR:</strong> ${bmrRounded} kcal/day</p>
        <p style="margin-top:10px;"><strong>Practical use:</strong> If your weekly average weight trends up or down over 2–3 weeks, adjust by 100–200 kcal/day and re-check.</p>
        ${macroHtml}
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
      const message = "Calorie Maintenance Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
