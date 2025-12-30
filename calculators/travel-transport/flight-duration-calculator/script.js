document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS
  // ------------------------------------------------------------
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  const departureDate = document.getElementById("departureDate");
  const departureTime = document.getElementById("departureTime");
  const departureOffset = document.getElementById("departureOffset");

  const arrivalDate = document.getElementById("arrivalDate");
  const arrivalTime = document.getElementById("arrivalTime");
  const arrivalOffset = document.getElementById("arrivalOffset");

  const extraMinutesInput = document.getElementById("extraMinutes");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Only the optional minutes field benefits from comma formatting
  attachLiveFormatting(extraMinutesInput);

  // ------------------------------------------------------------
  // 3) RESULT HELPERS
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
  // 4) PARSERS
  // ------------------------------------------------------------
  function parseDateParts(dateStr) {
    const s = (dateStr || "").trim();
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (!m) return null;
    const year = Number(m[1]);
    const month = Number(m[2]);
    const day = Number(m[3]);
    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
    if (month < 1 || month > 12) return null;
    if (day < 1 || day > 31) return null;
    return { year, month, day };
  }

  function parseTimeParts(timeStr) {
    const s = (timeStr || "").trim();
    const m = /^(\d{2}):(\d{2})$/.exec(s);
    if (!m) return null;
    const hour = Number(m[1]);
    const minute = Number(m[2]);
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
    if (hour < 0 || hour > 23) return null;
    if (minute < 0 || minute > 59) return null;
    return { hour, minute };
  }

  function parseUtcOffsetMinutes(offsetStr) {
    const s = (offsetStr || "").trim();
    const m = /^([+-])(\d{2}):(\d{2})$/.exec(s);
    if (!m) return null;

    const sign = m[1] === "-" ? -1 : 1;
    const hh = Number(m[2]);
    const mm = Number(m[3]);

    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
    if (hh < 0 || hh > 14) return null;
    if (mm < 0 || mm > 59) return null;

    const total = sign * (hh * 60 + mm);

    // Hard sanity check: real-world offsets are within about -12:00 to +14:00
    if (total < -12 * 60 || total > 14 * 60) return null;

    return total;
  }

  function utcMsFromLocal(dateParts, timeParts, offsetMinutes) {
    // Convert local timestamp at given offset into a UTC epoch ms
    const utcAssumingLocal = Date.UTC(
      dateParts.year,
      dateParts.month - 1,
      dateParts.day,
      timeParts.hour,
      timeParts.minute,
      0,
      0
    );

    return utcAssumingLocal - offsetMinutes * 60 * 1000;
  }

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function formatDateTimeFromUtc(utcMs, offsetMinutes) {
    const localMs = utcMs + offsetMinutes * 60 * 1000;
    const d = new Date(localMs);

    const year = d.getUTCFullYear();
    const month = d.getUTCMonth() + 1;
    const day = d.getUTCDate();
    const hour = d.getUTCHours();
    const minute = d.getUTCMinutes();

    return (
      year +
      "-" +
      pad2(month) +
      "-" +
      pad2(day) +
      " " +
      pad2(hour) +
      ":" +
      pad2(minute)
    );
  }

  function formatDuration(minutesTotal) {
    const total = Math.round(minutesTotal);
    const sign = total < 0 ? "-" : "";
    const abs = Math.abs(total);

    const hours = Math.floor(abs / 60);
    const minutes = abs % 60;

    return sign + hours + "h " + pad2(minutes) + "m";
  }

  // ------------------------------------------------------------
  // 5) MAIN CALCULATE HANDLER
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      if (
        !departureDate || !departureTime || !departureOffset ||
        !arrivalDate || !arrivalTime || !arrivalOffset
      ) {
        setResultError("This calculator is missing required input fields. Please refresh the page.");
        return;
      }

      const depDate = parseDateParts(departureDate.value);
      if (!depDate) {
        setResultError("Enter a valid departure date in YYYY-MM-DD format.");
        return;
      }

      const depTime = parseTimeParts(departureTime.value);
      if (!depTime) {
        setResultError("Enter a valid departure time in HH:MM (24-hour) format.");
        return;
      }

      const depOffsetMin = parseUtcOffsetMinutes(departureOffset.value);
      if (depOffsetMin === null) {
        setResultError("Enter a valid departure UTC offset like +02:00 or -05:00.");
        return;
      }

      const arrDate = parseDateParts(arrivalDate.value);
      if (!arrDate) {
        setResultError("Enter a valid arrival date in YYYY-MM-DD format.");
        return;
      }

      const arrTime = parseTimeParts(arrivalTime.value);
      if (!arrTime) {
        setResultError("Enter a valid arrival time in HH:MM (24-hour) format.");
        return;
      }

      const arrOffsetMin = parseUtcOffsetMinutes(arrivalOffset.value);
      if (arrOffsetMin === null) {
        setResultError("Enter a valid arrival UTC offset like +02:00 or -05:00.");
        return;
      }

      const extraMinutes = extraMinutesInput ? toNumber(extraMinutesInput.value) : 0;
      if (!Number.isFinite(extraMinutes) || extraMinutes < 0) {
        setResultError("Enter a valid extra minutes value (0 or higher).");
        return;
      }

      const depUtcMs = utcMsFromLocal(depDate, depTime, depOffsetMin);
      const arrUtcMs = utcMsFromLocal(arrDate, arrTime, arrOffsetMin);

      const diffMinutes = (arrUtcMs - depUtcMs) / (60 * 1000);

      if (!Number.isFinite(diffMinutes)) {
        setResultError("Unable to calculate. Please check your inputs.");
        return;
      }

      if (diffMinutes < 0) {
        setResultError(
          "Your arrival time is earlier than your departure time after time zone conversion. Check the arrival date and both UTC offsets."
        );
        return;
      }

      // Practical outputs
      const scheduledMinutes = Math.round(diffMinutes);
      const adjustedMinutes = Math.round(diffMinutes + extraMinutes);

      const scheduledHoursDecimal = scheduledMinutes / 60;
      const adjustedHoursDecimal = adjustedMinutes / 60;

      const tzDiffMinutes = arrOffsetMin - depOffsetMin;
      const tzDiffHours = tzDiffMinutes / 60;

      const arrivalInDepartureTz = formatDateTimeFromUtc(arrUtcMs, depOffsetMin);
      const departureInArrivalTz = formatDateTimeFromUtc(depUtcMs, arrOffsetMin);

      const tzDirection =
        tzDiffMinutes === 0
          ? "Same time zone"
          : tzDiffMinutes > 0
          ? "Arrival time zone is ahead"
          : "Arrival time zone is behind";

      const tzDiffLabel =
        tzDiffMinutes === 0
          ? "0h"
          : (tzDiffMinutes > 0 ? "+" : "-") + Math.abs(tzDiffHours) + "h";

      const resultHtml = `
        <p><strong>Scheduled duration:</strong> ${formatDuration(scheduledMinutes)} (${formatNumberTwoDecimals(scheduledHoursDecimal)} hours)</p>
        <p><strong>Adjusted duration (with extra minutes):</strong> ${formatDuration(adjustedMinutes)} (${formatNumberTwoDecimals(adjustedHoursDecimal)} hours)</p>
        <p><strong>Time zone difference:</strong> ${tzDirection} (${tzDiffLabel})</p>
        <p><strong>Arrival time in departure time zone:</strong> ${arrivalInDepartureTz}</p>
        <p><strong>Departure time in arrival time zone:</strong> ${departureInArrivalTz}</p>
      `;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 6) WHATSAPP SHARE
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Flight Duration Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
