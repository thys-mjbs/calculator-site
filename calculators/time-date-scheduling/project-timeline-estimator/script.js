document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS
  // ------------------------------------------------------------

  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  const startDateInput = document.getElementById("startDate");
  const effortHoursInput = document.getElementById("effortHours");
  const peopleCountInput = document.getElementById("peopleCount");
  const hoursPerDayInput = document.getElementById("hoursPerDay");
  const workdaysPerWeekInput = document.getElementById("workdaysPerWeek");
  const bufferPercentInput = document.getElementById("bufferPercent");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(effortHoursInput);
  attachLiveFormatting(peopleCountInput);
  attachLiveFormatting(hoursPerDayInput);
  attachLiveFormatting(workdaysPerWeekInput);
  attachLiveFormatting(bufferPercentInput);

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
  // 4) VALIDATION HELPERS
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

  function parseISODate(input) {
    if (!input) return null;
    const trimmed = String(input).trim();
    const m = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;

    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);

    if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
    if (mo < 1 || mo > 12) return null;
    if (d < 1 || d > 31) return null;

    const dt = new Date(y, mo - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
    dt.setHours(12, 0, 0, 0);
    return dt;
  }

  function formatDateYYYYMMDD(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + d;
  }

  function isWorkday(dateObj, workdaysPerWeek) {
    const wd = Number(workdaysPerWeek);
    if (wd >= 7) return true;
    if (wd <= 0) return false;

    // Monday = 0 ... Sunday = 6
    const mondayIndex = (dateObj.getDay() + 6) % 7;
    return mondayIndex < wd;
  }

  function nextDay(dateObj) {
    const d = new Date(dateObj.getTime());
    d.setDate(d.getDate() + 1);
    d.setHours(12, 0, 0, 0);
    return d;
  }

  function addWorkdays(startDate, workdaysToAdd, workdaysPerWeek) {
    let d = new Date(startDate.getTime());
    d.setHours(12, 0, 0, 0);

    // If start date is not a workday, roll forward to first workday
    while (!isWorkday(d, workdaysPerWeek)) {
      d = nextDay(d);
    }

    if (workdaysToAdd <= 1) return d;

    let remaining = workdaysToAdd - 1; // start day counts as day 1
    while (remaining > 0) {
      d = nextDay(d);
      if (isWorkday(d, workdaysPerWeek)) {
        remaining -= 1;
      }
    }
    return d;
  }

  // ------------------------------------------------------------
  // 5) MAIN CALCULATE HANDLER
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      if (!startDateInput || !effortHoursInput) return;

      const startDate = parseISODate(startDateInput.value);
      if (!startDate) {
        setResultError("Enter a valid start date in YYYY-MM-DD format (for example 2025-12-22).");
        return;
      }

      const effortHours = toNumber(effortHoursInput.value);
      if (!validatePositive(effortHours, "estimated total effort (hours)")) return;

      const peopleCountRaw = peopleCountInput ? toNumber(peopleCountInput.value) : NaN;
      const hoursPerDayRaw = hoursPerDayInput ? toNumber(hoursPerDayInput.value) : NaN;
      const workdaysPerWeekRaw = workdaysPerWeekInput ? toNumber(workdaysPerWeekInput.value) : NaN;
      const bufferPercentRaw = bufferPercentInput ? toNumber(bufferPercentInput.value) : NaN;

      const peopleCount = Number.isFinite(peopleCountRaw) && peopleCountRaw > 0 ? peopleCountRaw : 1;
      const hoursPerDay = Number.isFinite(hoursPerDayRaw) && hoursPerDayRaw > 0 ? hoursPerDayRaw : 6;
      const workdaysPerWeek = Number.isFinite(workdaysPerWeekRaw) && workdaysPerWeekRaw >= 1 ? workdaysPerWeekRaw : 5;
      const bufferPercent = Number.isFinite(bufferPercentRaw) && bufferPercentRaw >= 0 ? bufferPercentRaw : 15;

      if (workdaysPerWeek < 1 || workdaysPerWeek > 7) {
        setResultError("Working days per week must be between 1 and 7.");
        return;
      }

      // Capacity and timeline math
      const capacityHoursPerWorkday = peopleCount * hoursPerDay;
      if (!validatePositive(capacityHoursPerWorkday, "daily capacity")) return;

      const totalHoursWithBuffer = effortHours * (1 + bufferPercent / 100);
      if (!validatePositive(totalHoursWithBuffer, "buffered effort")) return;

      const rawWorkdaysNeeded = totalHoursWithBuffer / capacityHoursPerWorkday;
      const workdaysNeeded = Math.ceil(rawWorkdaysNeeded * 100) / 100; // display-friendly
      const workdaysNeededForDate = Math.max(1, Math.ceil(rawWorkdaysNeeded));

      const endDate = addWorkdays(startDate, workdaysNeededForDate, workdaysPerWeek);

      const msPerDay = 24 * 60 * 60 * 1000;
      const calendarDaysSpan = Math.round((endDate.getTime() - startDate.getTime()) / msPerDay) + 1;

      const startStr = formatDateYYYYMMDD(startDate);
      const endStr = formatDateYYYYMMDD(endDate);

      const resultHtml =
        `<p><strong>Estimated finish date:</strong> ${endStr}</p>` +
        `<p><strong>Calendar span:</strong> ${formatInputWithCommas(String(calendarDaysSpan))} day(s) (from ${startStr})</p>` +
        `<p><strong>Workdays required:</strong> ${formatInputWithCommas(String(workdaysNeededForDate))} day(s)</p>` +
        `<hr>` +
        `<p><strong>Buffered effort:</strong> ${formatNumberTwoDecimals(totalHoursWithBuffer)} hours (includes ${formatNumberTwoDecimals(bufferPercent)}% buffer)</p>` +
        `<p><strong>Daily capacity:</strong> ${formatNumberTwoDecimals(capacityHoursPerWorkday)} hours per workday</p>` +
        `<p><strong>Implied workdays (unrounded):</strong> ${formatNumberTwoDecimals(workdaysNeeded)} day(s)</p>`;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 6) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Project Timeline Estimator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
