document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const wakeTime = document.getElementById("wakeTime");
  const sleepTime = document.getElementById("sleepTime");

  const day1 = document.getElementById("day1");
  const start1 = document.getElementById("start1");
  const end1 = document.getElementById("end1");
  const label1 = document.getElementById("label1");

  const day2 = document.getElementById("day2");
  const start2 = document.getElementById("start2");
  const end2 = document.getElementById("end2");
  const label2 = document.getElementById("label2");

  const day3 = document.getElementById("day3");
  const start3 = document.getElementById("start3");
  const end3 = document.getElementById("end3");
  const label3 = document.getElementById("label3");

  const day4 = document.getElementById("day4");
  const start4 = document.getElementById("start4");
  const end4 = document.getElementById("end4");
  const label4 = document.getElementById("label4");

  const day5 = document.getElementById("day5");
  const start5 = document.getElementById("start5");
  const end5 = document.getElementById("end5");
  const label5 = document.getElementById("label5");

  const day6 = document.getElementById("day6");
  const start6 = document.getElementById("start6");
  const end6 = document.getElementById("end6");
  const label6 = document.getElementById("label6");

  const day7 = document.getElementById("day7");
  const start7 = document.getElementById("start7");
  const end7 = document.getElementById("end7");
  const label7 = document.getElementById("label7");

  const day8 = document.getElementById("day8");
  const start8 = document.getElementById("start8");
  const end8 = document.getElementById("end8");
  const label8 = document.getElementById("label8");

  const day9 = document.getElementById("day9");
  const start9 = document.getElementById("start9");
  const end9 = document.getElementById("end9");
  const label9 = document.getElementById("label9");

  const day10 = document.getElementById("day10");
  const start10 = document.getElementById("start10");
  const end10 = document.getElementById("end10");
  const label10 = document.getElementById("label10");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // No live comma formatting needed for time inputs.

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

  function normalizeTimeString(raw) {
    if (raw === null || raw === undefined) return "";
    return String(raw).trim();
  }

  function parseTimeToMinutes(raw) {
    const s = normalizeTimeString(raw);
    if (!s) return null;

    const match = s.match(/^(\d{1,2})\s*:\s*(\d{1,2})$/);
    if (!match) return null;

    const hh = toNumber(match[1]);
    const mm = toNumber(match[2]);

    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
    if (hh < 0 || hh > 23) return null;
    if (mm < 0 || mm > 59) return null;

    return hh * 60 + mm;
  }

  function minutesToHoursMinutes(mins) {
    const safe = Math.max(0, Math.round(mins));
    const h = Math.floor(safe / 60);
    const m = safe % 60;
    const mm = String(m).padStart(2, "0");
    return h + "h " + mm + "m";
  }

  function minutesToDecimalHours(mins) {
    return mins / 60;
  }

  function getWakingMinutes() {
    const defaultWake = "07:00";
    const defaultSleep = "23:00";

    const wakeStr = wakeTime ? normalizeTimeString(wakeTime.value) : "";
    const sleepStr = sleepTime ? normalizeTimeString(sleepTime.value) : "";

    const wakeMins = parseTimeToMinutes(wakeStr || defaultWake);
    const sleepMins = parseTimeToMinutes(sleepStr || defaultSleep);

    if (wakeMins === null || sleepMins === null) {
      return { minutes: 16 * 60, usedDefault: true, note: "Using default waking window (07:00 to 23:00)." };
    }

    let diff = sleepMins - wakeMins;
    if (diff <= 0) diff += 24 * 60;

    // Guard against obviously invalid ranges (must be between 1 hour and 23 hours)
    if (diff < 60 || diff > 23 * 60) {
      return { minutes: 16 * 60, usedDefault: true, note: "Wake and sleep times look unrealistic. Using default waking window (07:00 to 23:00)." };
    }

    const usedDefault = !(wakeStr && sleepStr);
    const note = usedDefault ? "Wake and sleep times not fully provided. Using defaults (07:00 to 23:00)." : "";
    return { minutes: diff, usedDefault: usedDefault, note: note };
  }

  function readBlocks() {
    const blocks = [];

    const sources = [
      { day: day1, start: start1, end: end1, label: label1, idx: 1 },
      { day: day2, start: start2, end: end2, label: label2, idx: 2 },
      { day: day3, start: start3, end: end3, label: label3, idx: 3 },
      { day: day4, start: start4, end: end4, label: label4, idx: 4 },
      { day: day5, start: start5, end: end5, label: label5, idx: 5 },
      { day: day6, start: start6, end: end6, label: label6, idx: 6 },
      { day: day7, start: start7, end: end7, label: label7, idx: 7 },
      { day: day8, start: start8, end: end8, label: label8, idx: 8 },
      { day: day9, start: start9, end: end9, label: label9, idx: 9 },
      { day: day10, start: start10, end: end10, label: label10, idx: 10 }
    ];

    for (let i = 0; i < sources.length; i++) {
      const src = sources[i];
      const d = src.day ? String(src.day.value || "").trim() : "";
      const s = src.start ? normalizeTimeString(src.start.value) : "";
      const e = src.end ? normalizeTimeString(src.end.value) : "";
      const l = src.label ? String(src.label.value || "").trim() : "";

      // If all empty, ignore row quietly
      if (!d && !s && !e && !l) continue;

      // If partially filled, still validate to help user
      if (!d) {
        setResultError("Block " + src.idx + ": select a day.");
        return null;
      }
      if (!s || !e) {
        setResultError("Block " + src.idx + ": enter both a start and end time (HH:MM).");
        return null;
      }

      const startMins = parseTimeToMinutes(s);
      const endMins = parseTimeToMinutes(e);

      if (startMins === null) {
        setResultError("Block " + src.idx + ": start time must be in HH:MM (24-hour) format.");
        return null;
      }
      if (endMins === null) {
        setResultError("Block " + src.idx + ": end time must be in HH:MM (24-hour) format.");
        return null;
      }

      let duration = endMins - startMins;
      let overnight = false;
      if (duration <= 0) {
        duration += 24 * 60;
        overnight = true;
      }

      if (duration < 5) {
        setResultError("Block " + src.idx + ": duration is too short. Enter a realistic end time.");
        return null;
      }
      if (duration > 24 * 60) {
        setResultError("Block " + src.idx + ": duration cannot exceed 24 hours.");
        return null;
      }

      blocks.push({
        idx: src.idx,
        day: d,
        startMins: startMins,
        endMins: endMins,
        startRaw: s,
        endRaw: e,
        label: l,
        overnight: overnight,
        durationMins: duration
      });
    }

    if (blocks.length === 0) {
      setResultError("Add at least one time block to build a weekly summary.");
      return null;
    }

    return blocks;
  }

  function groupByDay(blocks) {
    const map = {
      Mon: [],
      Tue: [],
      Wed: [],
      Thu: [],
      Fri: [],
      Sat: [],
      Sun: []
    };

    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      if (map[b.day]) map[b.day].push(b);
    }

    return map;
  }

  function detectConflicts(dayBlocks) {
    const conflicts = [];

    // Convert blocks into comparable intervals. Overnight blocks are treated as [start, start+duration] on a 0..1440+ scale.
    // This keeps conflict detection within the same "day" view. If user wants split, they can create two blocks.
    const intervals = dayBlocks.map(function (b) {
      const endAbs = b.startMins + b.durationMins;
      return {
        idx: b.idx,
        label: b.label,
        start: b.startMins,
        end: endAbs,
        startRaw: b.startRaw,
        endRaw: b.endRaw,
        overnight: b.overnight
      };
    });

    intervals.sort(function (a, b) {
      return a.start - b.start;
    });

    for (let i = 0; i < intervals.length - 1; i++) {
      const cur = intervals[i];
      const next = intervals[i + 1];
      if (next.start < cur.end) {
        conflicts.push({ a: cur, b: next });
      }
    }

    return conflicts;
  }

  function dayOrder() {
    return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      const blocks = readBlocks();
      if (!blocks) return;

      const waking = getWakingMinutes();
      const wakingMins = waking.minutes;

      const byDay = groupByDay(blocks);

      const perDayTotals = {};
      const perDayConflicts = {};
      const perDayListHtml = [];

      let weekTotalMins = 0;
      let busiestDay = "";
      let busiestMins = -1;

      const order = dayOrder();

      for (let d = 0; d < order.length; d++) {
        const dayKey = order[d];
        const list = byDay[dayKey] || [];

        let sum = 0;
        for (let i = 0; i < list.length; i++) sum += list[i].durationMins;

        perDayTotals[dayKey] = sum;
        weekTotalMins += sum;

        if (sum > busiestMins) {
          busiestMins = sum;
          busiestDay = dayKey;
        }

        const conflicts = detectConflicts(list);
        perDayConflicts[dayKey] = conflicts;

        const freeMins = wakingMins - sum;
        const freeLabel = freeMins >= 0 ? minutesToHoursMinutes(freeMins) : "-" + minutesToHoursMinutes(Math.abs(freeMins));

        perDayListHtml.push(
          "<li><strong>" +
            dayKey +
            ":</strong> " +
            minutesToHoursMinutes(sum) +
            " scheduled, " +
            freeLabel +
            " free (within waking hours)</li>"
        );
      }

      const weekHours = minutesToDecimalHours(weekTotalMins);
      const weekHoursFormatted = formatNumberTwoDecimals(weekHours);

      const avgPerDayMins = weekTotalMins / 7;
      const avgPerDayHoursFormatted = formatNumberTwoDecimals(minutesToDecimalHours(avgPerDayMins));

      // Build conflicts HTML
      const conflictLines = [];
      for (let d = 0; d < order.length; d++) {
        const dayKey = order[d];
        const conflicts = perDayConflicts[dayKey] || [];
        for (let i = 0; i < conflicts.length; i++) {
          const c = conflicts[i];
          const aName = c.a.label ? c.a.label : "Block " + c.a.idx;
          const bName = c.b.label ? c.b.label : "Block " + c.b.idx;

          conflictLines.push(
            "<li><strong>" +
              dayKey +
              ":</strong> " +
              aName +
              " (" +
              c.a.startRaw +
              " to " +
              c.a.endRaw +
              ") overlaps with " +
              bName +
              " (" +
              c.b.startRaw +
              " to " +
              c.b.endRaw +
              ").</li>"
          );
        }
      }

      const conflictHtml =
        conflictLines.length > 0
          ? "<ul>" + conflictLines.join("") + "</ul>"
          : "<p><strong>Conflicts:</strong> None detected.</p>";

      // Build block list summary (compact)
      const blocksSorted = blocks.slice().sort(function (a, b) {
        const dayIdx = order.indexOf(a.day) - order.indexOf(b.day);
        if (dayIdx !== 0) return dayIdx;
        return a.startMins - b.startMins;
      });

      const blockItems = blocksSorted.map(function (b) {
        const name = b.label ? b.label : "Block " + b.idx;
        const overnightNote = b.overnight ? " (overnight)" : "";
        return (
          "<li><strong>" +
          b.day +
          ":</strong> " +
          name +
          " (" +
          b.startRaw +
          " to " +
          b.endRaw +
          ")" +
          overnightNote +
          " = " +
          minutesToHoursMinutes(b.durationMins) +
          "</li>"
        );
      });

      const wakingNote = waking.note ? "<p><em>" + waking.note + "</em></p>" : "";

      const resultHtml =
        "<p><strong>Weekly scheduled time:</strong> " +
        weekHoursFormatted +
        " hours</p>" +
        "<p><strong>Average per day:</strong> " +
        avgPerDayHoursFormatted +
        " hours</p>" +
        "<p><strong>Busiest day:</strong> " +
        busiestDay +
        " (" +
        minutesToHoursMinutes(busiestMins) +
        " scheduled)</p>" +
        wakingNote +
        "<h3>Per-day summary</h3>" +
        "<ul>" +
        perDayListHtml.join("") +
        "</ul>" +
        "<h3>Conflicts</h3>" +
        conflictHtml +
        "<h3>Blocks included</h3>" +
        "<ul>" +
        blockItems.join("") +
        "</ul>";

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Weekly Schedule Planner - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
