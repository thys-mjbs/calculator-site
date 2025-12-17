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

  const metricBlock = document.getElementById("metricBlock");
  const imperialBlock = document.getElementById("imperialBlock");

  const heightCm = document.getElementById("heightCm");
  const weightKg = document.getElementById("weightKg");

  const heightFt = document.getElementById("heightFt");
  const heightIn = document.getElementById("heightIn");
  const weightLb = document.getElementById("weightLb");

  const formula = document.getElementById("formula");
  const bodyFatBlock = document.getElementById("bodyFatBlock");
  const bodyFatPercent = document.getElementById("bodyFatPercent");

  const activityLevel = document.getElementById("activityLevel");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // BMR inputs are typically small, so live comma formatting is not necessary.
  // Leave this block intentionally empty for this calculator.

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

    if (mode === "metric" && metricBlock) metricBlock.classList.remove("hidden");
    if (mode === "imperial" && imperialBlock) imperialBlock.classList.remove("hidden");

    clearResult();
  }

  function showFormula(formulaMode) {
    if (bodyFatBlock) bodyFatBlock.classList.add("hidden");
    if (formulaMode === "katch" && bodyFatBlock) bodyFatBlock.classList.remove("hidden");
    clearResult();
  }

  if (unitSystem) {
    showMode(unitSystem.value);
    unitSystem.addEventListener("change", function () {
      showMode(unitSystem.value);
    });
  }

  if (formula) {
    showFormula(formula.value);
    formula.addEventListener("change", function () {
      showFormula(formula.value);
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
      // Read modes
      const units = unitSystem ? unitSystem.value : "metric";
      const formulaMode = formula ? formula.value : "mifflin";

      // Parse common inputs
      const age = toNumber(ageYears ? ageYears.value : "");
      const sexValue = sex ? sex.value : "female";

      if (!validateRange(age, "age", 10, 120)) return;

      // Read height + weight (convert to metric)
      let heightCmValue = NaN;
      let weightKgValue = NaN;

      if (units === "metric") {
        heightCmValue = toNumber(heightCm ? heightCm.value : "");
        weightKgValue = toNumber(weightKg ? weightKg.value : "");
        if (!validateRange(heightCmValue, "height (cm)", 80, 250)) return;
        if (!validateRange(weightKgValue, "weight (kg)", 20, 300)) return;
      } else {
        const ft = toNumber(heightFt ? heightFt.value : "");
        const inch = toNumber(heightIn ? heightIn.value : "");
        const lb = toNumber(weightLb ? weightLb.value : "");

        if (!validateRange(ft, "height (feet)", 3, 8)) return;
        if (!validateRange(inch, "height (inches)", 0, 11)) return;
        if (!validateRange(lb, "weight (lb)", 44, 660)) return;

        const totalInches = (ft * 12) + inch;
        heightCmValue = totalInches * 2.54;
        weightKgValue = lb * 0.45359237;
      }

      // Optional body fat input (only required for Katch)
      const bf = toNumber(bodyFatPercent ? bodyFatPercent.value : "");
      if (formulaMode === "katch") {
        if (!validateRange(bf, "body fat %", 3, 70)) return;
      }

      // Calculate BMR (kcal/day)
      let bmr = NaN;

      if (formulaMode === "mifflin") {
        // Mifflin-St Jeor
        // Men: 10W + 6.25H - 5A + 5
        // Women: 10W + 6.25H - 5A - 161
        const base = (10 * weightKgValue) + (6.25 * heightCmValue) - (5 * age);
        bmr = sexValue === "male" ? (base + 5) : (base - 161);
      } else if (formulaMode === "harris") {
        // Harris-Benedict (revised)
        // Men: 88.362 + 13.397W + 4.799H - 5.677A
        // Women: 447.593 + 9.247W + 3.098H - 4.330A
        if (sexValue === "male") {
          bmr = 88.362 + (13.397 * weightKgValue) + (4.799 * heightCmValue) - (5.677 * age);
        } else {
          bmr = 447.593 + (9.247 * weightKgValue) + (3.098 * heightCmValue) - (4.33 * age);
        }
      } else {
        // Katch-McArdle
        // BMR = 370 + 21.6 * LBM(kg)
        const lbm = weightKgValue * (1 - (bf / 100));
        if (!validatePositive(lbm, "lean body mass")) return;
        bmr = 370 + (21.6 * lbm);
      }

      if (!Number.isFinite(bmr) || bmr <= 0) {
        setResultError("Could not calculate BMR with the provided inputs. Check your values and try again.");
        return;
      }

      // Optional maintenance estimate
      let tdee = null;
      const activity = activityLevel ? activityLevel.value : "none";
      if (activity !== "none") {
        const factor = toNumber(activity);
        if (Number.isFinite(factor) && factor > 0) {
          tdee = bmr * factor;
        }
      }

      // Build output HTML
      const bmrOut = formatNumberTwoDecimals(bmr);
      let resultHtml = `<p><strong>Estimated BMR:</strong> ${bmrOut} kcal/day</p>`;

      resultHtml += `<p>This is your estimated daily calorie burn at rest. If you want a daily eating target, use the maintenance estimate below (if selected), then adjust based on your real-world weight trend.</p>`;

      if (tdee !== null) {
        const tdeeOut = formatNumberTwoDecimals(tdee);
        const cut = formatNumberTwoDecimals(Math.max(0, tdee - 500));
        const gain = formatNumberTwoDecimals(tdee + 300);

        resultHtml += `<hr>`;
        resultHtml += `<p><strong>Estimated maintenance (TDEE):</strong> ${tdeeOut} kcal/day</p>`;
        resultHtml += `<p><strong>Simple targets (optional):</strong></p>`;
        resultHtml += `<ul>
          <li><strong>Fat loss (about 500 kcal/day below maintenance):</strong> ${cut} kcal/day</li>
          <li><strong>Weight gain (about 300 kcal/day above maintenance):</strong> ${gain} kcal/day</li>
        </ul>`;
        resultHtml += `<p>These targets are starting points. If progress stalls or is too fast, adjust by 100 to 200 kcal and reassess after 2 weeks.</p>`;
      } else {
        resultHtml += `<p><em>Tip:</em> If you select an activity level, the calculator will also estimate maintenance calories (TDEE), which is usually the more practical number for daily planning.</p>`;
      }

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
      const message = "Basal Metabolic Rate (BMR) Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
