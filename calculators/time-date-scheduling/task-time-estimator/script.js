document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const effortHoursInput = document.getElementById("effortHours");
  const dailyHoursInput = document.getElementById("dailyHours");

  const startDateInput = document.getElementById("startDate");
  const workdaysPerWeekSelect = document.getElementById("workdaysPerWeek");
  const bufferPercentInput = document.getElementById("bufferPercent");
  const sessionsPerDayInput = document.getElementById("sessionsPerDay");
  const overheadMinutesInput = document.getElementById("overheadMinutes");

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
  attachLiveFormatting(effortHoursInput);
  attachLiveFormatting(dailyHoursInput);
  attachLiveFormatting(bufferPercentInput);
  attachLiveFormatting(sessionsPerDayInput);
  attachLiveFormatting(overheadMinutesInput);

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
  // Helpers (calculator-specific)
  // ------------------------------------------------------------
  function toISODateString(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + d;
  }

  function parseStartDateOrToday(value) {
    if (typeof value === "string" && value.trim() !== "") {
      const d = new Date(value + "T00:00:00");
      if (!Number.isNaN(d.getTime())) return d;
    }
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  function addDays(dateObj, days) {
    const d = new Date(dateObj.getTime());
    d.setDate(d.getDate() + days);
    return d;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      // Parse required inputs
      const effortHours = toNumber(effortHoursInput ? effortHoursInput.value : "");
      const dailyHours = toNumber(dailyHoursInput ? dailyHoursInput.value : "");

      if (!validatePositive(effortHours, "estimated effort (hours)")) return;
      if (!validatePositive(dailyHours, "daily focused time (hours per day)")) return;

      // Optional advanced inputs with defaults
      const bufferPercentRaw = toNumber(bufferPercentInput ? bufferPercentInput.value : "");
      const bufferPercent = Number.isFinite(bufferPercentRaw) ? bufferPercentRaw : 15;

      const sessionsPerDayRaw = toNumber(sessionsPerDayInput ? sessionsPerDayInput.value : "");
      const sessionsPerDay = Number.isFinite(sessionsPerDayRaw) ? sessionsPerDayRaw : 1;

      const overheadMinutesRaw = toNumber(overheadMinutesInput ? overheadMinutesInput.value : "");
      const overheadMinutes = Number.isFinite(overheadMinutesRaw) ? overheadMinutesRaw : 0;

      const workdaysPerWeekRaw = toNumber(workdaysPerWeekSelect ? workdaysPerWeekSelect.value : "");
      const workdaysPerWeek = Number.isFinite(workdaysPerWeekRaw) ? workdaysPerWeekRaw : 5;

      if (!validateNonNegative(bufferPercent, "buffer percent")) return;
      if (!validateNonNegative(sessionsPerDay, "work sessions per day")) return;
      if (!validateNonNegative(overheadMinutes, "overhead minutes per session")) return;
      if (!Number.isFinite(workdaysPerWeek) || workdaysPerWeek < 1 || workdaysPerWeek > 7) {
        setResultError("Choose a valid workdays per week value (1 to 7).");
        return;
      }

      // Calculation
      const bufferFactor = 1 + bufferPercent / 100;
      const adjustedEffortHours = effortHours * bufferFactor;

      const overheadHoursPerDay = (sessionsPerDay * overheadMinutes) / 60;
      const effectiveHoursPerWorkday = dailyHours - overheadHoursPerDay;

      if (!Number.isFinite(effectiveHoursPerWorkday) || effectiveHoursPerWorkday <= 0) {
        setResultError("Your daily focused time is fully consumed by overhead. Reduce overhead/sessions or increase daily focused time.");
        return;
      }

      const workdaysNeeded = Math.ceil(adjustedEffortHours / effectiveHoursPerWorkday);

      // Convert workdays to calendar days using an average-week approach
      const calendarDaysNeeded = Math.ceil((workdaysNeeded * 7) / workdaysPerWeek);

      const startDate = parseStartDateOrToday(startDateInput ? startDateInput.value : "");
      const finishDate = addDays(startDate, Math.max(0, calendarDaysNeeded - 1));

      // Secondary insight: add +1 hour/day sensitivity (if reasonable)
      const bumpedDailyHours = dailyHours + 1;
      const bumpedEffective = bumpedDailyHours - overheadHoursPerDay;
      let savedCalendarDaysText = "N/A";
      if (bumpedEffective > 0) {
        const bumpedWorkdays = Math.ceil(adjustedEffortHours / bumpedEffective);
        const bumpedCalendarDays = Math.ceil((bumpedWorkdays * 7) / workdaysPerWeek);
        const saved = calendarDaysNeeded - bumpedCalendarDays;
        if (Number.isFinite(saved) && saved > 0) {
          savedCalendarDaysText = String(saved);
        } else {
          savedCalendarDaysText = "0";
        }
      }

      // Build output HTML
      const resultHtml =
        `<p><strong>Estimated finish date:</strong> ${toISODateString(finishDate)}</p>` +
        `<p><strong>Workdays needed:</strong> ${workdaysNeeded}</p>` +
        `<p><strong>Calendar days (estimated):</strong> ${calendarDaysNeeded}</p>` +
        `<p><strong>Adjusted effort (with buffer):</strong> ${formatNumberTwoDecimals(adjustedEffortHours)} hours</p>` +
        `<p><strong>Effective hours per workday:</strong> ${formatNumberTwoDecimals(effectiveHoursPerWorkday)} hours/day</p>` +
        `<p><strong>Quick insight:</strong> Adding 1 extra focused hour per day changes the timeline by about <strong>${savedCalendarDaysText}</strong> calendar day(s).</p>`;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Task Time Estimator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
