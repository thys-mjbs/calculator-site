document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const ageYearsInput = document.getElementById("ageYears");
  const wakeTimeInput = document.getElementById("wakeTime");
  const activityLevelSelect = document.getElementById("activityLevel");
  const sleepDebtHoursInput = document.getElementById("sleepDebtHours");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Sleep debt can be typed as decimals; commas are still fine for large values.
  attachLiveFormatting(sleepDebtHoursInput);

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
  function parseTimeToMinutes(value) {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    const match = /^(\d{1,2}):(\d{2})$/.exec(trimmed);
    if (!match) return null;

    const hh = Number(match[1]);
    const mm = Number(match[2]);

    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
    if (hh < 0 || hh > 23) return null;
    if (mm < 0 || mm > 59) return null;

    return hh * 60 + mm;
  }

  function minutesToTimeString(mins) {
    let m = mins % (24 * 60);
    if (m < 0) m += 24 * 60;
    const hh = Math.floor(m / 60);
    const mm = m % 60;
    const hhStr = String(hh).padStart(2, "0");
    const mmStr = String(mm).padStart(2, "0");
    return hhStr + ":" + mmStr;
  }

  function getAgeBasedRange(ageYears) {
    // Returns { min, max, label }
    // Ranges are intentionally simple and aligned to common public guidance.
    if (ageYears < 0) return null;

    if (ageYears < 1) return { min: 12, max: 15, label: "Infant (0–11 months)" };
    if (ageYears < 3) return { min: 11, max: 14, label: "Toddler (1–2 years)" };
    if (ageYears < 6) return { min: 10, max: 13, label: "Preschool (3–5 years)" };
    if (ageYears < 14) return { min: 9, max: 11, label: "School-age (6–13 years)" };
    if (ageYears < 18) return { min: 8, max: 10, label: "Teen (14–17 years)" };
    if (ageYears < 65) return { min: 7, max: 9, label: "Adult (18–64 years)" };
    return { min: 7, max: 8, label: "Older adult (65+ years)" };
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const ageYears = toNumber(ageYearsInput ? ageYearsInput.value : "");
      const wakeTimeRaw = wakeTimeInput ? wakeTimeInput.value : "";
      const wakeMinutes = parseTimeToMinutes(wakeTimeRaw);

      const activityLevel = activityLevelSelect ? activityLevelSelect.value : "typical";
      const sleepDebtHours = toNumber(sleepDebtHoursInput ? sleepDebtHoursInput.value : "");

      // Basic existence guard
      if (!ageYearsInput || !wakeTimeInput) return;

      // Validation
      if (!validatePositive(ageYears, "age")) return;
      if (ageYears > 120) {
        setResultError("Enter a realistic age (120 years or less).");
        return;
      }
      if (wakeMinutes === null) {
        setResultError("Enter a valid wake-up time in 24-hour format (HH:MM), for example 06:30.");
        return;
      }
      if (!validateNonNegative(sleepDebtHours, "sleep debt")) return;
      if (sleepDebtHours > 48) {
        setResultError("Enter a realistic sleep debt. If you are severely sleep deprived, consider professional advice.");
        return;
      }

      const baseRange = getAgeBasedRange(ageYears);
      if (!baseRange) {
        setResultError("Enter a valid age.");
        return;
      }

      // Activity adjustment (small, conservative)
      let activityAdj = 0;
      if (activityLevel === "active") activityAdj = 0.5;
      if (activityLevel === "very_active") activityAdj = 1.0;

      // Sleep debt catch-up rule: suggest recovering about one-third tonight, capped
      const catchUp = clamp(sleepDebtHours * 0.33, 0, 2);

      const baseMid = (baseRange.min + baseRange.max) / 2;
      const targetHoursRaw = baseMid + activityAdj + catchUp;

      // For display, keep the range but extend it by catch-up (since it is an add-on, not a new baseline)
      const displayMin = baseRange.min + catchUp + (activityAdj > 0 ? 0 : 0);
      const displayMax = baseRange.max + catchUp + activityAdj;

      // Final target should sit inside a sensible window:
      // min = base min + catchUp (activity does not reduce minimum)
      // max = base max + catchUp + activityAdj
      const targetHours = clamp(targetHoursRaw, baseRange.min + catchUp, baseRange.max + catchUp + activityAdj);

      // Bedtime calculations
      const latestBedtime = wakeMinutes - Math.round((baseRange.min + catchUp) * 60);
      const earliestBedtime = wakeMinutes - Math.round((baseRange.max + catchUp + activityAdj) * 60);
      const targetBedtime = wakeMinutes - Math.round(targetHours * 60);

      const baseMinStr = formatNumberTwoDecimals(baseRange.min);
      const baseMaxStr = formatNumberTwoDecimals(baseRange.max);
      const catchUpStr = formatNumberTwoDecimals(catchUp);
      const activityAdjStr = formatNumberTwoDecimals(activityAdj);
      const targetHoursStr = formatNumberTwoDecimals(targetHours);

      const earliestStr = minutesToTimeString(earliestBedtime);
      const latestStr = minutesToTimeString(latestBedtime);
      const targetStr = minutesToTimeString(targetBedtime);

      const rangeTonightMin = baseRange.min + catchUp;
      const rangeTonightMax = baseRange.max + catchUp + activityAdj;

      const rangeTonightMinStr = formatNumberTwoDecimals(rangeTonightMin);
      const rangeTonightMaxStr = formatNumberTwoDecimals(rangeTonightMax);

      const assumptions = [];
      assumptions.push("Age band used: " + baseRange.label + " (" + baseMinStr + " to " + baseMaxStr + " hours baseline).");
      if (activityAdj > 0) assumptions.push("Activity adjustment applied: +" + activityAdjStr + " hours.");
      if (catchUp > 0) assumptions.push("Sleep debt catch-up suggested for tonight: +" + catchUpStr + " hours (capped).");
      if (activityAdj === 0 && catchUp === 0) assumptions.push("No optional adjustments applied (age-based baseline only).");

      const assumptionsHtml = assumptions.map(function (a) {
        return "<li>" + a + "</li>";
      }).join("");

      const resultHtml =
        `<p><strong>Recommended sleep tonight:</strong> ${rangeTonightMinStr} to ${rangeTonightMaxStr} hours</p>` +
        `<p><strong>Practical target for tonight:</strong> ${targetHoursStr} hours</p>` +
        `<p><strong>Bedtime window (for a ${minutesToTimeString(wakeMinutes)} wake-up):</strong><br>` +
        `Earliest bedtime (max sleep): <strong>${earliestStr}</strong><br>` +
        `Target bedtime: <strong>${targetStr}</strong><br>` +
        `Latest bedtime (min sleep): <strong>${latestStr}</strong></p>` +
        `<p><strong>What this means:</strong> Aim for the target bedtime if you can. If you go to bed later than the latest bedtime, you will likely undershoot the minimum recommended sleep for your age band tonight.</p>` +
        `<p><strong>Assumptions used:</strong></p>` +
        `<ul>${assumptionsHtml}</ul>`;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Sleep Need Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
