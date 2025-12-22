document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const startDateInput = document.getElementById("startDate");
  const workdaysInput = document.getElementById("workdays");
  const directionSelect = document.getElementById("direction");

  const showAdvanced = document.getElementById("showAdvanced");
  const advancedSection = document.getElementById("advancedSection");
  const includeStartDay = document.getElementById("includeStartDay");
  const excludeHolidays = document.getElementById("excludeHolidays");
  const holidayDates = document.getElementById("holidayDates");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (Not used in this calculator)

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
  attachLiveFormatting(workdaysInput);

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
  // Calculator-specific helpers
  // ------------------------------------------------------------
  function parseISODate(iso) {
    if (typeof iso !== "string") return null;
    const trimmed = iso.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;

    const d = new Date(trimmed + "T00:00:00");
    if (!Number.isFinite(d.getTime())) return null;

    const parts = trimmed.split("-");
    const y = Number(parts[0]);
    const m = Number(parts[1]);
    const day = Number(parts[2]);

    if (d.getFullYear() !== y || d.getMonth() + 1 !== m || d.getDate() !== day) return null;
    return d;
  }

  function toISODate(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + d;
  }

  function isWeekend(dateObj) {
    const day = dateObj.getDay(); // 0 Sun ... 6 Sat
    return day === 0 || day === 6;
  }

  function parseHolidaySet(text) {
    const set = new Set();
    if (!text || typeof text !== "string") return set;

    const parts = text
      .split(",")
      .map(function (s) { return s.trim(); })
      .filter(function (s) { return s.length > 0; });

    for (let i = 0; i < parts.length; i++) {
      const d = parseISODate(parts[i]);
      if (d) set.add(toISODate(d));
    }

    return set;
  }

  function addDays(dateObj, deltaDays) {
    const d = new Date(dateObj.getTime());
    d.setDate(d.getDate() + deltaDays);
    return d;
  }

  function addWorkdays(startDate, workdays, direction, countStartIfWorkday, holidaySet) {
    const step = direction === "backward" ? -1 : 1;

    let current = new Date(startDate.getTime());
    let remaining = workdays;

    let weekendSkipped = 0;
    let holidaySkipped = 0;
    let calendarDaysMoved = 0;

    function isHoliday(d) {
      if (!holidaySet || holidaySet.size === 0) return false;
      return holidaySet.has(toISODate(d));
    }

    // Optionally count the start date as day 1, but only if it is a workday.
    if (countStartIfWorkday) {
      if (!isWeekend(current) && !isHoliday(current)) {
        remaining = remaining - 1;
      }
    }

    while (remaining > 0) {
      current = addDays(current, step);
      calendarDaysMoved += 1;

      if (isWeekend(current)) {
        weekendSkipped += 1;
        continue;
      }

      if (isHoliday(current)) {
        holidaySkipped += 1;
        continue;
      }

      remaining -= 1;
    }

    return {
      targetDate: current,
      weekendSkipped: weekendSkipped,
      holidaySkipped: holidaySkipped,
      calendarDaysMoved: calendarDaysMoved
    };
  }

  // ------------------------------------------------------------
  // Advanced toggle behavior
  // ------------------------------------------------------------
  function setAdvancedVisibility(isVisible) {
    if (!advancedSection) return;
    if (isVisible) {
      advancedSection.classList.remove("hidden");
      advancedSection.setAttribute("aria-hidden", "false");
    } else {
      advancedSection.classList.add("hidden");
      advancedSection.setAttribute("aria-hidden", "true");
    }
  }

  if (showAdvanced) {
    setAdvancedVisibility(showAdvanced.checked);
    showAdvanced.addEventListener("change", function () {
      setAdvancedVisibility(showAdvanced.checked);
      clearResult();
    });
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      if (!startDateInput || !workdaysInput || !directionSelect) return;

      const startDate = parseISODate(startDateInput.value);
      if (!startDate) {
        setResultError("Enter a valid start date in YYYY-MM-DD format.");
        return;
      }

      const workdaysRaw = toNumber(workdaysInput.value);
      const workdaysRounded = Math.floor(workdaysRaw);

      if (!validatePositive(workdaysRounded, "number of workdays")) return;

      // Guard against unrealistic values that can hang the browser
      if (workdaysRounded > 50000) {
        setResultError("Enter a smaller number of workdays (50,000 or less).");
        return;
      }

      const direction = directionSelect.value === "backward" ? "backward" : "forward";
      const countStart = includeStartDay ? !!includeStartDay.checked : false;

      const useHolidays = excludeHolidays ? !!excludeHolidays.checked : false;
      const holidaySet = useHolidays ? parseHolidaySet(holidayDates ? holidayDates.value : "") : new Set();

      const workdayResult = addWorkdays(startDate, workdaysRounded, direction, countStart, holidaySet);

      const targetIso = toISODate(workdayResult.targetDate);

      // Secondary comparison: what a naive calendar-day move would produce
      const naiveTarget = addDays(startDate, (direction === "backward" ? -1 : 1) * workdaysRounded);
      const naiveIso = toISODate(naiveTarget);

      const skippedTotal = workdayResult.weekendSkipped + workdayResult.holidaySkipped;
      const approxWeeks = workdayResult.calendarDaysMoved / 7;

      const resultHtml =
        `<p><strong>Target date:</strong> ${targetIso}</p>` +
        `<p><strong>Workdays counted:</strong> ${workdaysRounded}</p>` +
        `<p><strong>Calendar days moved:</strong> ${workdayResult.calendarDaysMoved} (about ${formatNumberTwoDecimals(approxWeeks)} weeks)</p>` +
        `<p><strong>Days skipped:</strong> ${skippedTotal} (weekends: ${workdayResult.weekendSkipped}, holidays: ${workdayResult.holidaySkipped})</p>` +
        `<p><strong>Calendar-day comparison:</strong> If you moved ${workdaysRounded} calendar days, you would land on ${naiveIso}.</p>`;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Workday Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
