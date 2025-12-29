document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const dailyCalories = document.getElementById("dailyCalories");
  const includeSnack = document.getElementById("includeSnack");
  const breakfastPct = document.getElementById("breakfastPct");
  const lunchPct = document.getElementById("lunchPct");
  const dinnerPct = document.getElementById("dinnerPct");
  const snackPct = document.getElementById("snackPct");
  const snackPctGroup = document.getElementById("snackPctGroup");
  const roundingMode = document.getElementById("roundingMode");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(dailyCalories);

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
  function toggleSnackUI() {
    if (!snackPctGroup) return;
    const on = !!(includeSnack && includeSnack.checked);
    snackPctGroup.classList.toggle("hidden", !on);
    if (!on && snackPct) snackPct.value = "";
    clearResult();
  }

  if (includeSnack) {
    toggleSnackUI();
    includeSnack.addEventListener("change", function () {
      toggleSnackUI();
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

  function validatePercent(value, fieldLabel) {
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      setResultError("Enter a valid " + fieldLabel + " between 0 and 100.");
      return false;
    }
    return true;
  }

  function roundToNearest(value, step) {
    if (!Number.isFinite(value)) return value;
    if (!Number.isFinite(step) || step <= 0) return value;
    return Math.round(value / step) * step;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const daily = toNumber(dailyCalories ? dailyCalories.value : "");
      const snackOn = !!(includeSnack && includeSnack.checked);

      const bRaw = breakfastPct ? breakfastPct.value.trim() : "";
      const lRaw = lunchPct ? lunchPct.value.trim() : "";
      const dRaw = dinnerPct ? dinnerPct.value.trim() : "";
      const sRaw = snackPct ? snackPct.value.trim() : "";

      const anyCustomEntered =
        bRaw !== "" || lRaw !== "" || dRaw !== "" || (snackOn && sRaw !== "");

      // Existence guard
      if (!dailyCalories || !breakfastPct || !lunchPct || !dinnerPct) return;

      // Validation
      if (!validatePositive(daily, "daily calorie target")) return;
      if (daily > 20000) {
        setResultError(
          "Enter a realistic daily calorie target (20,000 kcal or less)."
        );
        return;
      }

      // Determine percentages
      let pctBreakfast;
      let pctLunch;
      let pctDinner;
      let pctSnack = 0;

      if (anyCustomEntered) {
        // Require completeness
        if (bRaw === "" || lRaw === "" || dRaw === "" || (snackOn && sRaw === "")) {
          setResultError(
            "If you use custom percentages, fill all visible percentage fields so they add up to 100%."
          );
          return;
        }

        pctBreakfast = toNumber(bRaw);
        pctLunch = toNumber(lRaw);
        pctDinner = toNumber(dRaw);
        pctSnack = snackOn ? toNumber(sRaw) : 0;

        if (!validatePercent(pctBreakfast, "Breakfast (%)")) return;
        if (!validatePercent(pctLunch, "Lunch (%)")) return;
        if (!validatePercent(pctDinner, "Dinner (%)")) return;
        if (snackOn && !validatePercent(pctSnack, "Snack (%)")) return;

        const totalPct = pctBreakfast + pctLunch + pctDinner + pctSnack;
        if (!Number.isFinite(totalPct) || Math.abs(totalPct - 100) > 0.01) {
          setResultError(
            "Your meal percentages must add up to 100%. Current total: " +
              formatNumberTwoDecimals(totalPct) +
              "%."
          );
          return;
        }
      } else {
        // Default split (locked intent: 3 meals, optional snack)
        if (snackOn) {
          // Reserve 10% for snack, split remaining evenly across 3 meals
          pctSnack = 10;
          const remaining = 90;
          pctBreakfast = remaining / 3;
          pctLunch = remaining / 3;
          pctDinner = remaining / 3;
        } else {
          // Common practical default: 30 / 35 / 35
          pctBreakfast = 30;
          pctLunch = 35;
          pctDinner = 35;
        }
      }

      // Calculation
      const caloriesBreakfast = (daily * pctBreakfast) / 100;
      const caloriesLunch = (daily * pctLunch) / 100;
      const caloriesDinner = (daily * pctDinner) / 100;
      const caloriesSnack = snackOn ? (daily * pctSnack) / 100 : 0;

      // Optional rounding
      const roundingValue =
        roundingMode && roundingMode.value !== "none"
          ? toNumber(roundingMode.value)
          : 0;

      let outBreakfast = caloriesBreakfast;
      let outLunch = caloriesLunch;
      let outDinner = caloriesDinner;
      let outSnack = caloriesSnack;

      let roundingNote = "";
      if (roundingValue === 5 || roundingValue === 10) {
        outBreakfast = roundToNearest(outBreakfast, roundingValue);
        outLunch = roundToNearest(outLunch, roundingValue);
        outDinner = roundToNearest(outDinner, roundingValue);
        if (snackOn) outSnack = roundToNearest(outSnack, roundingValue);

        // Adjust last meal to keep total exactly equal to daily
        const currentTotal =
          outBreakfast + outLunch + outDinner + (snackOn ? outSnack : 0);
        const diff = daily - currentTotal;

        if (snackOn) {
          outSnack = outSnack + diff;
        } else {
          outDinner = outDinner + diff;
        }

        roundingNote =
          "<p class='result-meta'><strong>Rounding applied:</strong> Rounded to nearest " +
          formatNumberTwoDecimals(roundingValue) +
          " kcal and adjusted the last item so the totals still match your daily target.</p>";
      }

      // Build output HTML
      const rows = [];
      rows.push(
        "<tr><th>Meal</th><th>Percent</th><th>Calories (kcal)</th></tr>"
      );
      rows.push(
        "<tr><td>Breakfast</td><td>" +
          formatNumberTwoDecimals(pctBreakfast) +
          "%</td><td>" +
          formatNumberTwoDecimals(outBreakfast) +
          "</td></tr>"
      );
      rows.push(
        "<tr><td>Lunch</td><td>" +
          formatNumberTwoDecimals(pctLunch) +
          "%</td><td>" +
          formatNumberTwoDecimals(outLunch) +
          "</td></tr>"
      );
      rows.push(
        "<tr><td>Dinner</td><td>" +
          formatNumberTwoDecimals(pctDinner) +
          "%</td><td>" +
          formatNumberTwoDecimals(outDinner) +
          "</td></tr>"
      );

      if (snackOn) {
        rows.push(
          "<tr><td>Snack</td><td>" +
            formatNumberTwoDecimals(pctSnack) +
            "%</td><td>" +
            formatNumberTwoDecimals(outSnack) +
            "</td></tr>"
        );
      }

      const finalTotal =
        outBreakfast + outLunch + outDinner + (snackOn ? outSnack : 0);

      const splitLabel = anyCustomEntered ? "Custom split" : "Default split";

      const resultHtml =
        "<p><strong>Per-meal calorie plan:</strong> " +
        splitLabel +
        " based on " +
        formatNumberTwoDecimals(daily) +
        " kcal/day.</p>" +
        "<table class='result-table' aria-label='Meal calorie breakdown'>" +
        rows.join("") +
        "</table>" +
        "<p class='result-meta'><strong>Total:</strong> " +
        formatNumberTwoDecimals(finalTotal) +
        " kcal/day</p>" +
        roundingNote +
        "<p class='result-meta'>Use these numbers as targets, not rules. If one meal runs higher, tighten another meal so the daily total stays on track.</p>";

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
      const message =
        "Daily Meal Planner Calories Calculator - check this calculator: " +
        pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
