document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const lastPeriodStartInput = document.getElementById("lastPeriodStart");
  const cycleLengthDaysInput = document.getElementById("cycleLengthDays");
  const periodLengthDaysInput = document.getElementById("periodLengthDays");
  const lutealLengthDaysInput = document.getElementById("lutealLengthDays");

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
  attachLiveFormatting(cycleLengthDaysInput);
  attachLiveFormatting(periodLengthDaysInput);
  attachLiveFormatting(lutealLengthDaysInput);

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

  function parseIsoDateStrict(value) {
    const raw = String(value || "").trim();
    const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
    if (month < 1 || month > 12) return null;
    if (day < 1 || day > 31) return null;

    const d = new Date(Date.UTC(year, month - 1, day));
    if (Number.isNaN(d.getTime())) return null;

    // Ensure the date did not overflow (e.g., 2025-02-31)
    if (d.getUTCFullYear() !== year || d.getUTCMonth() !== (month - 1) || d.getUTCDate() !== day) return null;

    return d;
  }

  function addDaysUtc(dateObj, days) {
    const ms = dateObj.getTime();
    const out = new Date(ms + days * 24 * 60 * 60 * 1000);
    return out;
  }

  function formatIsoDate(dateObj) {
    const y = dateObj.getUTCFullYear();
    const m = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getUTCDate()).padStart(2, "0");
    return y + "-" + m + "-" + d;
  }

  function daysBetweenUtc(startDate, endDate) {
    const ms = endDate.getTime() - startDate.getTime();
    return Math.floor(ms / (24 * 60 * 60 * 1000));
  }

  function safeInt(value) {
    if (!Number.isFinite(value)) return NaN;
    return Math.round(value);
  }

  // ------------------------------------------------------------
  // 5) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const cycleLengthRaw = toNumber(cycleLengthDaysInput ? cycleLengthDaysInput.value : "");
      const periodLengthRaw = toNumber(periodLengthDaysInput ? periodLengthDaysInput.value : "");
      const lutealLengthRaw = toNumber(lutealLengthDaysInput ? lutealLengthDaysInput.value : "");

      if (!lastPeriodStartInput || !cycleLengthDaysInput || !periodLengthDaysInput) return;

      const lastStart = parseIsoDateStrict(lastPeriodStartInput.value);
      if (!lastStart) {
        setResultError("Enter the first day of your last period in the format YYYY-MM-DD (for example, 2025-12-01).");
        return;
      }

      const cycleLength = safeInt(cycleLengthRaw);
      const periodLength = safeInt(periodLengthRaw);

      if (!validatePositive(cycleLength, "average cycle length (days)")) return;
      if (!validatePositive(periodLength, "average period length (days)")) return;

      if (cycleLength < 15 || cycleLength > 60) {
        setResultError("Average cycle length usually falls between 15 and 60 days. Enter a value in that range.");
        return;
      }

      if (periodLength < 1 || periodLength > 14) {
        setResultError("Period length is usually between 1 and 14 days. Enter a value in that range.");
        return;
      }

      let lutealLength = 14;
      if (Number.isFinite(lutealLengthRaw) && lutealLengthRaw !== 0) {
        lutealLength = safeInt(lutealLengthRaw);
      }

      if (!Number.isFinite(lutealLength) || lutealLength < 8 || lutealLength > 20) {
        setResultError("Luteal phase length is typically between 8 and 20 days. Leave it blank to use the default (14).");
        return;
      }

      // Calculation logic
      const nextPeriodStart = addDaysUtc(lastStart, cycleLength);
      const nextPeriodEnd = addDaysUtc(nextPeriodStart, Math.max(0, periodLength - 1));

      const ovulationEstimate = addDaysUtc(nextPeriodStart, -lutealLength);
      const fertileStart = addDaysUtc(ovulationEstimate, -5);
      const fertileEnd = addDaysUtc(ovulationEstimate, 1);

      // Extra planning: upcoming predicted period starts
      const next2 = addDaysUtc(nextPeriodStart, cycleLength);
      const next3 = addDaysUtc(next2, cycleLength);

      // Current cycle day insight (best-effort)
      const nowUtc = new Date();
      const todayUtc = new Date(Date.UTC(nowUtc.getUTCFullYear(), nowUtc.getUTCMonth(), nowUtc.getUTCDate()));
      const dayCount = daysBetweenUtc(lastStart, todayUtc) + 1;

      let cycleDayLine = "";
      if (dayCount >= 1 && dayCount <= cycleLength) {
        cycleDayLine = "<p><strong>Today is:</strong> Cycle day " + dayCount + " of " + cycleLength + " (based on the last period start date you entered).</p>";
      } else if (dayCount > cycleLength) {
        cycleDayLine = "<p><strong>Note:</strong> The last period start date you entered is more than one full cycle ago. Your next-period estimate may be off if you missed a more recent start date.</p>";
      } else {
        cycleDayLine = "<p><strong>Note:</strong> The date you entered is in the future compared to today. Double-check the last period start date.</p>";
      }

      // Build output HTML
      const resultHtml =
        "<p><strong>Estimated next period start:</strong> " + formatIsoDate(nextPeriodStart) + "</p>" +
        "<p><strong>Estimated next period end:</strong> " + formatIsoDate(nextPeriodEnd) + "</p>" +
        "<p><strong>Estimated ovulation date:</strong> " + formatIsoDate(ovulationEstimate) + " (based on luteal phase length " + lutealLength + " days)</p>" +
        "<p><strong>Estimated fertile window:</strong> " + formatIsoDate(fertileStart) + " to " + formatIsoDate(fertileEnd) + "</p>" +
        cycleDayLine +
        "<p><strong>Upcoming predicted period starts:</strong></p>" +
        "<ul>" +
        "<li>" + formatIsoDate(nextPeriodStart) + "</li>" +
        "<li>" + formatIsoDate(next2) + "</li>" +
        "<li>" + formatIsoDate(next3) + "</li>" +
        "</ul>" +
        "<p><strong>Assumptions used:</strong> Cycle length " + cycleLength + " days, period length " + periodLength + " days, luteal phase length " + lutealLength + " days.</p>";

      // Output
      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 6) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Menstrual Cycle Tracker (Simple Calculator Version) - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
