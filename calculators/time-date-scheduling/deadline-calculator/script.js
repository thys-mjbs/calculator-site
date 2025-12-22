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
  const startTimeInput = document.getElementById("startTime");
  const durationValueInput = document.getElementById("durationValue");
  const durationUnitSelect = document.getElementById("durationUnit");
  const excludeWeekendsCheckbox = document.getElementById("excludeWeekends");
  const workdayStartInput = document.getElementById("workdayStart");
  const workdayEndInput = document.getElementById("workdayEnd");
  const holidayDatesInput = document.getElementById("holidayDates");

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
  attachLiveFormatting(durationValueInput);

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
  // 6) CALCULATOR HELPERS (LOCAL)
  // ------------------------------------------------------------
  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function toDateKey(dateObj) {
    const y = dateObj.getFullYear();
    const m = pad2(dateObj.getMonth() + 1);
    const d = pad2(dateObj.getDate());
    return y + "-" + m + "-" + d;
  }

  function parseDateYYYYMMDD(s) {
    const raw = (s || "").trim();
    if (!raw) return null;
    const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    const dt = new Date(y, mo - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
    dt.setHours(0, 0, 0, 0);
    return dt;
  }

  function parseTimeHHMM(s) {
    const raw = (s || "").trim();
    if (!raw) return null;
    const m = raw.match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return null;
    const hh = Number(m[1]);
    const mm = Number(m[2]);
    if (!Number.isInteger(hh) || !Number.isInteger(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
    return { hh: hh, mm: mm };
  }

  function formatDateTimeLocal(dateObj) {
    const y = dateObj.getFullYear();
    const mo = pad2(dateObj.getMonth() + 1);
    const d = pad2(dateObj.getDate());
    const hh = pad2(dateObj.getHours());
    const mm = pad2(dateObj.getMinutes());
    return y + "-" + mo + "-" + d + " " + hh + ":" + mm;
  }

  function isWeekend(dateObj) {
    const day = dateObj.getDay();
    return day === 0 || day === 6;
  }

  function buildHolidaySet(listString) {
    const set = new Set();
    const raw = (listString || "").trim();
    if (!raw) return set;

    raw.split(",").forEach(function (part) {
      const s = part.trim();
      if (!s) return;
      const dt = parseDateYYYYMMDD(s);
      if (!dt) return;
      set.add(toDateKey(dt));
    });

    return set;
  }

  function isNonWorkingDay(dateObj, excludeWeekends, holidaySet) {
    if (excludeWeekends && isWeekend(dateObj)) return true;
    if (holidaySet && holidaySet.has(toDateKey(dateObj))) return true;
    return false;
  }

  function nextWorkingDay(dateObj, excludeWeekends, holidaySet) {
    const d = new Date(dateObj.getTime());
    d.setHours(0, 0, 0, 0);
    while (isNonWorkingDay(d, excludeWeekends, holidaySet)) {
      d.setDate(d.getDate() + 1);
    }
    return d;
  }

  function clampToWorkWindow(dt, workStartMinutes, workEndMinutes, excludeWeekends, holidaySet) {
    let cur = new Date(dt.getTime());

    while (true) {
      const dayStart = new Date(cur.getTime());
      dayStart.setHours(0, 0, 0, 0);

      if (isNonWorkingDay(dayStart, excludeWeekends, holidaySet)) {
        const next = new Date(dayStart.getTime());
        next.setDate(next.getDate() + 1);
        cur = nextWorkingDay(next, excludeWeekends, holidaySet);
        cur.setHours(0, 0, 0, 0);
        cur.setMinutes(workStartMinutes);
        cur.setSeconds(0, 0);
        continue;
      }

      const minutesNow = cur.getHours() * 60 + cur.getMinutes();

      if (minutesNow < workStartMinutes) {
        cur.setHours(0, 0, 0, 0);
        cur.setMinutes(workStartMinutes);
        cur.setSeconds(0, 0);
        return cur;
      }

      if (minutesNow >= workEndMinutes) {
        const next = new Date(dayStart.getTime());
        next.setDate(next.getDate() + 1);
        const nextWork = nextWorkingDay(next, excludeWeekends, holidaySet);
        nextWork.setHours(0, 0, 0, 0);
        nextWork.setMinutes(workStartMinutes);
        nextWork.setSeconds(0, 0);
        return nextWork;
      }

      return cur;
    }
  }

  function addBusinessDays(startDt, daysToAdd, excludeWeekends, holidaySet) {
    let cur = new Date(startDt.getTime());

    const dayOnly = new Date(cur.getTime());
    dayOnly.setHours(0, 0, 0, 0);

    if (isNonWorkingDay(dayOnly, excludeWeekends, holidaySet)) {
      const next = nextWorkingDay(dayOnly, excludeWeekends, holidaySet);
      next.setHours(cur.getHours(), cur.getMinutes(), 0, 0);
      cur = next;
    }

    let remaining = daysToAdd;
    while (remaining > 0) {
      cur.setDate(cur.getDate() + 1);

      const check = new Date(cur.getTime());
      check.setHours(0, 0, 0, 0);

      if (isNonWorkingDay(check, excludeWeekends, holidaySet)) {
        continue;
      }

      remaining -= 1;
    }

    return cur;
  }

  function addBusinessHours(startDt, hoursToAdd, workStartMinutes, workEndMinutes, excludeWeekends, holidaySet) {
    const minutesPerDay = workEndMinutes - workStartMinutes;
    let remainingMinutes = Math.round(hoursToAdd * 60);

    if (minutesPerDay <= 0) return null;

    let cur = clampToWorkWindow(startDt, workStartMinutes, workEndMinutes, excludeWeekends, holidaySet);

    while (remainingMinutes > 0) {
      const minutesNow = cur.getHours() * 60 + cur.getMinutes();
      const availableToday = workEndMinutes - minutesNow;

      if (availableToday <= 0) {
        cur = clampToWorkWindow(cur, workStartMinutes, workEndMinutes, excludeWeekends, holidaySet);
        continue;
      }

      const consume = Math.min(remainingMinutes, availableToday);
      cur = new Date(cur.getTime() + consume * 60000);
      remainingMinutes -= consume;

      if (remainingMinutes > 0) {
        const dayOnly = new Date(cur.getTime());
        dayOnly.setHours(0, 0, 0, 0);
        dayOnly.setDate(dayOnly.getDate() + 1);

        const nextWork = nextWorkingDay(dayOnly, excludeWeekends, holidaySet);
        nextWork.setHours(0, 0, 0, 0);
        nextWork.setMinutes(workStartMinutes);
        nextWork.setSeconds(0, 0);
        cur = nextWork;
      }
    }

    return cur;
  }

  // Prefill reasonable defaults to reduce friction
  (function prefillDefaults() {
    const now = new Date();

    if (startDateInput && !String(startDateInput.value || "").trim()) {
      startDateInput.value = toDateKey(now);
    }

    if (startTimeInput && !String(startTimeInput.value || "").trim()) {
      startTimeInput.value = pad2(now.getHours()) + ":" + pad2(now.getMinutes());
    }

    if (workdayStartInput && !String(workdayStartInput.value || "").trim()) {
      workdayStartInput.value = "09:00";
    }

    if (workdayEndInput && !String(workdayEndInput.value || "").trim()) {
      workdayEndInput.value = "17:00";
    }
  })();

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse duration using toNumber() (from /scripts/main.js)
      const durationValue = toNumber(durationValueInput ? durationValueInput.value : "");
      const unit = durationUnitSelect ? String(durationUnitSelect.value || "businessDays") : "businessDays";
      const excludeWeekends = excludeWeekendsCheckbox ? !!excludeWeekendsCheckbox.checked : true;

      // Parse start date/time (strings)
      const startDate = parseDateYYYYMMDD(startDateInput ? startDateInput.value : "");
      if (!startDate) {
        setResultError("Enter a valid start date in the format YYYY-MM-DD.");
        return;
      }

      const startTime = parseTimeHHMM(startTimeInput ? startTimeInput.value : "");
      if (!startTime) {
        setResultError("Enter a valid start time in the format HH:MM (24-hour).");
        return;
      }

      if (!validatePositive(durationValue, "duration")) return;

      // Holidays
      const holidaySet = buildHolidaySet(holidayDatesInput ? holidayDatesInput.value : "");

      // Workday window
      const workStart = parseTimeHHMM(workdayStartInput ? workdayStartInput.value : "");
      const workEnd = parseTimeHHMM(workdayEndInput ? workdayEndInput.value : "");
      if (!workStart || !workEnd) {
        setResultError("Enter valid working hours in the format HH:MM (24-hour).");
        return;
      }

      const workStartMinutes = workStart.hh * 60 + workStart.mm;
      const workEndMinutes = workEnd.hh * 60 + workEnd.mm;

      if (workEndMinutes <= workStartMinutes) {
        setResultError("Workday end time must be later than the workday start time.");
        return;
      }

      // Build the start datetime
      const startDt = new Date(startDate.getTime());
      startDt.setHours(startTime.hh, startTime.mm, 0, 0);

      // Calculate deadline
      let deadline = null;

      if (unit === "businessDays") {
        const wholeDays = Math.floor(durationValue);
        const hasFraction = Math.abs(durationValue - wholeDays) > 1e-9;

        if (hasFraction) {
          setResultError("Business days must be a whole number. Use business hours for fractional time.");
          return;
        }

        deadline = addBusinessDays(startDt, wholeDays, excludeWeekends, holidaySet);
      } else {
        deadline = addBusinessHours(startDt, durationValue, workStartMinutes, workEndMinutes, excludeWeekends, holidaySet);
      }

      if (!deadline) {
        setResultError("Unable to compute a deadline with the current inputs.");
        return;
      }

      // Supporting figures
      const msDiff = deadline.getTime() - startDt.getTime();
      const hoursTotal = msDiff / 3600000;
      const daysCalendar = msDiff / 86400000;

      const startDayOnly = new Date(startDt.getTime());
      startDayOnly.setHours(0, 0, 0, 0);
      const startAdjustedDayOnly = nextWorkingDay(startDayOnly, excludeWeekends, holidaySet);

      const startWasShifted =
        startAdjustedDayOnly.getTime() !== startDayOnly.getTime() &&
        unit === "businessDays";

      const htmlParts = [];

      htmlParts.push(
        `<div class="result-row"><strong>Deadline:</strong> ${formatDateTimeLocal(deadline)}</div>`
      );

      htmlParts.push(
        `<div class="result-row"><strong>Duration added:</strong> ${String(durationValueInput ? durationValueInput.value : durationValue)} ${unit === "businessDays" ? "business day(s)" : "business hour(s)"}</div>`
      );

      htmlParts.push(
        `<div class="result-row"><strong>Calendar time elapsed:</strong> ${formatNumberTwoDecimals(hoursTotal)} hours (${formatNumberTwoDecimals(daysCalendar)} days)</div>`
      );

      if (unit === "businessHours") {
        htmlParts.push(
          `<div class="result-row"><strong>Working window used:</strong> ${pad2(workStart.hh)}:${pad2(workStart.mm)} to ${pad2(workEnd.hh)}:${pad2(workEnd.mm)}</div>`
        );
      }

      if (excludeWeekends) {
        htmlParts.push(
          `<div class="result-row"><strong>Weekends:</strong> Excluded</div>`
        );
      } else {
        htmlParts.push(
          `<div class="result-row"><strong>Weekends:</strong> Included</div>`
        );
      }

      if (holidaySet.size > 0) {
        htmlParts.push(
          `<div class="result-row"><strong>Holidays skipped:</strong> ${holidaySet.size}</div>`
        );
      } else {
        htmlParts.push(
          `<div class="result-row"><strong>Holidays skipped:</strong> None</div>`
        );
      }

      if (startWasShifted) {
        htmlParts.push(
          `<div class="result-row"><strong>Note:</strong> Your start date lands on a non-working day, so counting begins on the next working day.</div>`
        );
      }

      const resultHtml = htmlParts.join("");
      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Deadline Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
