document.addEventListener("DOMContentLoaded", function () {
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  const departureDateTime = document.getElementById("departureDateTime");
  const distanceValue = document.getElementById("distanceValue");
  const distanceUnit = document.getElementById("distanceUnit");
  const speedValue = document.getElementById("speedValue");
  const speedUnit = document.getElementById("speedUnit");
  const stopMinutes = document.getElementById("stopMinutes");
  const delayPercent = document.getElementById("delayPercent");

  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(distanceValue);
  attachLiveFormatting(speedValue);
  attachLiveFormatting(stopMinutes);
  attachLiveFormatting(delayPercent);

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

  function parseDeparture(text) {
    if (!text) return null;

    const trimmed = String(text).trim();

    const isoTry = new Date(trimmed);
    if (Number.isFinite(isoTry.getTime())) return isoTry;

    const normalized = trimmed.replace("T", " ");
    const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/);
    if (!match) return null;

    const year = Number(match[1]);
    const monthIndex = Number(match[2]) - 1;
    const day = Number(match[3]);
    const hour = Number(match[4]);
    const minute = Number(match[5]);

    const d = new Date(year, monthIndex, day, hour, minute, 0, 0);
    if (!Number.isFinite(d.getTime())) return null;
    return d;
  }

  function toKilometers(distance, unit) {
    if (unit === "mi") return distance * 1.609344;
    return distance;
  }

  function toKmPerHour(speed, unit) {
    if (unit === "mph") return speed * 1.609344;
    return speed;
  }

  function formatDurationHoursMinutes(totalMinutes) {
    const minutes = Math.max(0, Math.round(totalMinutes));
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const hh = String(h);
    const mm = String(m).padStart(2, "0");
    return hh + "h " + mm + "m";
  }

  function formatDateTimeLocal(dateObj) {
    try {
      return dateObj.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) {
      return String(dateObj);
    }
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      if (
        !departureDateTime ||
        !distanceValue ||
        !distanceUnit ||
        !speedValue ||
        !speedUnit ||
        !stopMinutes ||
        !delayPercent
      ) {
        return;
      }

      const depart = parseDeparture(departureDateTime.value);
      if (!depart) {
        setResultError("Enter a valid departure date and time (for example: 2025-12-30 14:30).");
        return;
      }

      const distRaw = toNumber(distanceValue.value);
      const speedRaw = toNumber(speedValue.value);
      const stopsRaw = toNumber(stopMinutes.value);
      const delayRaw = toNumber(delayPercent.value);

      if (!validatePositive(distRaw, "distance")) return;
      if (!validatePositive(speedRaw, "average speed")) return;
      if (!validateNonNegative(stopsRaw, "stops (minutes)")) return;
      if (!validateNonNegative(delayRaw, "delay percent")) return;

      if (delayRaw > 300) {
        setResultError("Delay percent is unusually high. Enter a smaller value (0 to 300).");
        return;
      }

      const distanceKm = toKilometers(distRaw, distanceUnit.value);
      const speedKmh = toKmPerHour(speedRaw, speedUnit.value);

      const drivingHoursBase = distanceKm / speedKmh;
      if (!Number.isFinite(drivingHoursBase) || drivingHoursBase <= 0) {
        setResultError("Enter distance and speed values that produce a valid travel time.");
        return;
      }

      const drivingHoursWithDelay = drivingHoursBase * (1 + (delayRaw / 100));
      const stopHours = stopsRaw / 60;

      const totalHours = drivingHoursWithDelay + stopHours;
      const totalMs = totalHours * 60 * 60 * 1000;

      const eta = new Date(depart.getTime() + totalMs);

      const drivingMinutesBase = drivingHoursBase * 60;
      const drivingMinutesWithDelay = drivingHoursWithDelay * 60;
      const totalMinutes = totalHours * 60;

      const distanceUnitLabel = distanceUnit.value === "mi" ? "mi" : "km";
      const speedUnitLabel = speedUnit.value === "mph" ? "mph" : "km/h";

      const resultHtml =
        `<p><strong>Estimated arrival (ETA):</strong> ${formatDateTimeLocal(eta)}</p>` +
        `<p><strong>Total trip duration:</strong> ${formatDurationHoursMinutes(totalMinutes)}</p>` +
        `<p><strong>Breakdown:</strong></p>` +
        `<ul>` +
        `<li>Driving time (from distance and speed): ${formatDurationHoursMinutes(drivingMinutesBase)}</li>` +
        `<li>Delay added to driving time: ${delayRaw > 0 ? (delayRaw.toFixed(0) + "%") : "0%"} (driving becomes ${formatDurationHoursMinutes(drivingMinutesWithDelay)})</li>` +
        `<li>Stops added: ${formatDurationHoursMinutes(stopsRaw)}</li>` +
        `</ul>` +
        `<p><strong>Inputs used:</strong> ${formatNumberTwoDecimals(distRaw)} ${distanceUnitLabel} at ${formatNumberTwoDecimals(speedRaw)} ${speedUnitLabel}</p>`;

      setResultSuccess(resultHtml);
    });
  }

  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "ETA (Estimated Time of Arrival) Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
