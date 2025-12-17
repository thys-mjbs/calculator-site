document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const startTime = document.getElementById("startTime");
  const endTime = document.getElementById("endTime");
  const bufferMinutes = document.getElementById("bufferMinutes");
  const addBreaks = document.getElementById("addBreaks");
  const breakMinutes = document.getElementById("breakMinutes");

  const activityName1 = document.getElementById("activityName1");
  const activityMinutes1 = document.getElementById("activityMinutes1");
  const activityName2 = document.getElementById("activityName2");
  const activityMinutes2 = document.getElementById("activityMinutes2");
  const activityName3 = document.getElementById("activityName3");
  const activityMinutes3 = document.getElementById("activityMinutes3");
  const activityName4 = document.getElementById("activityName4");
  const activityMinutes4 = document.getElementById("activityMinutes4");
  const activityName5 = document.getElementById("activityName5");
  const activityMinutes5 = document.getElementById("activityMinutes5");
  const activityName6 = document.getElementById("activityName6");
  const activityMinutes6 = document.getElementById("activityMinutes6");

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
  attachLiveFormatting(bufferMinutes);
  attachLiveFormatting(breakMinutes);
  attachLiveFormatting(activityMinutes1);
  attachLiveFormatting(activityMinutes2);
  attachLiveFormatting(activityMinutes3);
  attachLiveFormatting(activityMinutes4);
  attachLiveFormatting(activityMinutes5);
  attachLiveFormatting(activityMinutes6);

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
  function parseTimeToMinutes(hhmm) {
    const raw = String(hhmm || "").trim();
    const m = raw.match(/^(\d{1,2})\s*:\s*(\d{2})$/);
    if (!m) return null;

    const h = Number(m[1]);
    const min = Number(m[2]);

    if (!Number.isFinite(h) || !Number.isFinite(min)) return null;
    if (h < 0 || h > 23) return null;
    if (min < 0 || min > 59) return null;

    return h * 60 + min;
  }

  function minutesToHHMM(totalMinutes) {
    let mins = totalMinutes % (24 * 60);
    if (mins < 0) mins += 24 * 60;

    const h = Math.floor(mins / 60);
    const m = mins % 60;

    const hh = String(h).padStart(2, "0");
    const mm = String(m).padStart(2, "0");
    return hh + ":" + mm;
  }

  function readActivity(nameEl, minutesEl) {
    const nameRaw = nameEl ? String(nameEl.value || "").trim() : "";
    const minutesVal = toNumber(minutesEl ? minutesEl.value : "");

    const hasName = nameRaw.length > 0;
    const hasMinutes = Number.isFinite(minutesVal) && minutesVal > 0;

    if (!hasName && !hasMinutes) return null;
    if (!hasMinutes) return { name: hasName ? nameRaw : "Activity", minutes: 0, invalid: true };

    return { name: hasName ? nameRaw : "Activity", minutes: minutesVal, invalid: false };
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      // Parse inputs using toNumber() (from /scripts/main.js)
      const startMin = parseTimeToMinutes(startTime ? startTime.value : "");
      const endMinRaw = parseTimeToMinutes(endTime ? endTime.value : "");

      if (startMin === null) {
        setResultError("Enter a valid day start time in HH:MM format (for example, 07:30).");
        return;
      }
      if (endMinRaw === null) {
        setResultError("Enter a valid day end time in HH:MM format (for example, 22:30).");
        return;
      }

      // Handle crossing midnight
      let endMin = endMinRaw;
      if (endMin <= startMin) {
        endMin += 24 * 60;
      }

      const available = endMin - startMin;
      if (!validatePositive(available, "day length (end time must be after start time)")) return;

      const buffer = toNumber(bufferMinutes ? bufferMinutes.value : "");
      const bufferSafe = Number.isFinite(buffer) ? buffer : 0;

      if (!validateNonNegative(bufferSafe, "buffer minutes")) return;
      if (bufferSafe > available) {
        setResultError("Your buffer time is longer than your available day. Reduce the buffer or widen your day start/end times.");
        return;
      }

      const breaksEnabled = addBreaks && addBreaks.value === "yes";
      const breakLen = toNumber(breakMinutes ? breakMinutes.value : "");
      const breakSafe = Number.isFinite(breakLen) ? breakLen : 0;

      if (breaksEnabled) {
        if (!validateNonNegative(breakSafe, "break minutes")) return;
      }

      const activities = [
        readActivity(activityName1, activityMinutes1),
        readActivity(activityName2, activityMinutes2),
        readActivity(activityName3, activityMinutes3),
        readActivity(activityName4, activityMinutes4),
        readActivity(activityName5, activityMinutes5),
        readActivity(activityName6, activityMinutes6)
      ].filter(Boolean);

      if (activities.length === 0) {
        setResultError("Add at least one activity with a duration in minutes.");
        return;
      }

      const invalidRows = activities.filter(a => a.invalid);
      if (invalidRows.length > 0) {
        setResultError("One or more activities has a missing or invalid duration. Enter minutes greater than 0 for each activity you include.");
        return;
      }

      const activityTotal = activities.reduce((sum, a) => sum + a.minutes, 0);
      const breaksCount = breaksEnabled ? Math.max(0, activities.length - 1) : 0;
      const breaksTotal = breaksEnabled ? breaksCount * breakSafe : 0;

      const usable = available - bufferSafe;
      const planned = activityTotal + breaksTotal;
      const remaining = usable - planned;

      // Build schedule
      let cursor = startMin;
      const scheduleRows = [];

      for (let i = 0; i < activities.length; i++) {
        const a = activities[i];
        const start = cursor;
        const end = cursor + a.minutes;

        scheduleRows.push({
          label: a.name,
          start: minutesToHHMM(start),
          end: minutesToHHMM(end),
          minutes: a.minutes
        });

        cursor = end;

        if (breaksEnabled && i < activities.length - 1 && breakSafe > 0) {
          const bStart = cursor;
          const bEnd = cursor + breakSafe;

          scheduleRows.push({
            label: "Break",
            start: minutesToHHMM(bStart),
            end: minutesToHHMM(bEnd),
            minutes: breakSafe
          });

          cursor = bEnd;
        }
      }

      // Practical notes
      let fitLine = "";
      let guidance = "";

      if (remaining >= 0) {
        fitLine = "Your plan fits with " + Math.round(remaining) + " minutes left after buffer.";
        if (remaining >= 60) {
          guidance = "You have enough spare time to add a short task, extend one activity, or increase buffer if your day is unpredictable.";
        } else if (remaining >= 15) {
          guidance = "You have a small margin. Consider using it as transition time so your plan stays on track.";
        } else {
          guidance = "Your plan is tight. If you often run late, increase buffer or shorten one activity.";
        }
      } else {
        fitLine = "You are overbooked by " + Math.round(Math.abs(remaining)) + " minutes after buffer.";
        guidance = "Reduce durations, remove an activity, shorten breaks, or widen your day start/end times. If you want a realistic plan, keep buffer and cut the plan first.";
      }

      const totalAvailableStr = Math.round(available) + " minutes";
      const usableStr = Math.round(usable) + " minutes";
      const bufferStr = Math.round(bufferSafe) + " minutes";
      const plannedStr = Math.round(planned) + " minutes";
      const breaksStr = Math.round(breaksTotal) + " minutes";

      const summaryHtml = `
        <p><strong>Schedule summary</strong></p>
        <ul class="summary-list">
          <li><strong>Total day length:</strong> ${totalAvailableStr}</li>
          <li><strong>Reserved buffer:</strong> ${bufferStr}</li>
          <li><strong>Usable time:</strong> ${usableStr}</li>
          <li><strong>Planned activities:</strong> ${Math.round(activityTotal)} minutes</li>
          <li><strong>Planned breaks:</strong> ${breaksEnabled ? breaksStr : "0 minutes"}</li>
          <li><strong>Total planned:</strong> ${plannedStr}</li>
        </ul>
        <p><strong>Status:</strong> ${fitLine}</p>
        <p>${guidance}</p>
      `;

      const rowsHtml = scheduleRows.map(r => {
        return `<tr><td>${r.start}</td><td>${r.end}</td><td>${r.label}</td><td>${Math.round(r.minutes)}</td></tr>`;
      }).join("");

      const tableHtml = `
        <table class="schedule-table" aria-label="Planned schedule timeline">
          <thead>
            <tr>
              <th scope="col">Start</th>
              <th scope="col">End</th>
              <th scope="col">Block</th>
              <th scope="col">Minutes</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      `;

      const resultHtml = summaryHtml + tableHtml;

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
      const message = "Daily Schedule Planner - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
