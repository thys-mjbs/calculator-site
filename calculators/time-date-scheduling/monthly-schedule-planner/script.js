document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const monthSelect = document.getElementById("monthSelect");
  const yearInput = document.getElementById("yearInput");
  const weekStartSelect = document.getElementById("weekStartSelect");
  const excludeDatesInput = document.getElementById("excludeDatesInput");
  const highlightWeekendsCheckbox = document.getElementById("highlightWeekendsCheckbox");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (not used)
  

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // (not used for this calculator)
  

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
  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function monthName(monthIndex) {
    const names = [
      "January","February","March","April","May","June",
      "July","August","September","October","November","December"
    ];
    return names[monthIndex] || "";
  }

  function isValidIsoDateString(s) {
    // Basic YYYY-MM-DD check plus real date check
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    const parts = s.split("-");
    const y = Number(parts[0]);
    const m = Number(parts[1]);
    const d = Number(parts[2]);
    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return false;
    const dt = new Date(y, m - 1, d);
    return dt.getFullYear() === y && dt.getMonth() === (m - 1) && dt.getDate() === d;
  }

  function parseExcludedDates(raw, year, monthIndex) {
    const set = new Set();
    if (!raw || typeof raw !== "string") return set;

    const parts = raw
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    for (const p of parts) {
      if (!isValidIsoDateString(p)) continue;
      const [yy, mm, dd] = p.split("-").map(Number);
      if (yy !== year) continue;
      if (mm !== (monthIndex + 1)) continue;
      set.add(p);
    }
    return set;
  }

  function buildCalendarHtml(year, monthIndex, weekStart, highlightWeekends, excludedSet) {
    const firstOfMonth = new Date(year, monthIndex, 1);
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    // Convert JS getDay() (0 Sun ... 6 Sat) into an offset based on weekStart
    const firstDay = firstOfMonth.getDay(); // 0..6
    const offset = (firstDay - weekStart + 7) % 7;

    const labelsMondayFirst = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
    const labelsSundayFirst = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const headers = weekStart === 1 ? labelsMondayFirst : labelsSundayFirst;

    // Summary counts
    let weekendDays = 0;
    let weekdayDays = 0;
    let excludedWeekdays = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(year, monthIndex, d);
      const dow = dt.getDay();
      const iso = `${year}-${pad2(monthIndex + 1)}-${pad2(d)}`;

      const isWeekend = (dow === 0 || dow === 6);
      if (isWeekend) weekendDays += 1;
      else weekdayDays += 1;

      if (!isWeekend && excludedSet.has(iso)) excludedWeekdays += 1;
    }

    const workingDays = weekdayDays;
    const workingDaysAfterExclusions = Math.max(0, workingDays - excludedWeekdays);

    // Calendar grid
    const totalCells = offset + daysInMonth;
    const weeks = Math.ceil(totalCells / 7);

    let html = "";

    html += `<div class="monthly-summary">`;
    html += `<p><strong>${monthName(monthIndex)} ${year}</strong></p>`;
    html += `<p>Total days: <strong>${daysInMonth}</strong><br>`;
    html += `Weekdays (Mon to Fri): <strong>${weekdayDays}</strong><br>`;
    html += `Weekends (Sat and Sun): <strong>${weekendDays}</strong><br>`;
    html += `Workdays: <strong>${workingDays}</strong><br>`;
    html += `Excluded weekday dates used: <strong>${excludedWeekdays}</strong><br>`;
    html += `Workdays after exclusions: <strong>${workingDaysAfterExclusions}</strong></p>`;
    html += `</div>`;

    html += `<table class="monthly-calendar" aria-label="Monthly calendar">`;
    html += `<thead><tr>`;
    for (const h of headers) {
      html += `<th scope="col">${h}</th>`;
    }
    html += `</tr></thead><tbody>`;

    let dayNum = 1;
    for (let w = 0; w < weeks; w++) {
      html += `<tr>`;
      for (let c = 0; c < 7; c++) {
        const cellIndex = w * 7 + c;
        if (cellIndex < offset || dayNum > daysInMonth) {
          html += `<td class="is-empty" aria-label="Empty"></td>`;
          continue;
        }

        const dt = new Date(year, monthIndex, dayNum);
        const dow = dt.getDay();
        const iso = `${year}-${pad2(monthIndex + 1)}-${pad2(dayNum)}`;

        const isWeekend = (dow === 0 || dow === 6);
        const isExcluded = excludedSet.has(iso);

        const classes = [];
        if (highlightWeekends && isWeekend) classes.push("is-weekend");
        if (isExcluded) classes.push("is-excluded");

        const classAttr = classes.length ? ` class="${classes.join(" ")}"` : "";
        const labelParts = [];
        labelParts.push(String(dayNum));
        if (isWeekend) labelParts.push("weekend");
        if (isExcluded) labelParts.push("excluded");
        html += `<td${classAttr} aria-label="${labelParts.join(", ")}">${dayNum}</td>`;

        dayNum += 1;
      }
      html += `</tr>`;
    }

    html += `</tbody></table>`;

    html += `<div class="monthly-legend" aria-label="Legend">`;
    if (highlightWeekends) {
      html += `<span><strong>Weekend</strong> highlight enabled</span>`;
    }
    if (excludedSet.size > 0) {
      html += `<span><strong>Excluded</strong> dates highlighted</span>`;
    }
    if (!highlightWeekends && excludedSet.size === 0) {
      html += `<span>Tip: turn on weekend highlighting or add excluded dates for more planning value.</span>`;
    }
    html += `</div>`;

    return html;
  }

  function initDefaults() {
    const now = new Date();
    if (monthSelect) monthSelect.value = String(now.getMonth());
    if (yearInput) yearInput.value = String(now.getFullYear());
    if (weekStartSelect) weekStartSelect.value = "1";
    if (highlightWeekendsCheckbox) highlightWeekendsCheckbox.checked = true;
  }

  initDefaults();

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // (no modes)
      

      // Parse inputs using toNumber() (from /scripts/main.js)
      const monthIndex = monthSelect ? Number(monthSelect.value) : NaN;
      const year = toNumber(yearInput ? yearInput.value : "");
      const weekStart = weekStartSelect ? Number(weekStartSelect.value) : 1;
      const highlightWeekends = !!(highlightWeekendsCheckbox && highlightWeekendsCheckbox.checked);
      const excludedRaw = excludeDatesInput ? excludeDatesInput.value : "";

      // Basic existence guard
      if (!monthSelect || !yearInput || !weekStartSelect || !excludeDatesInput || !highlightWeekendsCheckbox) return;

      // Validation
      if (!Number.isFinite(monthIndex) || monthIndex < 0 || monthIndex > 11) {
        setResultError("Select a valid month.");
        return;
      }

      if (!Number.isFinite(year) || year < 1900 || year > 2100) {
        setResultError("Enter a valid year between 1900 and 2100.");
        return;
      }

      if (weekStart !== 0 && weekStart !== 1) {
        setResultError("Select a valid week start day.");
        return;
      }

      // Calculation logic
      const excludedSet = parseExcludedDates(excludedRaw, year, monthIndex);

      // Build output HTML
      const resultHtml = buildCalendarHtml(year, monthIndex, weekStart, highlightWeekends, excludedSet);

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
      const message = "Monthly Schedule Planner - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
