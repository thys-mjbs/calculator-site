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
  const endDateInput = document.getElementById("endDate");
  const includeStartInput = document.getElementById("includeStart");
  const includeEndInput = document.getElementById("includeEnd");
  const excludeHolidaysInput = document.getElementById("excludeHolidays");
  const holidayDatesInput = document.getElementById("holidayDates");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // No comma formatting needed for date fields.

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
  function validateDateString(dateStr, fieldLabel) {
    if (!dateStr || typeof dateStr !== "string") {
      setResultError("Enter a valid " + fieldLabel + " in YYYY-MM-DD format.");
      return false;
    }
    const trimmed = dateStr.trim();
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    if (!match) {
      setResultError("Enter a valid " + fieldLabel + " in YYYY-MM-DD format.");
      return false;
    }

    const y = Number(match[1]);
    const m = Number(match[2]);
    const d = Number(match[3]);

    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
      setResultError("Enter a valid " + fieldLabel + " in YYYY-MM-DD format.");
      return false;
    }

    const dt = new Date(Date.UTC(y, m - 1, d));
    if (
      dt.getUTCFullYear() !== y ||
      dt.getUTCMonth() !== (m - 1) ||
      dt.getUTCDate() !== d
    ) {
      setResultError("Enter a real calendar date for " + fieldLabel + ".");
      return false;
    }

    return true;
  }

  function parseUTCDate(dateStr) {
    const parts = dateStr.trim().split("-");
    const y = Number(parts[0]);
    const m = Number(parts[1]);
    const d = Number(parts[2]);
    return new Date(Date.UTC(y, m - 1, d));
  }

  function toISODateUTC(dateObj) {
    const y = dateObj.getUTCFullYear();
    const m = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getUTCDate()).padStart(2, "0");
    return y + "-" + m + "-" + d;
  }

  function addDaysUTC(dateObj, days) {
    const next = new Date(dateObj.getTime());
    next.setUTCDate(next.getUTCDate() + days);
    return next;
  }

  function isWeekendUTC(dateObj) {
    const day = dateObj.getUTCDay(); // 0 Sun ... 6 Sat
    return day === 0 || day === 6;
  }

  function parseHolidaySet(raw) {
    const set = new Set();
    if (!raw) return set;

    const tokens = raw
      .split(/[\n,]+/)
      .map(function (t) { return t.trim(); })
      .filter(function (t) { return t.length > 0; });

    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
        set.add(t);
      }
    }
    return set;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      if (!startDateInput || !endDateInput) return;

      const startStr = (startDateInput.value || "").trim();
      const endStr = (endDateInput.value || "").trim();

      if (!validateDateString(startStr, "start date")) return;
      if (!validateDateString(endStr, "end date")) return;

      const startDate = parseUTCDate(startStr);
      const endDate = parseUTCDate(endStr);

      if (endDate.getTime() < startDate.getTime()) {
        setResultError("End date must be the same as or later than the start date.");
        return;
      }

      const includeStart = includeStartInput ? !!includeStartInput.checked : true;
      const includeEnd = includeEndInput ? !!includeEndInput.checked : true;

      const excludeHolidays = excludeHolidaysInput ? !!excludeHolidaysInput.checked : false;
      const holidaySet = excludeHolidays
        ? parseHolidaySet(holidayDatesInput ? holidayDatesInput.value : "")
        : new Set();

      // Determine iteration boundaries
      let iterStart = new Date(startDate.getTime());
      let iterEnd = new Date(endDate.getTime());

      if (!includeStart) iterStart = addDaysUTC(iterStart, 1);
      if (!includeEnd) iterEnd = addDaysUTC(iterEnd, -1);

      if (iterEnd.getTime() < iterStart.getTime()) {
        setResultError("With your include/exclude settings, there are no days to count in this range.");
        return;
      }

      // Count totals
      let totalDays = 0;
      let weekendDays = 0;
      let holidayExcluded = 0;
      let businessDays = 0;

      let cursor = new Date(iterStart.getTime());
      while (cursor.getTime() <= iterEnd.getTime()) {
        totalDays += 1;

        const iso = toISODateUTC(cursor);
        const weekend = isWeekendUTC(cursor);

        if (weekend) {
          weekendDays += 1;
        } else {
          // Weekday
          if (excludeHolidays && holidaySet.has(iso)) {
            holidayExcluded += 1;
          } else {
            businessDays += 1;
          }
        }

        cursor = addDaysUTC(cursor, 1);
      }

      const startLabel = toISODateUTC(startDate);
      const endLabel = toISODateUTC(endDate);

      const boundaryNoteParts = [];
      boundaryNoteParts.push(includeStart ? "including start" : "excluding start");
      boundaryNoteParts.push(includeEnd ? "including end" : "excluding end");

      const holidayNote = excludeHolidays
        ? "Holidays excluded: " + holidayExcluded + "."
        : "Holidays excluded: 0 (not applied).";

      const resultHtml =
        `<p><strong>Business days:</strong> ${businessDays}</p>` +
        `<p><strong>Date range:</strong> ${startLabel} to ${endLabel} (${boundaryNoteParts.join(", ")})</p>` +
        `<p><strong>Total counted days:</strong> ${totalDays}</p>` +
        `<p><strong>Weekend days removed:</strong> ${weekendDays}</p>` +
        `<p><strong>${holidayNote}</strong></p>` +
        `<p>If you need a stricter “working days” count, tick holiday exclusion and paste your relevant holiday dates.</p>`;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Business Days Between Dates Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
