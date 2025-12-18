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
  const distanceInput = document.getElementById("distanceInput");
  const distanceUnitSelect = document.getElementById("distanceUnitSelect");
  const speedInput = document.getElementById("speedInput");
  const speedUnitSelect = document.getElementById("speedUnitSelect");
  const delayMinutesInput = document.getElementById("delayMinutesInput");
  const stopsCountInput = document.getElementById("stopsCountInput");
  const minutesPerStopInput = document.getElementById("minutesPerStopInput");
  const departureTimeInput = document.getElementById("departureTimeInput");
  const roundTripCheckbox = document.getElementById("roundTripCheckbox");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  attachLiveFormatting(distanceInput);
  attachLiveFormatting(speedInput);
  attachLiveFormatting(delayMinutesInput);
  attachLiveFormatting(stopsCountInput);
  attachLiveFormatting(minutesPerStopInput);

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
  // 4) MODE HANDLING (USED)
  // ------------------------------------------------------------
  function kmhToMph(kmh) {
    return kmh / 1.609344;
  }

  function mphToKmh(mph) {
    return mph * 1.609344;
  }

  function setSpeedValue(kmhValue) {
    if (!speedInput || !speedUnitSelect) return;

    const unit = speedUnitSelect.value;
    if (unit === "mph") {
      speedInput.value = formatInputWithCommas(String(Math.round(kmhToMph(kmhValue) * 10) / 10));
    } else {
      speedInput.value = formatInputWithCommas(String(Math.round(kmhValue * 10) / 10));
    }
  }

  function getModeDefaultSpeedKmh(mode) {
    if (mode === "drivingCity") return 50;
    if (mode === "drivingHighway") return 90;
    if (mode === "publicTransport") return 30;
    if (mode === "cycling") return 15;
    if (mode === "walking") return 5;
    return null;
  }

  function showMode(mode) {
    const defaultKmh = getModeDefaultSpeedKmh(mode);

    if (mode === "custom") {
      if (speedInput) speedInput.disabled = false;
    } else {
      if (speedInput) speedInput.disabled = true;
      if (defaultKmh != null) setSpeedValue(defaultKmh);
    }

    clearResult();
  }

  if (modeSelect) {
    showMode(modeSelect.value);

    modeSelect.addEventListener("change", function () {
      showMode(modeSelect.value);
    });
  }

  if (speedUnitSelect) {
    speedUnitSelect.addEventListener("change", function () {
      // Keep displayed speed consistent when unit changes (re-render from mode default if locked)
      const mode = modeSelect ? modeSelect.value : "custom";
      const defaultKmh = getModeDefaultSpeedKmh(mode);

      if (mode !== "custom" && defaultKmh != null) {
        setSpeedValue(defaultKmh);
      }

      clearResult();
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

  function minutesToHhMm(totalMinutes) {
    const mins = Math.max(0, Math.round(totalMinutes));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const mm = String(m).padStart(2, "0");
    return h + "h " + mm + "m";
  }

  function parseTimeHHMM(text) {
    const raw = (text || "").trim();
    if (!raw) return null;
    const match = raw.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
    if (!match) return null;
    const hh = parseInt(match[1], 10);
    const mm = parseInt(match[2], 10);
    return hh * 60 + mm;
  }

  function formatTimeHHMM(totalMinutesFromMidnight) {
    const mins = ((totalMinutesFromMidnight % 1440) + 1440) % 1440;
    const hh = Math.floor(mins / 60);
    const mm = mins % 60;
    return String(hh).padStart(2, "0") + ":" + String(mm).padStart(2, "0");
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const distanceRaw = toNumber(distanceInput ? distanceInput.value : "");
      const speedRaw = toNumber(speedInput ? speedInput.value : "");
      const delayMins = toNumber(delayMinutesInput ? delayMinutesInput.value : "");
      const stopsCount = toNumber(stopsCountInput ? stopsCountInput.value : "");
      const minutesPerStop = toNumber(minutesPerStopInput ? minutesPerStopInput.value : "");

      // Input existence guard
      if (!distanceInput || !speedInput || !distanceUnitSelect || !speedUnitSelect) return;

      // Required validations
      if (!validatePositive(distanceRaw, "distance")) return;
      if (!validatePositive(speedRaw, "average speed")) return;

      // Optional validations (only if provided)
      const delayProvided = (delayMinutesInput && delayMinutesInput.value.trim() !== "");
      const stopsProvided = (stopsCountInput && stopsCountInput.value.trim() !== "");
      const perStopProvided = (minutesPerStopInput && minutesPerStopInput.value.trim() !== "");

      if (delayProvided && !validateNonNegative(delayMins, "extra delay minutes")) return;
      if (stopsProvided && !validateNonNegative(stopsCount, "stops count")) return;
      if (perStopProvided && !validateNonNegative(minutesPerStop, "minutes per stop")) return;

      // Convert to consistent units
      let distanceKm = distanceRaw;
      if (distanceUnitSelect.value === "mi") {
        distanceKm = distanceRaw * 1.609344;
      }

      let speedKmh = speedRaw;
      if (speedUnitSelect.value === "mph") {
        speedKmh = mphToKmh(speedRaw);
      }

      if (!validatePositive(distanceKm, "distance")) return;
      if (!validatePositive(speedKmh, "average speed")) return;

      // Core calculation
      const baseHours = distanceKm / speedKmh;
      const baseMinutes = baseHours * 60;

      const extraDelayMinutes = delayProvided ? delayMins : 0;
      const stopsTotalMinutes =
        (stopsProvided ? stopsCount : 0) * (perStopProvided ? minutesPerStop : 0);

      const oneWayMinutes = baseMinutes + extraDelayMinutes + stopsTotalMinutes;

      // Secondary outputs
      const roundTrip = roundTripCheckbox ? roundTripCheckbox.checked : false;
      const totalMinutes = roundTrip ? oneWayMinutes * 2 : oneWayMinutes;

      // Optional arrival time
      const departMins = parseTimeHHMM(departureTimeInput ? departureTimeInput.value : "");
      let arrivalLine = "";
      if (departMins != null) {
        const arrive = departMins + Math.round(oneWayMinutes);
        const arriveText = formatTimeHHMM(arrive);
        const nextDay = arrive >= 1440;

        arrivalLine =
          `<p><strong>Estimated arrival time:</strong> ${arriveText}` +
          (nextDay ? " (next day)" : "") +
          `</p>`;
      }

      const oneWayHhMm = minutesToHhMm(oneWayMinutes);
      const totalHhMm = minutesToHhMm(totalMinutes);

      const distanceDisplayUnit = distanceUnitSelect.value === "mi" ? "mi" : "km";
      const speedDisplayUnit = speedUnitSelect.value === "mph" ? "mph" : "km/h";

      const resultHtml =
        `<p><strong>Estimated one-way commute:</strong> ${oneWayHhMm} (${formatNumberTwoDecimals(oneWayMinutes)} minutes)</p>` +
        (roundTrip
          ? `<p><strong>Estimated round trip:</strong> ${totalHhMm} (${formatNumberTwoDecimals(totalMinutes)} minutes)</p>`
          : "") +
        arrivalLine +
        `<p><strong>Breakdown:</strong> Base travel ${minutesToHhMm(baseMinutes)} + delays ${minutesToHhMm(extraDelayMinutes)} + stops ${minutesToHhMm(stopsTotalMinutes)}</p>` +
        `<p><strong>Inputs used:</strong> ${formatNumberTwoDecimals(distanceRaw)} ${distanceDisplayUnit} at ${formatNumberTwoDecimals(speedRaw)} ${speedDisplayUnit}</p>`;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Commute Time Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
