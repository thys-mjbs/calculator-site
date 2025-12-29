document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const startDateTime = document.getElementById("startDateTime");
  const gapMinutes = document.getElementById("gapMinutes");
  const contingencyPercent = document.getElementById("contingencyPercent");
  const roundUpMinutes = document.getElementById("roundUpMinutes");

  const taskName1 = document.getElementById("taskName1");
  const taskHours1 = document.getElementById("taskHours1");
  const taskName2 = document.getElementById("taskName2");
  const taskHours2 = document.getElementById("taskHours2");
  const taskName3 = document.getElementById("taskName3");
  const taskHours3 = document.getElementById("taskHours3");
  const taskName4 = document.getElementById("taskName4");
  const taskHours4 = document.getElementById("taskHours4");
  const taskName5 = document.getElementById("taskName5");
  const taskHours5 = document.getElementById("taskHours5");
  const taskName6 = document.getElementById("taskName6");
  const taskHours6 = document.getElementById("taskHours6");
  const taskName7 = document.getElementById("taskName7");
  const taskHours7 = document.getElementById("taskHours7");
  const taskName8 = document.getElementById("taskName8");
  const taskHours8 = document.getElementById("taskHours8");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(gapMinutes);
  attachLiveFormatting(contingencyPercent);
  attachLiveFormatting(roundUpMinutes);

  attachLiveFormatting(taskHours1);
  attachLiveFormatting(taskHours2);
  attachLiveFormatting(taskHours3);
  attachLiveFormatting(taskHours4);
  attachLiveFormatting(taskHours5);
  attachLiveFormatting(taskHours6);
  attachLiveFormatting(taskHours7);
  attachLiveFormatting(taskHours8);

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
  function parseLocalDateTime(raw) {
    const s = String(raw || "").trim();
    if (!s) return null;

    // Accept "YYYY-MM-DD HH:MM" or "YYYY-MM-DDTHH:MM"
    const normalized = s.replace("T", " ");
    const m = normalized.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/);
    if (!m) return null;

    const year = Number(m[1]);
    const month = Number(m[2]);
    const day = Number(m[3]);
    const hour = Number(m[4]);
    const minute = Number(m[5]);

    const dt = new Date(year, month - 1, day, hour, minute, 0, 0);
    if (!Number.isFinite(dt.getTime())) return null;

    // Guard against impossible dates like 2025-02-30
    if (
      dt.getFullYear() !== year ||
      dt.getMonth() !== month - 1 ||
      dt.getDate() !== day ||
      dt.getHours() !== hour ||
      dt.getMinutes() !== minute
    ) {
      return null;
    }

    return dt;
  }

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function formatDateTime(dt) {
    const y = dt.getFullYear();
    const mo = pad2(dt.getMonth() + 1);
    const d = pad2(dt.getDate());
    const h = pad2(dt.getHours());
    const mi = pad2(dt.getMinutes());
    return y + "-" + mo + "-" + d + " " + h + ":" + mi;
  }

  function minutesToHoursMinutes(totalMinutes) {
    const mins = Math.max(0, Math.round(totalMinutes));
    const hours = Math.floor(mins / 60);
    const rem = mins % 60;
    return { hours: hours, minutes: rem };
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse required start datetime
      const start = parseLocalDateTime(startDateTime ? startDateTime.value : "");
      if (!start) {
        setResultError("Enter a valid start date and time in the format YYYY-MM-DD HH:MM.");
        return;
      }

      // Parse optional settings
      const gap = toNumber(gapMinutes ? gapMinutes.value : "");
      const contingency = toNumber(contingencyPercent ? contingencyPercent.value : "");
      const roundTo = toNumber(roundUpMinutes ? roundUpMinutes.value : "");

      const gapMinutesValue = Number.isFinite(gap) ? gap : 0;
      const contingencyPercentValue = Number.isFinite(contingency) ? contingency : 0;
      const roundUpMinutesValue = Number.isFinite(roundTo) ? roundTo : 0;

      if (!validateNonNegative(gapMinutesValue, "buffer between tasks (minutes)")) return;
      if (!validateNonNegative(contingencyPercentValue, "contingency (percent)")) return;
      if (!validateNonNegative(roundUpMinutesValue, "rounding minutes")) return;

      if (contingencyPercentValue > 300) {
        setResultError("Contingency looks unrealistic. Use a percent between 0 and 300.");
        return;
      }

      if (roundUpMinutesValue > 240) {
        setResultError("Rounding looks too large. Use a value between 0 and 240 minutes.");
        return;
      }

      const tasks = [
        { nameEl: taskName1, hoursEl: taskHours1, index: 1 },
        { nameEl: taskName2, hoursEl: taskHours2, index: 2 },
        { nameEl: taskName3, hoursEl: taskHours3, index: 3 },
        { nameEl: taskName4, hoursEl: taskHours4, index: 4 },
        { nameEl: taskName5, hoursEl: taskHours5, index: 5 },
        { nameEl: taskName6, hoursEl: taskHours6, index: 6 },
        { nameEl: taskName7, hoursEl: taskHours7, index: 7 },
        { nameEl: taskName8, hoursEl: taskHours8, index: 8 }
      ];

      const selected = [];
      for (let i = 0; i < tasks.length; i++) {
        const t = tasks[i];
        const rawName = t.nameEl ? String(t.nameEl.value || "").trim() : "";
        const hours = toNumber(t.hoursEl ? t.hoursEl.value : "");

        const hasHours = Number.isFinite(hours) && hours > 0;
        if (hasHours) {
          if (hours > 240) {
            setResultError("Task " + t.index + " duration looks unrealistic. Enter hours less than or equal to 240.");
            return;
          }
          selected.push({
            name: rawName ? rawName : "Task " + t.index,
            hours: hours
          });
        }
      }

      if (selected.length === 0) {
        setResultError("Enter at least one task duration greater than 0 hours.");
        return;
      }

      // Apply settings per task
      const contingencyFactor = 1 + contingencyPercentValue / 100;

      function applyRounding(minutes) {
        if (!roundUpMinutesValue) return minutes;
        const step = Math.max(1, Math.round(roundUpMinutesValue));
        return Math.ceil(minutes / step) * step;
      }

      const scheduleRows = [];
      let cursor = new Date(start.getTime());
      let totalPlannedMinutes = 0;

      for (let i = 0; i < selected.length; i++) {
        const task = selected[i];

        let minutes = task.hours * 60;
        minutes = minutes * contingencyFactor;
        minutes = applyRounding(minutes);

        if (!validatePositive(minutes, task.name + " duration")) return;

        const taskStart = new Date(cursor.getTime());
        const taskEnd = new Date(cursor.getTime() + Math.round(minutes) * 60 * 1000);

        scheduleRows.push({
          name: task.name,
          start: taskStart,
          end: taskEnd,
          minutes: Math.round(minutes)
        });

        totalPlannedMinutes += Math.round(minutes);

        cursor = new Date(taskEnd.getTime());

        // Buffer between tasks (not after last)
        if (i < selected.length - 1 && gapMinutesValue > 0) {
          cursor = new Date(cursor.getTime() + Math.round(gapMinutesValue) * 60 * 1000);
          totalPlannedMinutes += Math.round(gapMinutesValue);
        }
      }

      const endDateTime = cursor;
      const hm = minutesToHoursMinutes(totalPlannedMinutes);
      const totalHoursDecimal = totalPlannedMinutes / 60;

      let listHtml = "<ol class=\"schedule-list\">";
      for (let i = 0; i < scheduleRows.length; i++) {
        const row = scheduleRows[i];
        const rowHm = minutesToHoursMinutes(row.minutes);
        const durLabel = rowHm.hours + "h " + rowHm.minutes + "m";
        listHtml +=
          "<li><strong>" +
          escapeHtml(row.name) +
          "</strong><br>" +
          "Start: " +
          escapeHtml(formatDateTime(row.start)) +
          "<br>" +
          "End: " +
          escapeHtml(formatDateTime(row.end)) +
          "<br>" +
          "Planned duration: " +
          escapeHtml(durLabel) +
          "</li>";
      }
      listHtml += "</ol>";

      const appliedNotes = [];
      if (gapMinutesValue > 0) appliedNotes.push("Buffer between tasks: " + formatInputWithCommas(String(Math.round(gapMinutesValue))) + " minutes");
      if (contingencyPercentValue > 0) appliedNotes.push("Contingency applied: " + formatInputWithCommas(String(contingencyPercentValue)) + "% per task");
      if (roundUpMinutesValue > 0) appliedNotes.push("Rounding applied: up to nearest " + formatInputWithCommas(String(Math.round(roundUpMinutesValue))) + " minutes per task");

      const notesHtml = appliedNotes.length
        ? "<ul><li>" + appliedNotes.map(escapeHtml).join("</li><li>") + "</li></ul>"
        : "<p>No optional planning adjustments were applied.</p>";

      const resultHtml =
        "<p><strong>Finish date and time:</strong> " +
        escapeHtml(formatDateTime(endDateTime)) +
        "</p>" +
        "<p><strong>Total planned time:</strong> " +
        escapeHtml(hm.hours + "h " + hm.minutes + "m") +
        " (" +
        escapeHtml(formatNumberTwoDecimals(totalHoursDecimal)) +
        " hours)</p>" +
        "<p><strong>Applied assumptions for this run:</strong></p>" +
        notesHtml +
        "<p><strong>Task schedule:</strong></p>" +
        listHtml;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Task Sequencing Time Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
