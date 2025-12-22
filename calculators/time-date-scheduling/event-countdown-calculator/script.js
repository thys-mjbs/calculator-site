document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS
  // ------------------------------------------------------------
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  const eventNameInput = document.getElementById("eventName");
  const eventDateInput = document.getElementById("eventDate");
  const eventTimeInput = document.getElementById("eventTime");

  const useCustomStart = document.getElementById("useCustomStart");
  const advancedBlock = document.getElementById("advancedBlock");
  const startDateInput = document.getElementById("startDate");
  const startTimeInput = document.getElementById("startTime");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (NOT USED FOR DATE/TIME TEXT FIELDS)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }
  // Intentionally not attaching comma-formatting for date/time inputs.

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
  // 4) UI TOGGLES (ADVANCED BLOCK)
  // ------------------------------------------------------------
  function setAdvancedVisibility() {
    if (!advancedBlock || !useCustomStart) return;
    if (useCustomStart.checked) {
      advancedBlock.classList.remove("hidden");
    } else {
      advancedBlock.classList.add("hidden");
    }
    clearResult();
  }

  if (useCustomStart) {
    setAdvancedVisibility();
    useCustomStart.addEventListener("change", setAdvancedVisibility);
  }

  // ------------------------------------------------------------
  // 5) DATE/TIME PARSING HELPERS
  // ------------------------------------------------------------
  function isValidDateParts(y, m, d) {
    if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return false;
    if (y < 1900 || y > 2100) return false;
    if (m < 1 || m > 12) return false;
    if (d < 1 || d > 31) return false;

    const test = new Date(y, m - 1, d);
    return (
      test.getFullYear() === y &&
      test.getMonth() === m - 1 &&
      test.getDate() === d
    );
  }

  function parseDateString(dateStr) {
    const s = String(dateStr || "").trim();
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;

    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);

    if (!isValidDateParts(y, mo, d)) return null;
    return { y: y, mo: mo, d: d };
  }

  function parseTimeString(timeStr, defaultHour, defaultMinute) {
    const s = String(timeStr || "").trim();
    if (!s) return { hh: defaultHour, mm: defaultMinute };

    const m = s.match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return null;

    const hh = Number(m[1]);
    const mm = Number(m[2]);

    if (!Number.isInteger(hh) || !Number.isInteger(mm)) return null;
    if (hh < 0 || hh > 23) return null;
    if (mm < 0 || mm > 59) return null;

    return { hh: hh, mm: mm };
  }

  function buildLocalDateTime(dateParts, timeParts) {
    return new Date(
      dateParts.y,
      dateParts.mo - 1,
      dateParts.d,
      timeParts.hh,
      timeParts.mm,
      0,
      0
    );
  }

  function two(n) {
    return String(n).padStart(2, "0");
  }

  function formatLocalDateTime(dt) {
    const y = dt.getFullYear();
    const m = two(dt.getMonth() + 1);
    const d = two(dt.getDate());
    const hh = two(dt.getHours());
    const mm = two(dt.getMinutes());
    return y + "-" + m + "-" + d + " " + hh + ":" + mm;
  }

  function breakdownSeconds(totalSeconds) {
    const abs = Math.abs(totalSeconds);
    const days = Math.floor(abs / 86400);
    const rem1 = abs - days * 86400;
    const hours = Math.floor(rem1 / 3600);
    const rem2 = rem1 - hours * 3600;
    const minutes = Math.floor(rem2 / 60);
    const seconds = rem2 - minutes * 60;

    return {
      isNegative: totalSeconds < 0,
      days: days,
      hours: hours,
      minutes: minutes,
      seconds: seconds
    };
  }

  let liveTimerId = null;

  function stopLiveTimer() {
    if (liveTimerId) {
      clearInterval(liveTimerId);
      liveTimerId = null;
    }
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      stopLiveTimer();

      if (!eventDateInput) return;

      const eventDateParts = parseDateString(eventDateInput.value);
      if (!eventDateParts) {
        setResultError("Enter a valid event date in the format YYYY-MM-DD.");
        return;
      }

      const eventTimeParts = parseTimeString(eventTimeInput ? eventTimeInput.value : "", 0, 0);
      if (!eventTimeParts) {
        setResultError("Enter a valid event time in the format HH:MM (24-hour), or leave it blank.");
        return;
      }

      const eventDateTime = buildLocalDateTime(eventDateParts, eventTimeParts);
      if (!Number.isFinite(eventDateTime.getTime())) {
        setResultError("Enter a valid event date and time.");
        return;
      }

      // Reference time: now by default, or advanced custom start
      let referenceDateTime = new Date();

      if (useCustomStart && useCustomStart.checked) {
        const rawStartDate = startDateInput ? String(startDateInput.value || "").trim() : "";
        const rawStartTime = startTimeInput ? String(startTimeInput.value || "").trim() : "";

        if (!rawStartDate && !rawStartTime) {
          referenceDateTime = new Date();
        } else {
          const baseDateParts = rawStartDate ? parseDateString(rawStartDate) : null;
          if (rawStartDate && !baseDateParts) {
            setResultError("Enter a valid start date in the format YYYY-MM-DD, or leave it blank.");
            return;
          }

          const baseTimeParts = parseTimeString(rawStartTime, 0, 0);
          if (rawStartTime && !baseTimeParts) {
            setResultError("Enter a valid start time in the format HH:MM (24-hour), or leave it blank.");
            return;
          }

          if (baseDateParts) {
            referenceDateTime = buildLocalDateTime(baseDateParts, baseTimeParts || { hh: 0, mm: 0 });
          } else {
            // No start date given: use today's date but custom time if provided
            const now = new Date();
            const y = now.getFullYear();
            const mo = now.getMonth() + 1;
            const d = now.getDate();
            referenceDateTime = buildLocalDateTime({ y: y, mo: mo, d: d }, baseTimeParts || { hh: 0, mm: 0 });
          }

          if (!Number.isFinite(referenceDateTime.getTime())) {
            setResultError("Enter a valid start date and time, or leave the advanced section blank.");
            return;
          }
        }
      }

      // Guard: if event equals reference, show zeroed output
      const render = function () {
        const nowRef = (useCustomStart && useCustomStart.checked) ? referenceDateTime : new Date();
        const diffMs = eventDateTime.getTime() - nowRef.getTime();
        const diffSeconds = Math.round(diffMs / 1000);

        const bd = breakdownSeconds(diffSeconds);
        const isPast = diffSeconds < 0;

        const totalSecondsAbs = Math.abs(diffSeconds);
        const totalMinutesAbs = Math.floor(totalSecondsAbs / 60);
        const totalHoursAbs = Math.floor(totalSecondsAbs / 3600);
        const totalDaysAbs = totalSecondsAbs / 86400;

        const nameRaw = eventNameInput ? String(eventNameInput.value || "").trim() : "";
        const displayName = nameRaw ? nameRaw : "Your event";

        const primaryLabel = isPast ? "Time since" : "Time remaining";
        const refLabel = (useCustomStart && useCustomStart.checked) ? "Reference time" : "Current time";

        let urgencyNote = "";
        if (!isPast) {
          if (totalSecondsAbs === 0) {
            urgencyNote = "It is happening right now.";
          } else if (totalSecondsAbs < 3600) {
            urgencyNote = "Less than 1 hour left. If you need preparation time, act now.";
          } else if (totalSecondsAbs < 86400) {
            urgencyNote = "Less than 24 hours left. Plan your final steps and buffer time.";
          } else if (totalSecondsAbs < 7 * 86400) {
            urgencyNote = "Less than 7 days left. Confirm key details early to avoid last-minute risk.";
          }
        }

        const resultHtml =
          `<div class="result-grid">
            <div class="result-row">
              <span class="result-label">${displayName}</span>
              <span class="result-value">${primaryLabel}</span>
            </div>

            <div class="result-row">
              <span class="result-label">Event date and time</span>
              <span class="result-value">${formatLocalDateTime(eventDateTime)}</span>
            </div>

            <div class="result-row">
              <span class="result-label">${refLabel}</span>
              <span class="result-value">${formatLocalDateTime(nowRef)}</span>
            </div>

            <div class="result-row">
              <span class="result-label">Days</span>
              <span class="result-value">${bd.days}</span>
            </div>

            <div class="result-row">
              <span class="result-label">Hours</span>
              <span class="result-value">${bd.hours}</span>
            </div>

            <div class="result-row">
              <span class="result-label">Minutes</span>
              <span class="result-value">${bd.minutes}</span>
            </div>

            <div class="result-row">
              <span class="result-label">Seconds</span>
              <span class="result-value">${bd.seconds}</span>
            </div>

            <div class="result-row">
              <span class="result-label">Total hours</span>
              <span class="result-value">${formatNumberTwoDecimals(totalHoursAbs)}</span>
            </div>

            <div class="result-row">
              <span class="result-label">Total minutes</span>
              <span class="result-value">${formatNumberTwoDecimals(totalMinutesAbs)}</span>
            </div>

            <div class="result-row">
              <span class="result-label">Total days</span>
              <span class="result-value">${formatNumberTwoDecimals(totalDaysAbs)}</span>
            </div>
          </div>
          ${urgencyNote ? `<p style="margin-top:10px">${urgencyNote}</p>` : ""}`;

        setResultSuccess(resultHtml);
      };

      render();

      // Live update only when using "now" as the reference
      if (!(useCustomStart && useCustomStart.checked)) {
        liveTimerId = setInterval(render, 1000);
      }
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Event Countdown Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
