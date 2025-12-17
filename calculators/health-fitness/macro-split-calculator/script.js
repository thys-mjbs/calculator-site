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

  const caloriesInput = document.getElementById("caloriesInput");

  const proteinPctInput = document.getElementById("proteinPctInput");
  const carbsPctInput = document.getElementById("carbsPctInput");
  const fatPctInput = document.getElementById("fatPctInput");

  const weightKgInput = document.getElementById("weightKgInput");
  const proteinGkgInput = document.getElementById("proteinGkgInput");
  const fatGkgInput = document.getElementById("fatGkgInput");

  const modeBlockPercent = document.getElementById("modeBlockPercent");
  const modeBlockGkg = document.getElementById("modeBlockGkg");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Calories benefits from commas
  attachLiveFormatting(caloriesInput);

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
    if (modeBlockPercent) modeBlockPercent.classList.add("hidden");
    if (modeBlockGkg) modeBlockGkg.classList.add("hidden");

    if (mode === "gkg") {
      if (modeBlockGkg) modeBlockGkg.classList.remove("hidden");
    } else {
      if (modeBlockPercent) modeBlockPercent.classList.remove("hidden");
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

  function roundToOneDecimal(n) {
    if (!Number.isFinite(n)) return n;
    return Math.round(n * 10) / 10;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const mode = modeSelect ? modeSelect.value : "percent";

      if (!caloriesInput) return;
      const totalCalories = toNumber(caloriesInput.value);

      if (!validatePositive(totalCalories, "daily calories")) return;

      // Defaults for g/kg mode (only applied if user leaves them blank)
      const defaultProteinGkg = 1.6;
      const defaultFatGkg = 0.8;

      let proteinGrams = 0;
      let carbsGrams = 0;
      let fatGrams = 0;

      let proteinCalories = 0;
      let carbsCalories = 0;
      let fatCalories = 0;

      if (mode === "percent") {
        if (!proteinPctInput || !carbsPctInput || !fatPctInput) return;

        const proteinPct = toNumber(proteinPctInput.value);
        const carbsPct = toNumber(carbsPctInput.value);
        const fatPct = toNumber(fatPctInput.value);

        if (!validateNonNegative(proteinPct, "protein percentage")) return;
        if (!validateNonNegative(carbsPct, "carbs percentage")) return;
        if (!validateNonNegative(fatPct, "fat percentage")) return;

        const sum = proteinPct + carbsPct + fatPct;

        if (!Number.isFinite(sum) || Math.abs(sum - 100) > 0.5) {
          setResultError("Your macro percentages should add up to 100%. Adjust protein, carbs, and fat until they total 100.");
          return;
        }

        proteinCalories = (totalCalories * proteinPct) / 100;
        carbsCalories = (totalCalories * carbsPct) / 100;
        fatCalories = (totalCalories * fatPct) / 100;

        proteinGrams = proteinCalories / 4;
        carbsGrams = carbsCalories / 4;
        fatGrams = fatCalories / 9;
      } else {
        if (!weightKgInput || !proteinGkgInput || !fatGkgInput) return;

        const weightKg = toNumber(weightKgInput.value);
        if (!validatePositive(weightKg, "body weight (kg)")) return;

        const proteinGkgRaw = toNumber(proteinGkgInput.value);
        const fatGkgRaw = toNumber(fatGkgInput.value);

        const proteinGkg = Number.isFinite(proteinGkgRaw) && proteinGkgRaw > 0 ? proteinGkgRaw : defaultProteinGkg;
        const fatGkg = Number.isFinite(fatGkgRaw) && fatGkgRaw >= 0 ? fatGkgRaw : defaultFatGkg;

        proteinGrams = weightKg * proteinGkg;
        fatGrams = weightKg * fatGkg;

        proteinCalories = proteinGrams * 4;
        fatCalories = fatGrams * 9;

        const remaining = totalCalories - proteinCalories - fatCalories;

        if (!Number.isFinite(remaining) || remaining < 0) {
          setResultError("Your protein and fat targets use more calories than your total. Lower protein or fat targets, or increase daily calories.");
          return;
        }

        carbsCalories = remaining;
        carbsGrams = carbsCalories / 4;
      }

      // Clean up numbers for display
      proteinGrams = Math.max(0, proteinGrams);
      carbsGrams = Math.max(0, carbsGrams);
      fatGrams = Math.max(0, fatGrams);

      proteinCalories = Math.max(0, proteinCalories);
      carbsCalories = Math.max(0, carbsCalories);
      fatCalories = Math.max(0, fatCalories);

      const totalCaloriesCheck = proteinCalories + carbsCalories + fatCalories;

      const pG = roundToOneDecimal(proteinGrams);
      const cG = roundToOneDecimal(carbsGrams);
      const fG = roundToOneDecimal(fatGrams);

      const pC = Math.round(proteinCalories);
      const cC = Math.round(carbsCalories);
      const fC = Math.round(fatCalories);

      const meals3 = {
        p: pG / 3,
        c: cG / 3,
        f: fG / 3
      };

      const meals4 = {
        p: pG / 4,
        c: cG / 4,
        f: fG / 4
      };

      const methodLabel = mode === "percent" ? "Macro percentages" : "Grams per kg bodyweight";

      const resultHtml = `
        <p><strong>Method:</strong> ${methodLabel}</p>
        <p><strong>Daily targets:</strong></p>
        <ul>
          <li><strong>Protein:</strong> ${formatNumberTwoDecimals(pG)} g (${pC} kcal)</li>
          <li><strong>Carbs:</strong> ${formatNumberTwoDecimals(cG)} g (${cC} kcal)</li>
          <li><strong>Fat:</strong> ${formatNumberTwoDecimals(fG)} g (${fC} kcal)</li>
        </ul>
        <p><strong>Per meal estimate:</strong></p>
        <ul>
          <li><strong>3 meals/day:</strong> ${formatNumberTwoDecimals(meals3.p)} g protein, ${formatNumberTwoDecimals(meals3.c)} g carbs, ${formatNumberTwoDecimals(meals3.f)} g fat</li>
          <li><strong>4 meals/day:</strong> ${formatNumberTwoDecimals(meals4.p)} g protein, ${formatNumberTwoDecimals(meals4.c)} g carbs, ${formatNumberTwoDecimals(meals4.f)} g fat</li>
        </ul>
        <p><strong>Sanity check:</strong> macros add up to about ${Math.round(totalCaloriesCheck)} kcal (rounding can cause small differences).</p>
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
      const message = "Macro Split Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
