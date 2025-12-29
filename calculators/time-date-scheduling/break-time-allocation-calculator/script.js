document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const shiftHoursInput = document.getElementById("shiftHours");
  const totalBreakMinutesInput = document.getElementById("totalBreakMinutes");
  const minLongBreakMinutesInput = document.getElementById("minLongBreakMinutes");
  const shortBreakCountInput = document.getElementById("shortBreakCount");

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
  attachLiveFormatting(shiftHoursInput);
  attachLiveFormatting(totalBreakMinutesInput);
  attachLiveFormatting(minLongBreakMinutesInput);
  attachLiveFormatting(shortBreakCountInput);

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

  function clampInt(n, min, max) {
    if (!Number.isFinite(n)) return min;
    const v = Math.round(n);
    return Math.min(max, Math.max(min, v));
  }

  function fmtMinutesWhole(n) {
    const v = Math.round(n);
    return formatInputWithCommas(String(v));
  }

  function minutesFromShiftHours(hours) {
    return hours * 60;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const shiftHours = toNumber(shiftHoursInput ? shiftHoursInput.value : "");
      const totalBreakMinutes = toNumber(totalBreakMinutesInput ? totalBreakMinutesInput.value : "");

      // Advanced (optional)
      const minLongBreakRaw = toNumber(minLongBreakMinutesInput ? minLongBreakMinutesInput.value : "");
      const shortBreakCountRaw = toNumber(shortBreakCountInput ? shortBreakCountInput.value : "");

      // Existence guard
      if (!shiftHoursInput || !totalBreakMinutesInput) return;

      // Validation
      if (!validatePositive(shiftHours, "shift length (hours)")) return;
      if (!validatePositive(totalBreakMinutes, "total break time (minutes)")) return;

      const shiftMinutes = minutesFromShiftHours(shiftHours);

      if (!Number.isFinite(shiftMinutes) || shiftMinutes <= 0) {
        setResultError("Enter a valid shift length.");
        return;
      }

      if (totalBreakMinutes >= shiftMinutes) {
        setResultError("Total break time must be less than your shift length.");
        return;
      }

      // Defaults (progressive disclosure)
      const defaultMinLongBreak = 30;
      const defaultShortBreakCount = 2;

      const minLongBreak = Number.isFinite(minLongBreakRaw) && minLongBreakRaw > 0 ? minLongBreakRaw : defaultMinLongBreak;
      const shortBreakCount = clampInt(
        Number.isFinite(shortBreakCountRaw) && shortBreakCountRaw > 0 ? shortBreakCountRaw : defaultShortBreakCount,
        1,
        6
      );

      // Allocation rules:
      // - Create a long break only if totalBreakMinutes supports it after leaving at least 5 minutes per short break.
      // - Otherwise, allocate everything into short breaks.
      const minShortBreakEach = 5;
      const minShortTotal = shortBreakCount * minShortBreakEach;

      let longBreakMinutes = 0;
      let remainingForShort = totalBreakMinutes;

      if (totalBreakMinutes >= minLongBreak + minShortTotal) {
        longBreakMinutes = minLongBreak;
        remainingForShort = totalBreakMinutes - longBreakMinutes;
      } else {
        longBreakMinutes = 0;
        remainingForShort = totalBreakMinutes;
      }

      // Split short breaks evenly, rounded to whole minutes
      let shortEach = remainingForShort / shortBreakCount;
      shortEach = Math.max(minShortBreakEach, Math.round(shortEach));

      // Reconcile rounding to keep total within budget
      let shortTotal = shortEach * shortBreakCount;
      let overflow = (longBreakMinutes + shortTotal) - totalBreakMinutes;

      // If rounding caused overflow, reduce 1 minute from some short breaks until it fits,
      // but do not go below the minimum per short break.
      let reductions = 0;
      while (overflow > 0 && reductions < 10000 && shortEach > minShortBreakEach) {
        shortEach -= 1;
        shortTotal = shortEach * shortBreakCount;
        overflow = (longBreakMinutes + shortTotal) - totalBreakMinutes;
        reductions += 1;
      }

      // If we still overflow (edge cases), adjust long break down, but keep it at least 0.
      if (overflow > 0 && longBreakMinutes > 0) {
        longBreakMinutes = Math.max(0, Math.round(longBreakMinutes - overflow));
      }

      const allocatedTotal = longBreakMinutes + (shortEach * shortBreakCount);
      const unallocated = Math.max(0, Math.round(totalBreakMinutes - allocatedTotal));
      const workMinutesNet = Math.round(shiftMinutes - totalBreakMinutes);

      // Suggested schedule (minutes from start)
      // - If long break exists: short breaks at ~25% and ~75% (or spread if more),
      //   long break at ~50%.
      // - If no long break: short breaks spread evenly.
      const schedule = [];

      function addSchedule(label, atMinutes, durationMinutes) {
        const m = Math.max(0, Math.min(Math.round(atMinutes), Math.round(shiftMinutes)));
        schedule.push({
          label: label,
          at: m,
          duration: Math.round(durationMinutes)
        });
      }

      if (longBreakMinutes > 0) {
        const mid = shiftMinutes * 0.5;
        addSchedule("Long break", mid, longBreakMinutes);

        // Short breaks: place around the long break, evenly across the shift excluding endpoints
        for (let i = 1; i <= shortBreakCount; i++) {
          const pos = i / (shortBreakCount + 1); // (0,1)
          let at = shiftMinutes * pos;

          // Nudge away from the long break window to reduce overlap clustering
          const longWindowStart = mid - (longBreakMinutes / 2);
          const longWindowEnd = mid + (longBreakMinutes / 2);

          if (at > longWindowStart && at < longWindowEnd) {
            at = at < mid ? longWindowStart - 20 : longWindowEnd + 20;
          }

          // Keep within a safe band (avoid first/last 20 minutes)
          at = Math.max(20, Math.min(at, shiftMinutes - 20));

          addSchedule("Short break " + i, at, shortEach);
        }
      } else {
        for (let i = 1; i <= shortBreakCount; i++) {
          const pos = i / (shortBreakCount + 1);
          let at = shiftMinutes * pos;

          // Keep within a safe band (avoid first/last 15 minutes)
          at = Math.max(15, Math.min(at, shiftMinutes - 15));

          addSchedule("Short break " + i, at, shortEach);
        }
      }

      // Sort by time
      schedule.sort(function (a, b) {
        return a.at - b.at;
      });

      const scheduleHtmlItems = schedule
        .map(function (s) {
          return (
            "<li><strong>" +
            s.label +
            ":</strong> at " +
            fmtMinutesWhole(s.at) +
            " min from start (" +
            fmtMinutesWhole(s.duration) +
            " min)</li>"
          );
        })
        .join("");

      const breakPercent = (totalBreakMinutes / shiftMinutes) * 100;

      let notes = "";
      if (longBreakMinutes === 0) {
        notes =
          "<p><strong>Note:</strong> Your total break time is not large enough to include a meaningful long break with your chosen short break count. The plan uses short breaks only.</p>";
      } else if (unallocated > 0) {
        notes =
          "<p><strong>Note:</strong> " +
          fmtMinutesWhole(unallocated) +
          " minute(s) were left unassigned due to rounding. You can add them to any break.</p>";
      }

      const resultHtml =
        '<div class="result-block">' +
        "<p><strong>Recommended break plan</strong></p>" +
        '<table class="result-table">' +
        "<tr><td>Shift length</td><td>" +
        fmtMinutesWhole(shiftMinutes) +
        " min</td></tr>" +
        "<tr><td>Total break time</td><td>" +
        fmtMinutesWhole(totalBreakMinutes) +
        " min (" +
        formatNumberTwoDecimals(breakPercent) +
        "%)</td></tr>" +
        "<tr><td>Long break</td><td>" +
        fmtMinutesWhole(longBreakMinutes) +
        " min</td></tr>" +
        "<tr><td>Short breaks</td><td>" +
        shortBreakCount +
        " × " +
        fmtMinutesWhole(shortEach) +
        " min</td></tr>" +
        "<tr><td>Net working time</td><td>" +
        fmtMinutesWhole(workMinutesNet) +
        " min</td></tr>" +
        "</table>" +
        notes +
        "<p><strong>Suggested timing (minutes from shift start)</strong></p>" +
        '<ul class="result-list">' +
        scheduleHtmlItems +
        "</ul>" +
        "</div>";

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Break Time Allocation Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
