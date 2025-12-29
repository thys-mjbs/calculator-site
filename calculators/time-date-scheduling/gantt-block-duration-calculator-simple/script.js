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
  const endDateInput = document.getElementById("endDate");
  const endTimeInput = document.getElementById("endTime");

  const useWorkingTimeInput = document.getElementById("useWorkingTime");
  const advancedBlock = document.getElementById("advancedBlock");

  const workdayStartInput = document.getElementById("workdayStart");
  const workdayEndInput = document.getElementById("workdayEnd");
  const includeWeekendsInput = document.getElementById("includeWeekends");
  const hoursPerDayInput = document.getElementById("hoursPerDay");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // No comma-formatting needed for date/time text inputs.

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
    // Not used in this calculator.
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
  function parseDateYMD(text) {
    const s = (text || "").trim();
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;

    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);

    if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
    if (mo < 1 || mo > 12) return null;
    if (d < 1 || d > 31) return null;

    const dt = new Date(y, mo - 1, d, 0, 0, 0, 0);
    if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
    return dt;
  }

  function parseTimeHM(text) {
    const s = (text || "").trim();
    const m = s.match(/^(\d{2}):(\d{2})$/);
    if (!m) return null;

    const hh = Number(m[1]);
    const mm = Number(m[2]);

    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
    if (hh < 0 || hh > 23) return null;
    if (mm < 0 || mm > 59) return null;

    return { hh: hh, mm: mm };
  }

  function combineDateTime(dateObj, timeObj) {
    const dt = new Date(
      dateObj.getFullYear(),
      dateObj.getMonth(),
      dateObj.getDate(),
      timeObj.hh,
      timeObj.mm,
      0,
      0
    );
    return dt;
  }

  function minutesToBreakdown(totalMinutes) {
    const mins = Math.max(0, Math.floor(totalMinutes));
    const days = Math.floor(mins / (24 * 60));
    const rem1 = mins - days * 24 * 60;
    const hours = Math.floor(rem1 / 60);
    const minutes = rem1 - hours * 60;
    return { days: days, hours: hours, minutes: minutes };
  }

  function minutesToWorkdayBreakdown(totalMinutes, minutesPerWorkday) {
    const mins = Math.max(0, Math.floor(totalMinutes));
    const mpd = Math.max(1, Math.floor(minutesPerWorkday));

    const days = Math.floor(mins / mpd);
    const rem = mins - days * mpd;
    const hours = Math.floor(rem / 60);
    const minutes = rem - hours * 60;

    return { workdays: days, hours: hours, minutes: minutes };
  }

  function isWeekend(dateObj) {
    const dow = dateObj.getDay(); // 0 Sun ... 6 Sat
    return dow === 0 || dow === 6;
  }

  function clampToWorkWindow(dt, windowStartMinutes, windowEndMinutes) {
    const mins = dt.getHours() * 60 + dt.getMinutes();
    if (mins < windowStartMinutes) {
      const out = new Date(dt);
      out.setHours(Math.floor(windowStartMinutes / 60), windowStartMinutes % 60, 0, 0);
      return out;
    }
    if (mins > windowEndMinutes) {
      const out = new Date(dt);
      out.setHours(Math.floor(windowEndMinutes / 60), windowEndMinutes % 60, 0, 0);
      return out;
    }
    return new Date(dt);
  }

  function startOfDay(dt) {
    return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 0, 0, 0, 0);
  }

  function addDays(dt, days) {
    const out = new Date(dt);
    out.setDate(out.getDate() + days);
    return out;
  }

  function calcWorkingMinutesBetween(startDt, endDt, windowStartMinutes, windowEndMinutes, includeWeekends) {
    // Counts only minutes within [windowStartMinutes, windowEndMinutes) for eligible days.
    // Uses a day-by-day intersection approach (fast and predictable for normal user ranges).
    if (!(startDt instanceof Date) || !(endDt instanceof Date)) return 0;
    if (endDt <= startDt) return 0;

    const dayStart = startOfDay(startDt);
    const dayEnd = startOfDay(endDt);

    let total = 0;

    for (let day = new Date(dayStart); day <= dayEnd; day = addDays(day, 1)) {
      if (!includeWeekends && isWeekend(day)) continue;

      const windowStart = new Date(day);
      windowStart.setHours(Math.floor(windowStartMinutes / 60), windowStartMinutes % 60, 0, 0);

      const windowEnd = new Date(day);
      windowEnd.setHours(Math.floor(windowEndMinutes / 60), windowEndMinutes % 60, 0, 0);

      // Determine overlap with [startDt, endDt)
      const segStart = new Date(Math.max(windowStart.getTime(), startDt.getTime()));
      const segEnd = new Date(Math.min(windowEnd.getTime(), endDt.getTime()));

      if (segEnd > segStart) {
        total += Math.round((segEnd.getTime() - segStart.getTime()) / 60000);
      }
    }

    return total;
  }

  // Toggle advanced block visibility based on working-time checkbox
  function syncAdvancedVisibility() {
    if (!advancedBlock || !useWorkingTimeInput) return;
    const on = !!useWorkingTimeInput.checked;

    if (on) {
      advancedBlock.classList.remove("hidden");
      advancedBlock.setAttribute("aria-hidden", "false");
    } else {
      advancedBlock.classList.add("hidden");
      advancedBlock.setAttribute("aria-hidden", "true");
    }

    clearResult();
  }

  if (useWorkingTimeInput) {
    useWorkingTimeInput.addEventListener("change", syncAdvancedVisibility);
  }
  syncAdvancedVisibility();

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Read raw inputs
      const startDateRaw = startDateInput ? startDateInput.value : "";
      const startTimeRaw = startTimeInput ? startTimeInput.value : "";
      const endDateRaw = endDateInput ? endDateInput.value : "";
      const endTimeRaw = endTimeInput ? endTimeInput.value : "";

      // Basic existence guard
      if (!startDateInput || !startTimeInput || !endDateInput || !endTimeInput) return;

      // Parse date and time
      const startDate = parseDateYMD(startDateRaw);
      const endDate = parseDateYMD(endDateRaw);
      const startTime = parseTimeHM(startTimeRaw);
      const endTime = parseTimeHM(endTimeRaw);

      if (!startDate) {
        setResultError("Enter a valid start date in YYYY-MM-DD format.");
        return;
      }
      if (!startTime) {
        setResultError("Enter a valid start time in HH:MM (24-hour) format.");
        return;
      }
      if (!endDate) {
        setResultError("Enter a valid end date in YYYY-MM-DD format.");
        return;
      }
      if (!endTime) {
        setResultError("Enter a valid end time in HH:MM (24-hour) format.");
        return;
      }

      const startDt = combineDateTime(startDate, startTime);
      const endDt = combineDateTime(endDate, endTime);

      if (!(startDt instanceof Date) || Number.isNaN(startDt.getTime())) {
        setResultError("Start date-time is invalid. Check your values.");
        return;
      }
      if (!(endDt instanceof Date) || Number.isNaN(endDt.getTime())) {
        setResultError("End date-time is invalid. Check your values.");
        return;
      }

      if (endDt <= startDt) {
        setResultError("End date-time must be later than the start date-time.");
        return;
      }

      const useWorking = !!(useWorkingTimeInput && useWorkingTimeInput.checked);

      // Defaults (only used when working-time is enabled)
      let workdayStart = parseTimeHM(workdayStartInput ? workdayStartInput.value : "") || { hh: 9, mm: 0 };
      let workdayEnd = parseTimeHM(workdayEndInput ? workdayEndInput.value : "") || { hh: 17, mm: 0 };
      let includeWeekends = !!(includeWeekendsInput && includeWeekendsInput.checked);

      // hoursPerDay: optional override, default derived from window
      const windowStartMinutes = workdayStart.hh * 60 + workdayStart.mm;
      const windowEndMinutes = workdayEnd.hh * 60 + workdayEnd.mm;

      if (useWorking) {
        if (windowEndMinutes <= windowStartMinutes) {
          setResultError("Workday end must be later than workday start.");
          return;
        }
      }

      let hoursPerDay = toNumber(hoursPerDayInput ? hoursPerDayInput.value : "");
      if (!Number.isFinite(hoursPerDay) || hoursPerDay <= 0) {
        hoursPerDay = useWorking ? (windowEndMinutes - windowStartMinutes) / 60 : 24;
      } else {
        // guard unrealistic values
        if (hoursPerDay > 24) hoursPerDay = 24;
      }

      // Calculation
      let resultHtml = "";

      if (!useWorking) {
        const totalMinutes = Math.round((endDt.getTime() - startDt.getTime()) / 60000);
        const totalHours = totalMinutes / 60;

        const elapsed = minutesToBreakdown(totalMinutes);

        resultHtml =
          `<p><strong>Elapsed duration:</strong> ${formatNumberTwoDecimals(totalHours)} hours</p>` +
          `<p><strong>Breakdown:</strong> ${elapsed.days} days, ${elapsed.hours} hours, ${elapsed.minutes} minutes</p>` +
          `<p><strong>Days (24h days):</strong> ${formatNumberTwoDecimals(totalHours / 24)} days</p>` +
          `<p><strong>Notes:</strong> This includes nights and weekends. Use working time if you want a planning-style duration.</p>`;
      } else {
        const workingMinutes = calcWorkingMinutesBetween(
          startDt,
          endDt,
          windowStartMinutes,
          windowEndMinutes,
          includeWeekends
        );

        if (!Number.isFinite(workingMinutes) || workingMinutes <= 0) {
          setResultError("No working time falls within the selected window between these date-times. Check your working-hours settings.");
          return;
        }

        const workingHours = workingMinutes / 60;
        const minutesPerWorkday = Math.round(hoursPerDay * 60);

        const wd = minutesToWorkdayBreakdown(workingMinutes, minutesPerWorkday);
        const workdaysDecimal = workingHours / hoursPerDay;

        const windowLabel =
          String(workdayStart.hh).padStart(2, "0") +
          ":" +
          String(workdayStart.mm).padStart(2, "0") +
          " to " +
          String(workdayEnd.hh).padStart(2, "0") +
          ":" +
          String(workdayEnd.mm).padStart(2, "0");

        resultHtml =
          `<p><strong>Working duration:</strong> ${formatNumberTwoDecimals(workingHours)} hours</p>` +
          `<p><strong>Workdays (based on ${formatNumberTwoDecimals(hoursPerDay)} hours/day):</strong> ${formatNumberTwoDecimals(workdaysDecimal)} days</p>` +
          `<p><strong>Workday breakdown:</strong> ${wd.workdays} workdays, ${wd.hours} hours, ${wd.minutes} minutes</p>` +
          `<p><strong>Schedule used:</strong> ${windowLabel}, weekends ${includeWeekends ? "included" : "excluded"}</p>`;
      }

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Gantt Block Duration Calculator (Simple) - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
