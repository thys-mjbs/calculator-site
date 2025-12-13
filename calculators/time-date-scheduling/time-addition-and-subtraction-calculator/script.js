document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const operationSelect = document.getElementById("operation");
  const startDateInput = document.getElementById("startDate");
  const startTimeInput = document.getElementById("startTime");
  const daysInput = document.getElementById("days");
  const hoursInput = document.getElementById("hours");
  const minutesInput = document.getElementById("minutes");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(daysInput);
  attachLiveFormatting(hoursInput);
  attachLiveFormatting(minutesInput);

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
  // Helpers (calculator-specific, safe)
  // ------------------------------------------------------------
  function isValidDateString(yyyyMmDd) {
    if (typeof yyyyMmDd !== "string") return false;
    const m = yyyyMmDd.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return false;

    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);

    if (!Number.isInteger(y) || !Number.isInteger(mo) || !Number.isInteger(d)) return false;
    if (mo < 1 || mo > 12) return false;
    if (d < 1 || d > 31) return false;

    const dt = new Date(y, mo - 1, d);
    return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d;
  }

  function isValidTimeString(hhMm) {
    if (typeof hhMm !== "string") return false;
    const m = hhMm.trim().match(/^([01]\d|2[0-3]):([0-5]\d)$/);
    return !!m;
  }

  function parseLocalDateTime(dateStr, timeStr) {
    const parts = dateStr.trim().split("-");
    const y = Number(parts[0]);
    const mo = Number(parts[1]);
    const d = Number(parts[2]);

    const tparts = timeStr.trim().split(":");
    const hh = Number(tparts[0]);
    const mm = Number(tparts[1]);

    return new Date(y, mo - 1, d, hh, mm, 0, 0);
  }

  function pad2(n) {
    const v = Number(n);
    return v < 10 ? "0" + v : String(v);
  }

  function formatReadableDateTime(dt) {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayName = days[dt.getDay()];
    const yyyy = dt.getFullYear();
    const mm = pad2(dt.getMonth() + 1);
    const dd = pad2(dt.getDate());
    const hh = pad2(dt.getHours());
    const mi = pad2(dt.getMinutes());
    return `${dayName}, ${yyyy}-${mm}-${dd} ${hh}:${mi}`;
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      if (!operationSelect || !startDateInput || !startTimeInput || !daysInput || !hoursInput || !minutesInput) {
        return;
      }

      const op = operationSelect.value === "subtract" ? "subtract" : "add";
      const startDateStr = (startDateInput.value || "").trim();
      const startTimeStr = (startTimeInput.value || "").trim();

      if (!isValidDateString(startDateStr)) {
        setResultError("Enter a valid start date in YYYY-MM-DD format.");
        return;
      }
      if (!isValidTimeString(startTimeStr)) {
        setResultError("Enter a valid start time in HH:MM (24-hour) format.");
        return;
      }

      const days = toNumber(daysInput.value || "0");
      const hours = toNumber(hoursInput.value || "0");
      const minutes = toNumber(minutesInput.value || "0");

      if (!Number.isFinite(days) || !Number.isFinite(hours) || !Number.isFinite(minutes)) {
        setResultError("Enter valid numbers for days, hours, and minutes.");
        return;
      }
      if (days < 0 || hours < 0 || minutes < 0) {
        setResultError("Days, hours, and minutes must be 0 or higher.");
        return;
      }
      if (days === 0 && hours === 0 && minutes === 0) {
        const startDt = parseLocalDateTime(startDateStr, startTimeStr);
        const html = `
          <p><strong>Resulting date/time:</strong> ${formatReadableDateTime(startDt)}</p>
          <p><strong>Total duration:</strong> 0 minutes (0 seconds)</p>
        `;
        setResultSuccess(html);
        return;
      }

      const startDt = parseLocalDateTime(startDateStr, startTimeStr);
      if (!(startDt instanceof Date) || Number.isNaN(startDt.getTime())) {
        setResultError("Could not parse the start date/time. Please double-check your inputs.");
        return;
      }

      const totalMinutes = (days * 24 * 60) + (hours * 60) + minutes;
      const totalSeconds = totalMinutes * 60;

      const deltaMs = totalMinutes * 60 * 1000;
      const endMs = op === "subtract" ? (startDt.getTime() - deltaMs) : (startDt.getTime() + deltaMs);
      const endDt = new Date(endMs);

      const directionLabel = op === "subtract" ? "Subtracting" : "Adding";
      const html = `
        <p><strong>Start:</strong> ${formatReadableDateTime(startDt)}</p>
        <p><strong>${directionLabel}:</strong> ${formatNumberTwoDecimals(days)} days, ${formatNumberTwoDecimals(hours)} hours, ${formatNumberTwoDecimals(minutes)} minutes</p>
        <p><strong>Resulting date/time:</strong> ${formatReadableDateTime(endDt)}</p>
        <p><strong>Total duration:</strong> ${formatNumberTwoDecimals(totalMinutes)} minutes (${formatNumberTwoDecimals(totalSeconds)} seconds)</p>
      `;

      setResultSuccess(html);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Time Addition & Subtraction Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
