document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const modeSelect = document.getElementById("modeSelect");
  const wakeUpTime = document.getElementById("wakeUpTime");
  const bedTime = document.getElementById("bedTime");

  const fallAsleepMinutes = document.getElementById("fallAsleepMinutes");
  const cycleLengthMinutes = document.getElementById("cycleLengthMinutes");
  const minCycles = document.getElementById("minCycles");
  const maxCycles = document.getElementById("maxCycles");

  const modeBedtimeBlock = document.getElementById("modeBedtimeBlock");
  const modeWakeTimeBlock = document.getElementById("modeWakeTimeBlock");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(fallAsleepMinutes);
  attachLiveFormatting(cycleLengthMinutes);
  attachLiveFormatting(minCycles);
  attachLiveFormatting(maxCycles);

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
    if (modeBedtimeBlock) modeBedtimeBlock.classList.add("hidden");
    if (modeWakeTimeBlock) modeWakeTimeBlock.classList.add("hidden");

    if (mode === "bedtime") {
      if (modeBedtimeBlock) modeBedtimeBlock.classList.remove("hidden");
    } else if (mode === "wakeTime") {
      if (modeWakeTimeBlock) modeWakeTimeBlock.classList.remove("hidden");
    }

    clearResult();
  }

  if (modeSelect) {
    showMode(modeSelect.value);
    modeSelect.addEventListener("change", function () {
      showMode(modeSelect.value);
    });
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

  function parseTimeToMinutes(timeStr) {
    const raw = (timeStr || "").trim();
    const match = raw.match(/^(\d{1,2})\s*:\s*(\d{2})$/);
    if (!match) return null;

    const hh = Number(match[1]);
    const mm = Number(match[2]);

    if (!Number.isInteger(hh) || !Number.isInteger(mm)) return null;
    if (hh < 0 || hh > 23) return null;
    if (mm < 0 || mm > 59) return null;

    return hh * 60 + mm;
  }

  function minutesToTime(minutes) {
    let m = minutes % (24 * 60);
    if (m < 0) m += 24 * 60;

    const hh = Math.floor(m / 60);
    const mm = m % 60;

    const hhStr = String(hh).padStart(2, "0");
    const mmStr = String(mm).padStart(2, "0");
    return hhStr + ":" + mmStr;
  }

  function formatDurationMinutes(totalMinutes) {
    const mins = Math.max(0, Math.round(totalMinutes));
    const h = Math.floor(mins / 60);
    const m = mins % 60;

    if (h === 0) return m + " min";
    if (m === 0) return h + " hr";
    return h + " hr " + m + " min";
  }

  function clampInt(value, min, max, fallback) {
    if (!Number.isFinite(value)) return fallback;
    const v = Math.round(value);
    if (v < min) return min;
    if (v > max) return max;
    return v;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const mode = modeSelect ? modeSelect.value : "bedtime";

      const fallAsleep = toNumber(fallAsleepMinutes ? fallAsleepMinutes.value : "");
      const cycleLen = toNumber(cycleLengthMinutes ? cycleLengthMinutes.value : "");
      const minC = toNumber(minCycles ? minCycles.value : "");
      const maxC = toNumber(maxCycles ? maxCycles.value : "");

      const fallAsleepUsed = Number.isFinite(fallAsleep) && fallAsleep >= 0 ? fallAsleep : 15;
      const cycleLenUsed = Number.isFinite(cycleLen) && cycleLen > 0 ? cycleLen : 90;

      if (!validateNonNegative(fallAsleepUsed, "time to fall asleep (minutes)")) return;
      if (!validatePositive(cycleLenUsed, "sleep cycle length (minutes)")) return;

      const minCyclesUsed = clampInt(minC, 1, 10, 3);
      const maxCyclesUsed = clampInt(maxC, 1, 10, 6);

      if (minCyclesUsed > maxCyclesUsed) {
        setResultError("Minimum cycles must be less than or equal to maximum cycles.");
        return;
      }

      let anchorMinutes = null;
      let anchorLabel = "";
      let direction = "";

      if (mode === "bedtime") {
        if (!wakeUpTime) return;
        anchorMinutes = parseTimeToMinutes(wakeUpTime.value);
        anchorLabel = "Wake-up time";
        direction = "backward";
        if (anchorMinutes === null) {
          setResultError("Enter a valid wake-up time in 24-hour format (HH:MM), for example 07:00.");
          return;
        }
      } else if (mode === "wakeTime") {
        if (!bedTime) return;
        anchorMinutes = parseTimeToMinutes(bedTime.value);
        anchorLabel = "Bedtime";
        direction = "forward";
        if (anchorMinutes === null) {
          setResultError("Enter a valid bedtime in 24-hour format (HH:MM), for example 23:00.");
          return;
        }
      } else {
        setResultError("Choose what you want to calculate.");
        return;
      }

      const items = [];
      for (let cycles = maxCyclesUsed; cycles >= minCyclesUsed; cycles--) {
        const sleepOnly = cycles * cycleLenUsed;
        const totalFromBedToWake = sleepOnly + fallAsleepUsed;

        let targetMinutes;
        if (direction === "backward") {
          targetMinutes = anchorMinutes - totalFromBedToWake;
        } else {
          targetMinutes = anchorMinutes + totalFromBedToWake;
        }

        items.push({
          cycles: cycles,
          time: minutesToTime(targetMinutes),
          sleepOnly: sleepOnly,
          total: totalFromBedToWake
        });
      }

      const mainLine =
        mode === "bedtime"
          ? "<p><strong>" + anchorLabel + ":</strong> " + minutesToTime(anchorMinutes) + "</p>"
          : "<p><strong>" + anchorLabel + ":</strong> " + minutesToTime(anchorMinutes) + "</p>";

      const subLine =
        "<p><strong>Assumptions used:</strong> " +
        Math.round(cycleLenUsed) +
        " min per cycle, " +
        Math.round(fallAsleepUsed) +
        " min to fall asleep.</p>";

      const header =
        mode === "bedtime"
          ? "<p><strong>Recommended bedtimes:</strong></p>"
          : "<p><strong>Recommended wake-up times:</strong></p>";

      let listHtml = "<div class=\"result-list\">";
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        const sleepOnlyLabel = formatDurationMinutes(it.sleepOnly);
        const totalLabel = formatDurationMinutes(it.total);

        const timeLabel = it.time;
        const rowLabel =
          mode === "bedtime"
            ? "<strong>Bedtime:</strong> " + timeLabel
            : "<strong>Wake-up:</strong> " + timeLabel;

        listHtml +=
          "<p>" +
          rowLabel +
          "<br><span><strong>Cycles:</strong> " +
          it.cycles +
          " (" +
          sleepOnlyLabel +
          " asleep), plus " +
          Math.round(fallAsleepUsed) +
          " min to fall asleep (" +
          totalLabel +
          " total)</span></p>";
      }
      listHtml += "</div>";

      const guidance =
        "<p><strong>How to use this:</strong> Pick the option that fits your schedule. More cycles usually means more total sleep. If you cannot fit a full night, choose a whole number of cycles rather than a random duration.</p>";

      const resultHtml = mainLine + subLine + header + listHtml + guidance;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Sleep Cycle Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
