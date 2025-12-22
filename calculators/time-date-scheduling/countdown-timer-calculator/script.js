document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const targetDateInput = document.getElementById("targetDate");
  const targetTimeInput = document.getElementById("targetTime");
  const startDateInput = document.getElementById("startDate");
  const startTimeInput = document.getElementById("startTime");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // No comma-formatting needed for date/time fields.

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
  function isValidDateYYYYMMDD(value) {
    if (typeof value !== "string") return false;
    const v = value.trim();
    const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return false;

    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);

    if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return false;
    if (mo < 1 || mo > 12) return false;

    const maxDay = new Date(y, mo, 0).getDate();
    if (d < 1 || d > maxDay) return false;

    return true;
  }

  function isValidTimeHHMM(value) {
    if (typeof value !== "string") return false;
    const v = value.trim();
    if (v === "") return true; // optional
    const m = v.match(/^(\d{2}):(\d{2})$/);
    if (!m) return false;

    const hh = Number(m[1]);
    const mm = Number(m[2]);

    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return false;
    if (hh < 0 || hh > 23) return false;
    if (mm < 0 || mm > 59) return false;

    return true;
  }

  function buildLocalDateFromInputs(dateStr, timeStr) {
    const date = (dateStr || "").trim();
    const time = (timeStr || "").trim();

    if (!isValidDateYYYYMMDD(date)) return null;
    if (!isValidTimeHHMM(time)) return null;

    const t = time === "" ? "00:00" : time;
    const isoLocal = date + "T" + t + ":00";
    const dt = new Date(isoLocal);

    if (!Number.isFinite(dt.getTime())) return null;
    return dt;
  }

  function formatDuration(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return { days, hours, minutes, seconds, totalSeconds };
  }

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  let countdownIntervalId = null;

  function stopCountdown() {
    if (countdownIntervalId) {
      clearInterval(countdownIntervalId);
      countdownIntervalId = null;
    }
  }

  function renderCountdown(targetDt, startDt) {
    const now = new Date();
    const remainingMs = targetDt.getTime() - now.getTime();

    if (remainingMs <= 0) {
      stopCountdown();
      const htmlDone =
        `<p><strong>Target reached.</strong></p>` +
        `<p><strong>Target moment:</strong> ${targetDt.toLocaleString()}</p>`;
      setResultSuccess(htmlDone);
      return;
    }

    const d = formatDuration(remainingMs);
    const totalHours = remainingMs / 3600000;

    let progressHtml = "";
    if (startDt) {
      const totalWindowMs = targetDt.getTime() - startDt.getTime();
      const elapsedMs = now.getTime() - startDt.getTime();

      if (totalWindowMs > 0) {
        const elapsedClamped = Math.min(Math.max(elapsedMs, 0), totalWindowMs);
        const pct = (elapsedClamped / totalWindowMs) * 100;

        const elapsed = formatDuration(elapsedClamped);
        const remainingInWindow = formatDuration(totalWindowMs - elapsedClamped);

        progressHtml =
          `<p><strong>Progress (start → target):</strong> ${pct.toFixed(1)}%</p>` +
          `<p><strong>Elapsed since start:</strong> ${elapsed.days}d ${pad2(elapsed.hours)}h ${pad2(elapsed.minutes)}m ${pad2(elapsed.seconds)}s</p>` +
          `<p><strong>Remaining in window:</strong> ${remainingInWindow.days}d ${pad2(remainingInWindow.hours)}h ${pad2(remainingInWindow.minutes)}m ${pad2(remainingInWindow.seconds)}s</p>`;
      }
    }

    const html =
      `<p><strong>Time remaining:</strong> ${d.days}d ${pad2(d.hours)}h ${pad2(d.minutes)}m ${pad2(d.seconds)}s</p>` +
      `<p><strong>Target moment:</strong> ${targetDt.toLocaleString()}</p>` +
      `<p><strong>Total hours remaining:</strong> ${formatNumberTwoDecimals(totalHours)}</p>` +
      progressHtml;

    setResultSuccess(html);
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      stopCountdown();
      clearResult();

      if (!targetDateInput || !targetTimeInput) return;

      const targetDateStr = targetDateInput.value || "";
      const targetTimeStr = targetTimeInput.value || "";

      if (!isValidDateYYYYMMDD(targetDateStr.trim())) {
        setResultError("Enter a valid target date in YYYY-MM-DD format.");
        return;
      }

      if (!isValidTimeHHMM(targetTimeStr)) {
        setResultError("Enter a valid target time in HH:MM format, or leave it blank.");
        return;
      }

      const targetDt = buildLocalDateFromInputs(targetDateStr, targetTimeStr);
      if (!targetDt) {
        setResultError("Enter a valid target date and time.");
        return;
      }

      const now = new Date();
      if (targetDt.getTime() <= now.getTime()) {
        setResultError("Target date and time must be in the future.");
        return;
      }

      // Advanced: optional start moment
      let startDt = null;
      const startDateStr = startDateInput ? startDateInput.value : "";
      const startTimeStr = startTimeInput ? startTimeInput.value : "";

      const hasAnyStart = (startDateStr || "").trim() !== "" || (startTimeStr || "").trim() !== "";
      if (hasAnyStart) {
        if (!isValidDateYYYYMMDD((startDateStr || "").trim())) {
          setResultError("If you use Advanced start inputs, enter a valid start date in YYYY-MM-DD format.");
          return;
        }
        if (!isValidTimeHHMM(startTimeStr || "")) {
          setResultError("If you use Advanced start inputs, enter a valid start time in HH:MM format, or leave it blank.");
          return;
        }

        startDt = buildLocalDateFromInputs(startDateStr, startTimeStr);
        if (!startDt) {
          setResultError("Enter a valid start date and time, or leave Advanced inputs blank.");
          return;
        }

        if (startDt.getTime() >= targetDt.getTime()) {
          setResultError("Start date and time must be before the target date and time.");
          return;
        }
      }

      // Initial render + live updates
      renderCountdown(targetDt, startDt);

      countdownIntervalId = setInterval(function () {
        renderCountdown(targetDt, startDt);
      }, 1000);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Countdown Timer Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
