document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const availableHours = document.getElementById("availableHours");
  const availableMinutes = document.getElementById("availableMinutes");
  const targetSessions = document.getElementById("targetSessions");

  const workMinutes = document.getElementById("workMinutes");
  const shortBreakMinutes = document.getElementById("shortBreakMinutes");
  const longBreakMinutes = document.getElementById("longBreakMinutes");
  const longBreakEvery = document.getElementById("longBreakEvery");
  const startTime = document.getElementById("startTime");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(availableHours);
  attachLiveFormatting(availableMinutes);
  attachLiveFormatting(targetSessions);
  attachLiveFormatting(workMinutes);
  attachLiveFormatting(shortBreakMinutes);
  attachLiveFormatting(longBreakMinutes);
  attachLiveFormatting(longBreakEvery);

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
  function clampToInt(value) {
    if (!Number.isFinite(value)) return NaN;
    return Math.floor(value);
  }

  function minutesToHhMm(totalMinutes) {
    const m = Math.max(0, clampToInt(totalMinutes));
    const hh = Math.floor(m / 60);
    const mm = m % 60;
    return { hh, mm };
  }

  function pad2(n) {
    const v = clampToInt(n);
    return v < 10 ? "0" + v : String(v);
  }

  function parseStartTimeToMinutes(timeStr) {
    if (!timeStr) return null;
    const trimmed = String(timeStr).trim();
    if (!trimmed) return null;

    const parts = trimmed.split(":");
    if (parts.length !== 2) return null;

    const h = toNumber(parts[0]);
    const m = toNumber(parts[1]);

    if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
    const hh = clampToInt(h);
    const mm = clampToInt(m);

    if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
    return hh * 60 + mm;
  }

  function addMinutesToClock(startMinutes, addMinutes) {
    const total = (startMinutes + clampToInt(addMinutes)) % (24 * 60);
    const normalized = total < 0 ? total + 24 * 60 : total;
    const hh = Math.floor(normalized / 60);
    const mm = normalized % 60;
    return pad2(hh) + ":" + pad2(mm);
  }

  function computeRequiredMinutesForSessions(
    sessions,
    focusLen,
    shortBreakLen,
    longBreakLen,
    longEvery
  ) {
    const n = clampToInt(sessions);
    if (!Number.isFinite(n) || n <= 0) return NaN;

    let total = n * focusLen;
    let shortCount = 0;
    let longCount = 0;

    for (let i = 1; i <= n - 1; i++) {
      const isLong = longEvery > 0 && i % longEvery === 0;
      if (isLong) {
        total += longBreakLen;
        longCount += 1;
      } else {
        total += shortBreakLen;
        shortCount += 1;
      }
    }

    return { totalMinutes: total, shortBreaks: shortCount, longBreaks: longCount };
  }

  function computeMaxSessionsWithinMinutes(
    availableTotal,
    focusLen,
    shortBreakLen,
    longBreakLen,
    longEvery
  ) {
    let remaining = availableTotal;

    let sessions = 0;
    let shortCount = 0;
    let longCount = 0;

    while (true) {
      if (remaining < focusLen) break;

      // Do a full focus session
      remaining -= focusLen;
      sessions += 1;

      // If no time left, stop
      if (remaining <= 0) break;

      // Determine break after this session, but only take it if another full focus session can follow
      const isLong = longEvery > 0 && sessions % longEvery === 0;
      const breakLen = isLong ? longBreakLen : shortBreakLen;

      if (remaining >= breakLen + focusLen) {
        remaining -= breakLen;
        if (isLong) longCount += 1;
        else shortCount += 1;
      } else {
        break;
      }
    }

    const used = availableTotal - remaining;
    return {
      sessions,
      usedMinutes: used,
      remainingMinutes: remaining,
      shortBreaks: shortCount,
      longBreaks: longCount
    };
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const h = toNumber(availableHours ? availableHours.value : "");
      const m = toNumber(availableMinutes ? availableMinutes.value : "");

      const hours = Number.isFinite(h) ? clampToInt(h) : 0;
      const mins = Number.isFinite(m) ? clampToInt(m) : 0;

      const availableTotal = hours * 60 + mins;

      // Defaults for Advanced settings
      const focusDefault = 25;
      const shortDefault = 5;
      const longDefault = 15;
      const longEveryDefault = 4;

      const focusLenRaw = toNumber(workMinutes ? workMinutes.value : "");
      const shortLenRaw = toNumber(shortBreakMinutes ? shortBreakMinutes.value : "");
      const longLenRaw = toNumber(longBreakMinutes ? longBreakMinutes.value : "");
      const longEveryRaw = toNumber(longBreakEvery ? longBreakEvery.value : "");

      const focusLen = Number.isFinite(focusLenRaw) && focusLenRaw > 0 ? clampToInt(focusLenRaw) : focusDefault;
      const shortLen = Number.isFinite(shortLenRaw) && shortLenRaw >= 0 ? clampToInt(shortLenRaw) : shortDefault;
      const longLen = Number.isFinite(longLenRaw) && longLenRaw >= 0 ? clampToInt(longLenRaw) : longDefault;
      const longEvery = Number.isFinite(longEveryRaw) && longEveryRaw > 0 ? clampToInt(longEveryRaw) : longEveryDefault;

      const targetRaw = toNumber(targetSessions ? targetSessions.value : "");
      const target = Number.isFinite(targetRaw) && targetRaw > 0 ? clampToInt(targetRaw) : null;

      // Validation
      if (!validatePositive(availableTotal, "available time")) return;

      if (!validatePositive(focusLen, "focus session length (minutes)")) return;
      if (!validateNonNegative(shortLen, "short break length (minutes)")) return;
      if (!validateNonNegative(longLen, "long break length (minutes)")) return;
      if (!validatePositive(longEvery, "long break interval (sessions)")) return;

      // Calculation logic (max sessions that fit)
      const fit = computeMaxSessionsWithinMinutes(availableTotal, focusLen, shortLen, longLen, longEvery);

      if (!Number.isFinite(fit.sessions) || fit.sessions <= 0) {
        const minNeeded = focusLen;
        setResultError(
          "You do not have enough time for a full focus session. Increase available time to at least " +
            minNeeded +
            " minutes, or reduce the focus session length in Advanced settings."
        );
        return;
      }

      const focusTotal = fit.sessions * focusLen;
      const breakTotal = fit.usedMinutes - focusTotal;

      const usedHhMm = minutesToHhMm(fit.usedMinutes);
      const remHhMm = minutesToHhMm(fit.remainingMinutes);

      // Optional: target session requirement
      let targetHtml = "";
      if (target && target > 0) {
        const req = computeRequiredMinutesForSessions(target, focusLen, shortLen, longLen, longEvery);
        if (req && Number.isFinite(req.totalMinutes)) {
          const reqHhMm = minutesToHhMm(req.totalMinutes);
          const delta = req.totalMinutes - availableTotal;
          const deltaAbs = minutesToHhMm(Math.abs(delta));

          const status =
            delta <= 0
              ? "You have enough time for your target."
              : "You do not have enough time for your target.";

          const deltaText =
            delta === 0
              ? "Exact fit."
              : (delta <= 0 ? "Time buffer: " : "Extra time needed: ") +
                deltaAbs.hh +
                "h " +
                deltaAbs.mm +
                "m";

          targetHtml =
            `<div class="result-row"><strong>Target check:</strong> ${target} sessions require ` +
            `${reqHhMm.hh}h ${reqHhMm.mm}m total (includes ${req.shortBreaks} short breaks, ${req.longBreaks} long breaks). ` +
            `${status} ${deltaText}</div>`;
        }
      }

      // Optional: finish time
      let timeHtml = "";
      const startMinutes = parseStartTimeToMinutes(startTime ? startTime.value : "");
      if (startMinutes !== null) {
        const finish = addMinutesToClock(startMinutes, fit.usedMinutes);
        timeHtml = `<div class="result-row"><strong>Estimated finish time:</strong> ${finish}</div>`;
      } else if (startTime && String(startTime.value || "").trim() !== "") {
        setResultError("Enter a valid start time in 24-hour HH:MM format (for example 09:30).");
        return;
      }

      // Build output HTML
      const resultHtml =
        `<div class="result-row"><strong>Max full Pomodoro sessions:</strong> ${fit.sessions}</div>` +
        `<div class="result-row"><strong>Total focus time:</strong> ${Math.floor(focusTotal / 60)}h ${focusTotal % 60}m</div>` +
        `<div class="result-row"><strong>Total break time included:</strong> ${Math.floor(breakTotal / 60)}h ${breakTotal % 60}m</div>` +
        `<div class="result-row"><strong>Break breakdown:</strong> ${fit.shortBreaks} short, ${fit.longBreaks} long</div>` +
        `<div class="result-row"><strong>Schedule time used:</strong> ${usedHhMm.hh}h ${usedHhMm.mm}m</div>` +
        `<div class="result-row"><strong>Time left over:</strong> ${remHhMm.hh}h ${remHhMm.mm}m</div>` +
        timeHtml +
        targetHtml +
        `<div class="result-row"><strong>Settings used:</strong> focus ${focusLen}m, short break ${shortLen}m, long break ${longLen}m every ${longEvery} sessions</div>`;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Pomodoro Session Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
