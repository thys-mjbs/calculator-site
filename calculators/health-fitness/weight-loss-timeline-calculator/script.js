document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const unitSelect = document.getElementById("unitSelect");
  const currentWeightInput = document.getElementById("currentWeight");
  const targetWeightInput = document.getElementById("targetWeight");
  const startDateInput = document.getElementById("startDate");
  const weeklyLossRateInput = document.getElementById("weeklyLossRate");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Attach formatting where it makes sense
  attachLiveFormatting(currentWeightInput);
  attachLiveFormatting(targetWeightInput);
  attachLiveFormatting(weeklyLossRateInput);

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
  // 4) VALIDATION HELPERS (OPTIONAL)
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

  function parseStartDateOrToday(text) {
    const trimmed = (text || "").trim();
    if (!trimmed) {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    // Expect YYYY-MM-DD
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    if (!m) return null;

    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const d = Number(m[3]);

    const dt = new Date(y, mo, d);
    if (
      dt.getFullYear() !== y ||
      dt.getMonth() !== mo ||
      dt.getDate() !== d
    ) {
      return null;
    }
    return dt;
  }

  function addDays(dateObj, days) {
    const dt = new Date(dateObj.getTime());
    dt.setDate(dt.getDate() + days);
    return dt;
  }

  function formatDateYYYYMMDD(dateObj) {
    const y = String(dateObj.getFullYear());
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + d;
  }

  function paceLabel(ratePerWeek, unit) {
    // Simple, not medical advice: just a planning label
    const r = ratePerWeek;

    if (unit === "kg") {
      if (r < 0.25) return "Very slow (easy to sustain, but long timeline)";
      if (r <= 0.75) return "Moderate (common, generally sustainable)";
      if (r <= 1.0) return "Fast (may be harder to sustain)";
      return "Very fast (often unrealistic for long periods)";
    }

    // lb
    if (r < 0.5) return "Very slow (easy to sustain, but long timeline)";
    if (r <= 1.5) return "Moderate (common, generally sustainable)";
    if (r <= 2.0) return "Fast (may be harder to sustain)";
    return "Very fast (often unrealistic for long periods)";
  }

  // ------------------------------------------------------------
  // 5) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      if (!currentWeightInput || !targetWeightInput || !unitSelect) return;

      const unit = unitSelect.value === "lb" ? "lb" : "kg";

      const currentWeight = toNumber(currentWeightInput.value);
      const targetWeight = toNumber(targetWeightInput.value);

      if (!validatePositive(currentWeight, "current weight")) return;
      if (!validatePositive(targetWeight, "target weight")) return;

      if (targetWeight >= currentWeight) {
        setResultError("Target weight must be lower than current weight for a weight loss timeline.");
        return;
      }

      const startDate = parseStartDateOrToday(startDateInput ? startDateInput.value : "");
      if (!startDate) {
        setResultError("Enter a valid start date in YYYY-MM-DD format, or leave it blank to use today.");
        return;
      }

      let weeklyLossRate = toNumber(weeklyLossRateInput ? weeklyLossRateInput.value : "");
      if (!Number.isFinite(weeklyLossRate) || weeklyLossRate <= 0) {
        weeklyLossRate = unit === "kg" ? 0.5 : 1.0; // conservative default
      }

      // Soft validation for unrealistic values (still allow, but warn via output)
      const lossAmount = currentWeight - targetWeight; // in selected unit
      const weeks = lossAmount / weeklyLossRate;

      if (!Number.isFinite(weeks) || weeks <= 0) {
        setResultError("Enter values that produce a valid timeline.");
        return;
      }

      const totalDaysRaw = weeks * 7;
      const totalDays = Math.max(1, Math.round(totalDaysRaw));

      const goalDate = addDays(startDate, totalDays);

      // Energy conversion for a rough implied daily deficit
      const kcalPerUnit = unit === "kg" ? 7700 : 3500;
      const totalKcal = lossAmount * kcalPerUnit;
      const dailyDeficit = totalKcal / totalDays;

      // Milestones
      const m25Days = Math.max(1, Math.round(totalDays * 0.25));
      const m50Days = Math.max(1, Math.round(totalDays * 0.5));
      const m75Days = Math.max(1, Math.round(totalDays * 0.75));

      const date25 = addDays(startDate, m25Days);
      const date50 = addDays(startDate, m50Days);
      const date75 = addDays(startDate, m75Days);

      // Output formatting
      const weeksRounded = formatNumberTwoDecimals(weeks);
      const lossRounded = formatNumberTwoDecimals(lossAmount);
      const weeklyRounded = formatNumberTwoDecimals(weeklyLossRate);
      const dailyDeficitRounded = formatNumberTwoDecimals(dailyDeficit);

      const paceText = paceLabel(weeklyLossRate, unit);

      let warningLine = "";
      if (unit === "kg" && weeklyLossRate > 1.0) {
        warningLine = "<p><strong>Note:</strong> This pace is high. Many people cannot sustain it for long periods. Treat this as a rough upper-bound estimate.</p>";
      }
      if (unit === "lb" && weeklyLossRate > 2.0) {
        warningLine = "<p><strong>Note:</strong> This pace is high. Many people cannot sustain it for long periods. Treat this as a rough upper-bound estimate.</p>";
      }

      const resultHtml =
        `<p><strong>Estimated time:</strong> ${weeksRounded} weeks (about ${totalDays} days)</p>` +
        `<p><strong>Estimated goal date:</strong> ${formatDateYYYYMMDD(goalDate)}</p>` +
        `<p><strong>Total to lose:</strong> ${lossRounded} ${unit}</p>` +
        `<p><strong>Weekly pace used:</strong> ${weeklyRounded} ${unit}/week</p>` +
        `<p><strong>Pace label:</strong> ${paceText}</p>` +
        `<p><strong>Implied daily calorie deficit:</strong> ~${dailyDeficitRounded} kcal/day (rough planning estimate)</p>` +
        `<hr>` +
        `<p><strong>Milestones (checkpoint dates):</strong></p>` +
        `<p>25%: ${formatDateYYYYMMDD(date25)} | 50%: ${formatDateYYYYMMDD(date50)} | 75%: ${formatDateYYYYMMDD(date75)}</p>` +
        warningLine;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 6) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Weight Loss Timeline Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
