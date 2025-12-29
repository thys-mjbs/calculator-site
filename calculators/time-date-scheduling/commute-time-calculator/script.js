document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const distanceKmInput = document.getElementById("distanceKm");
  const avgSpeedKmhInput = document.getElementById("avgSpeedKmh");
  const arrivalTimeInput = document.getElementById("arrivalTime");
  const showAdvancedInput = document.getElementById("showAdvanced");
  const advancedSection = document.getElementById("advancedSection");
  const trafficDelayMinInput = document.getElementById("trafficDelayMin");
  const bufferMinInput = document.getElementById("bufferMin");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Comma-format numeric text fields
  attachLiveFormatting(distanceKmInput);
  attachLiveFormatting(avgSpeedKmhInput);
  attachLiveFormatting(trafficDelayMinInput);
  attachLiveFormatting(bufferMinInput);

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

  // Advanced toggle
  function setAdvancedVisibility() {
    if (!advancedSection || !showAdvancedInput) return;
    if (showAdvancedInput.checked) {
      advancedSection.classList.remove("hidden");
    } else {
      advancedSection.classList.add("hidden");
    }
    clearResult();
  }

  if (showAdvancedInput) {
    setAdvancedVisibility();
    showAdvancedInput.addEventListener("change", setAdvancedVisibility);
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

  function parseTimeToMinutes(hhmm) {
    const raw = (hhmm || "").trim();
    const m = raw.match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return null;

    const hh = Number(m[1]);
    const mm = Number(m[2]);

    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
    if (hh < 0 || hh > 23) return null;
    if (mm < 0 || mm > 59) return null;

    return hh * 60 + mm;
  }

  function minutesToTimeString(totalMinutes) {
    let mins = totalMinutes % (24 * 60);
    if (mins < 0) mins += 24 * 60;

    const hh = Math.floor(mins / 60);
    const mm = mins % 60;

    const hhStr = String(hh).padStart(2, "0");
    const mmStr = String(mm).padStart(2, "0");
    return hhStr + ":" + mmStr;
  }

  function formatMinutesHuman(mins) {
    const rounded = Math.max(0, Math.round(mins));
    const h = Math.floor(rounded / 60);
    const m = rounded % 60;

    if (h <= 0) return m + " min";
    if (m === 0) return h + " hr";
    return h + " hr " + m + " min";
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      // Parse inputs using toNumber() (from /scripts/main.js)
      const distanceKm = toNumber(distanceKmInput ? distanceKmInput.value : "");
      const avgSpeedKmhRaw = toNumber(avgSpeedKmhInput ? avgSpeedKmhInput.value : "");
      const arrivalMinutes = parseTimeToMinutes(arrivalTimeInput ? arrivalTimeInput.value : "");

      const trafficDelayMin = toNumber(trafficDelayMinInput ? trafficDelayMinInput.value : "");
      const bufferMin = toNumber(bufferMinInput ? bufferMinInput.value : "");

      // Guards
      if (!distanceKmInput || !avgSpeedKmhInput || !arrivalTimeInput) return;

      // Validation (required)
      if (!validatePositive(distanceKm, "commute distance (km)")) return;

      // Average speed is optional but must be valid if provided
      let avgSpeedKmh = avgSpeedKmhRaw;
      if (!Number.isFinite(avgSpeedKmh) || avgSpeedKmh <= 0) {
        avgSpeedKmh = 50;
      }

      if (!Number.isFinite(avgSpeedKmh) || avgSpeedKmh <= 0) {
        setResultError("Enter a valid average speed (km/h) greater than 0.");
        return;
      }

      if (arrivalMinutes === null) {
        setResultError("Enter a valid arrival time in 24-hour format (HH:MM), for example 08:30.");
        return;
      }

      // Advanced defaults
      const trafficDelay = Number.isFinite(trafficDelayMin) ? trafficDelayMin : 0;
      const buffer = Number.isFinite(bufferMin) ? bufferMin : 10;

      if (!validateNonNegative(trafficDelay, "traffic delay (minutes)")) return;
      if (!validateNonNegative(buffer, "buffer (minutes)")) return;

      // Calculation
      const driveMinutes = (distanceKm / avgSpeedKmh) * 60;
      if (!Number.isFinite(driveMinutes) || driveMinutes <= 0) {
        setResultError("Check your distance and speed values.");
        return;
      }

      const totalCommuteMinutes = driveMinutes + trafficDelay + buffer;

      const leaveMinutesRaw = arrivalMinutes - totalCommuteMinutes;
      const leaveTime = minutesToTimeString(Math.round(leaveMinutesRaw));

      // Determine whether the leave time is on the previous day
      const needsPreviousDay = leaveMinutesRaw < 0;

      // Supporting figures
      const effectiveDoorToDoorSpeed = distanceKm / (totalCommuteMinutes / 60);

      const usedSpeedText = formatNumberTwoDecimals(avgSpeedKmh) + " km/h";
      const driveTimeText = formatMinutesHuman(driveMinutes);
      const totalTimeText = formatMinutesHuman(totalCommuteMinutes);

      const trafficText = Math.round(trafficDelay) + " min";
      const bufferText = Math.round(buffer) + " min";

      const dayNote = needsPreviousDay
        ? "<p><strong>Note:</strong> This leave time is on the previous day.</p>"
        : "";

      const resultHtml =
        "<p><strong>Suggested leave time:</strong> " +
        leaveTime +
        "</p>" +
        dayNote +
        "<p><strong>Total commute time (including extras):</strong> " +
        totalTimeText +
        "</p>" +
        "<p><strong>Estimated driving time:</strong> " +
        driveTimeText +
        "</p>" +
        "<p><strong>Assumptions used:</strong></p>" +
        "<ul>" +
        "<li>Distance: " + formatNumberTwoDecimals(distanceKm) + " km</li>" +
        "<li>Average speed: " + usedSpeedText + "</li>" +
        "<li>Traffic delay: " + trafficText + "</li>" +
        "<li>Buffer: " + bufferText + "</li>" +
        "<li>Effective door-to-door speed: " + formatNumberTwoDecimals(effectiveDoorToDoorSpeed) + " km/h</li>" +
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
      const message = "Commute Time Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
